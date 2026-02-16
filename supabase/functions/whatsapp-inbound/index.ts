import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  type: string
  text?: { body: string }
  image?: { id: string; mime_type: string; sha256: string }
  audio?: { id: string; mime_type: string; sha256: string }
  video?: { id: string; mime_type: string; sha256: string }
  document?: { id: string; filename: string; mime_type: string; sha256: string }
}

interface WhatsAppWebhook {
  object: string
  entry: Array<{
    id: string
    changes: Array<{
      value: {
        messaging_product: string
        metadata: { display_phone_number: string; phone_number_id: string }
        contacts?: Array<{ profile: { name: string }; wa_id: string }>
        messages?: WhatsAppMessage[]
      }
      field: string
    }>
  }>
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    
    // Webhook verification (GET request)
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')
      
      const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN')
      
      if (mode === 'subscribe' && token === verifyToken) {
        console.log('Webhook verified successfully')
        return new Response(challenge, { status: 200 })
      } else {
        console.error('Webhook verification failed')
        return new Response('Forbidden', { status: 403 })
      }
    }
    
    // Handle incoming messages (POST request)
    if (req.method === 'POST') {
      const payload: WhatsAppWebhook = await req.json()
      
      console.log('Received WhatsApp webhook:', JSON.stringify(payload, null, 2))
      
      // Initialize Supabase client
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      const supabase = createClient(supabaseUrl, supabaseKey)
      
      // Process each entry
      for (const entry of payload.entry) {
        for (const change of entry.changes) {
          const { value } = change
          
          // Skip if no messages
          if (!value.messages || value.messages.length === 0) continue
          
          for (const message of value.messages) {
            try {
              // Get contact info
              const contact = value.contacts?.find(c => c.wa_id === message.from)
              const contactName = contact?.profile?.name || message.from
              
              // Upsert lead
              const { data: lead, error: leadError } = await supabase
                .from('leads')
                .upsert({
                  phone_number: `+${message.from}`,
                  full_name: contactName,
                  metadata: { last_contact: new Date().toISOString() }
                }, {
                  onConflict: 'phone_number',
                  ignoreDuplicates: false
                })
                .select()
                .single()
              
              if (leadError) {
                console.error('Error upserting lead:', leadError)
                continue
              }
              
              // Find or create conversation
              let { data: conversation, error: convError } = await supabase
                .from('conversations')
                .select('*')
                .eq('lead_id', lead.id)
                .eq('channel', 'whatsapp')
                .eq('is_archived', false)
                .single()
              
              if (convError && convError.code === 'PGRST116') {
                // Conversation doesn't exist, create it
                const { data: newConv, error: createError } = await supabase
                  .from('conversations')
                  .insert({
                    lead_id: lead.id,
                    channel: 'whatsapp',
                    channel_thread_id: message.from,
                    status_pipeline: 'nuevo',
                    last_message_at: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                    unread_count: 1
                  })
                  .select()
                  .single()
                
                if (createError) {
                  console.error('Error creating conversation:', createError)
                  continue
                }
                
                conversation = newConv
              } else if (convError) {
                console.error('Error fetching conversation:', convError)
                continue
              }
              
              // Determine message type and content
              let messageType = 'text'
              let content = ''
              let mediaUrl = null
              
              if (message.text) {
                messageType = 'text'
                content = message.text.body
              } else if (message.image) {
                messageType = 'image'
                content = '[Imagen]'
                // Note: To download media, you need to call WhatsApp API with the media ID
                // For now, we'll store the media ID
                mediaUrl = message.image.id
              } else if (message.audio) {
                messageType = 'audio'
                content = '[Audio]'
                mediaUrl = message.audio.id
              } else if (message.video) {
                messageType = 'video'
                content = '[Video]'
                mediaUrl = message.video.id
              } else if (message.document) {
                messageType = 'document'
                content = `[Documento: ${message.document.filename}]`
                mediaUrl = message.document.id
              }
              
              // Insert message
              const { error: messageError } = await supabase
                .from('messages')
                .insert({
                  conversation_id: conversation.id,
                  channel: 'whatsapp',
                  sender_type: 'customer',
                  message_type: messageType,
                  content: content,
                  media_url: mediaUrl,
                  external_message_id: message.id,
                  created_at: new Date(parseInt(message.timestamp) * 1000).toISOString()
                })
              
              if (messageError) {
                console.error('Error inserting message:', messageError)
                continue
              }
              
              // Send push notification if conversation is assigned
              if (conversation.owner_id) {
                try {
                  await supabase.functions.invoke('send-push-notification', {
                    body: {
                      user_id: conversation.owner_id,
                      title: `Nuevo mensaje de ${contactName}`,
                      body: content.substring(0, 100),
                      data: {
                        conversation_id: conversation.id,
                        type: 'new_message'
                      }
                    }
                  })
                } catch (pushError) {
                  console.error('Error sending push notification:', pushError)
                }
              }
              
              console.log(`Message processed successfully for conversation ${conversation.id}`)
            } catch (error) {
              console.error('Error processing message:', error)
            }
          }
        }
      }
      
      // Always return 200 to acknowledge receipt
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      })
    }
    
    return new Response('Method not allowed', { status: 405 })
  } catch (error) {
    console.error('Error in whatsapp-inbound:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
