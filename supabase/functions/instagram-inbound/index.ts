import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InstagramMessage {
    sender: { id: string }
    recipient: { id: string }
    timestamp: number
    message: {
        mid: string
        text?: string
        attachments?: Array<{
            type: string
            payload: { url: string }
        }>
    }
}

interface InstagramWebhook {
    object: string
    entry: Array<{
        id: string
        time: number
        messaging: InstagramMessage[]
    }>
}

serve(async (req) => {
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

            const verifyToken = Deno.env.get('IG_VERIFY_TOKEN') || Deno.env.get('WHATSAPP_VERIFY_TOKEN')

            if (mode === 'subscribe' && token === verifyToken) {
                console.log('Instagram webhook verified successfully')
                return new Response(challenge, { status: 200 })
            } else {
                console.error('Instagram webhook verification failed')
                return new Response('Forbidden', { status: 403 })
            }
        }

        // Handle incoming messages (POST request)
        if (req.method === 'POST') {
            const payload: InstagramWebhook = await req.json()

            console.log('Received Instagram webhook:', JSON.stringify(payload, null, 2))

            // Initialize Supabase client
            const supabaseUrl = Deno.env.get('SUPABASE_URL')!
            const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
            const supabase = createClient(supabaseUrl, supabaseKey)

            // Process each entry
            for (const entry of payload.entry) {
                if (!entry.messaging) continue

                for (const messagingEvent of entry.messaging) {
                    try {
                        const senderId = messagingEvent.sender.id
                        const message = messagingEvent.message

                        // Skip if no message
                        if (!message) continue

                        // Upsert lead
                        const { data: lead, error: leadError } = await supabase
                            .from('leads')
                            .upsert({
                                ig_scoped_id: senderId,
                                full_name: `IG User ${senderId.substring(0, 8)}`,
                                metadata: { last_contact: new Date().toISOString(), platform: 'instagram' }
                            }, {
                                onConflict: 'ig_scoped_id',
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
                            .eq('channel', 'instagram')
                            .eq('is_archived', false)
                            .single()

                        if (convError && convError.code === 'PGRST116') {
                            // Conversation doesn't exist, create it
                            const { data: newConv, error: createError } = await supabase
                                .from('conversations')
                                .insert({
                                    lead_id: lead.id,
                                    channel: 'instagram',
                                    channel_thread_id: senderId,
                                    status_pipeline: 'nuevo',
                                    last_message_at: new Date(messagingEvent.timestamp).toISOString(),
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
                            content = message.text
                        } else if (message.attachments && message.attachments.length > 0) {
                            const attachment = message.attachments[0]
                            if (attachment.type === 'image') {
                                messageType = 'image'
                                content = '[Imagen]'
                                mediaUrl = attachment.payload.url
                            } else if (attachment.type === 'video') {
                                messageType = 'video'
                                content = '[Video]'
                                mediaUrl = attachment.payload.url
                            } else if (attachment.type === 'audio') {
                                messageType = 'audio'
                                content = '[Audio]'
                                mediaUrl = attachment.payload.url
                            } else {
                                messageType = 'document'
                                content = '[Archivo]'
                                mediaUrl = attachment.payload.url
                            }
                        }

                        // Insert message
                        const { error: messageError } = await supabase
                            .from('messages')
                            .insert({
                                conversation_id: conversation.id,
                                channel: 'instagram',
                                sender_type: 'customer',
                                message_type: messageType,
                                content: content,
                                media_url: mediaUrl,
                                external_message_id: message.mid,
                                created_at: new Date(messagingEvent.timestamp).toISOString()
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
                                        title: `Nuevo mensaje de Instagram`,
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

                        console.log(`Instagram message processed successfully for conversation ${conversation.id}`)
                    } catch (error) {
                        console.error('Error processing Instagram message:', error)
                    }
                }
            }

            return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            })
        }

        return new Response('Method not allowed', { status: 405 })
    } catch (error) {
        console.error('Error in instagram-inbound:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        })
    }
})
