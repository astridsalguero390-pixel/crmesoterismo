import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { conversation_id, message_type = 'text', content, media_url } = await req.json()

        // Get auth token
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401
            })
        }

        // Initialize Supabase client with user's token
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } }
        })

        // Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401
            })
        }

        // Get conversation (RLS will check permissions)
        const { data: conversation, error: convError } = await supabase
            .from('conversations')
            .select('*, leads(*)')
            .eq('id', conversation_id)
            .single()

        if (convError || !conversation) {
            return new Response(JSON.stringify({ error: 'Conversation not found or access denied' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 404
            })
        }

        // Get lead phone number
        const phoneNumber = conversation.leads.phone_number
        if (!phoneNumber) {
            return new Response(JSON.stringify({ error: 'Lead has no phone number' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            })
        }

        // Prepare WhatsApp API request
        const whatsappToken = Deno.env.get('WHATSAPP_TOKEN')!
        const phoneNumberId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')!

        let messagePayload: any = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: phoneNumber.replace('+', ''),
        }

        // Build message based on type
        if (message_type === 'text') {
            messagePayload.type = 'text'
            messagePayload.text = { body: content }
        } else if (message_type === 'image' && media_url) {
            messagePayload.type = 'image'
            messagePayload.image = { link: media_url }
        } else if (message_type === 'audio' && media_url) {
            messagePayload.type = 'audio'
            messagePayload.audio = { link: media_url }
        } else if (message_type === 'video' && media_url) {
            messagePayload.type = 'video'
            messagePayload.video = { link: media_url }
        } else if (message_type === 'document' && media_url) {
            messagePayload.type = 'document'
            messagePayload.document = { link: media_url }
        } else {
            return new Response(JSON.stringify({ error: 'Invalid message type or missing media_url' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            })
        }

        // Send message via WhatsApp API
        const whatsappResponse = await fetch(
            `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${whatsappToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messagePayload)
            }
        )

        const whatsappData = await whatsappResponse.json()

        if (!whatsappResponse.ok) {
            console.error('WhatsApp API error:', whatsappData)
            return new Response(JSON.stringify({ error: 'Failed to send WhatsApp message', details: whatsappData }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            })
        }

        // Use service role to insert message (bypass RLS)
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

        // Insert outbound message
        const { data: message, error: messageError } = await supabaseService
            .from('messages')
            .insert({
                conversation_id: conversation_id,
                channel: 'whatsapp',
                sender_type: 'agent',
                message_type: message_type,
                content: content,
                media_url: media_url,
                external_message_id: whatsappData.messages?.[0]?.id,
                status: 'sent'
            })
            .select()
            .single()

        if (messageError) {
            console.error('Error inserting message:', messageError)
            return new Response(JSON.stringify({ error: 'Message sent but failed to save in database' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            })
        }

        return new Response(JSON.stringify({ success: true, message, whatsapp_message_id: whatsappData.messages?.[0]?.id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })
    } catch (error) {
        console.error('Error in send-whatsapp:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        })
    }
})
