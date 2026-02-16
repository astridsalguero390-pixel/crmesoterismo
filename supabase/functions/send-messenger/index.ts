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

        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing authorization' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401
            })
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey, {
            global: { headers: { Authorization: authHeader } }
        })

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 401
            })
        }

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

        const fbPsid = conversation.leads.fb_psid
        if (!fbPsid) {
            return new Response(JSON.stringify({ error: 'Lead has no Facebook PSID' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            })
        }

        const fbPageAccessToken = Deno.env.get('FB_PAGE_ACCESS_TOKEN')!

        let messagePayload: any = {
            recipient: { id: fbPsid },
        }

        if (message_type === 'text') {
            messagePayload.message = { text: content }
        } else if (message_type === 'image' && media_url) {
            messagePayload.message = {
                attachment: {
                    type: 'image',
                    payload: { url: media_url }
                }
            }
        } else if (message_type === 'video' && media_url) {
            messagePayload.message = {
                attachment: {
                    type: 'video',
                    payload: { url: media_url }
                }
            }
        } else if (message_type === 'audio' && media_url) {
            messagePayload.message = {
                attachment: {
                    type: 'audio',
                    payload: { url: media_url }
                }
            }
        } else {
            return new Response(JSON.stringify({ error: 'Invalid message type or missing media_url' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            })
        }

        const fbResponse = await fetch(
            `https://graph.facebook.com/v18.0/me/messages?access_token=${fbPageAccessToken}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(messagePayload)
            }
        )

        const fbData = await fbResponse.json()

        if (!fbResponse.ok) {
            console.error('Messenger API error:', fbData)
            return new Response(JSON.stringify({ error: 'Failed to send Messenger message', details: fbData }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            })
        }

        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabaseService = createClient(supabaseUrl, supabaseServiceKey)

        const { data: message, error: messageError } = await supabaseService
            .from('messages')
            .insert({
                conversation_id: conversation_id,
                channel: 'messenger',
                sender_type: 'agent',
                message_type: message_type,
                content: content,
                media_url: media_url,
                external_message_id: fbData.message_id,
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

        return new Response(JSON.stringify({ success: true, message, fb_message_id: fbData.message_id }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })
    } catch (error) {
        console.error('Error in send-messenger:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        })
    }
})
