import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import * as webpush from 'npm:web-push@3.6.6'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { user_id, title, body, data } = await req.json()

        if (!user_id || !title || !body) {
            return new Response(JSON.stringify({ error: 'Missing required fields: user_id, title, body' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            })
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Get user's push subscriptions
        const { data: subscriptions, error: subError } = await supabase
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', user_id)

        if (subError) {
            console.error('Error fetching subscriptions:', subError)
            return new Response(JSON.stringify({ error: 'Failed to fetch subscriptions' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            })
        }

        if (!subscriptions || subscriptions.length === 0) {
            console.log(`No push subscriptions found for user ${user_id}`)
            return new Response(JSON.stringify({ success: true, sent: 0, message: 'No subscriptions found' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            })
        }

        // Configure VAPID
        const vapidPublicKey = Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY')!
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY')!

        webpush.setVapidDetails(
            'mailto:admin@crm-esoterico.com',
            vapidPublicKey,
            vapidPrivateKey
        )

        // Prepare notification payload
        const notificationPayload = JSON.stringify({
            title,
            body,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            data: data || {}
        })

        // Send push notifications
        const results = []
        const failedSubscriptions = []

        for (const subscription of subscriptions) {
            try {
                const pushSubscription = {
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.p256dh,
                        auth: subscription.auth
                    }
                }

                await webpush.sendNotification(pushSubscription, notificationPayload)
                results.push({ subscription_id: subscription.id, status: 'sent' })
            } catch (error) {
                console.error(`Failed to send push to subscription ${subscription.id}:`, error)
                results.push({ subscription_id: subscription.id, status: 'failed', error: error.message })

                // If subscription is expired/invalid, mark for deletion
                if (error.statusCode === 410 || error.statusCode === 404) {
                    failedSubscriptions.push(subscription.id)
                }
            }
        }

        // Remove failed subscriptions
        if (failedSubscriptions.length > 0) {
            await supabase
                .from('push_subscriptions')
                .delete()
                .in('id', failedSubscriptions)
        }

        const successCount = results.filter(r => r.status === 'sent').length

        return new Response(JSON.stringify({
            success: true,
            sent: successCount,
            total: subscriptions.length,
            results
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        })
    } catch (error) {
        console.error('Error in send-push-notification:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        })
    }
})
