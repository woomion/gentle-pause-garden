import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  userIds?: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { userIds, title, body, data }: NotificationPayload = await req.json();

      if (!title || !body) {
        return new Response(
          JSON.stringify({ error: 'Title and body are required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Get push tokens for specified users or all users if no userIds provided
      let query = supabase
        .from('user_settings')
        .select('user_id, push_token, platform')
        .not('push_token', 'is', null);

      if (userIds && userIds.length > 0) {
        query = query.in('user_id', userIds);
      }

      const { data: users, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching push tokens:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch push tokens' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (!users || users.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: 'No users with push tokens found', sent: 0 }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Send notifications using FCM (Firebase Cloud Messaging)
      const fcmServerKey = Deno.env.get('FCM_SERVER_KEY');
      if (!fcmServerKey) {
        console.error('FCM_SERVER_KEY not configured');
        return new Response(
          JSON.stringify({ error: 'Push notification service not configured' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const results = await Promise.allSettled(
        users.map(async (user) => {
          const pushPayload = {
            to: user.push_token,
            notification: {
              title,
              body,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: 'pocket-pause-notification',
              click_action: 'FLUTTER_NOTIFICATION_CLICK'
            },
            data: {
              ...data,
              userId: user.user_id
            },
            android: {
              notification: {
                channel_id: 'pocket_pause_notifications',
                sound: 'default',
                priority: 'high'
              }
            },
            apns: {
              payload: {
                aps: {
                  alert: {
                    title,
                    body
                  },
                  badge: 1,
                  sound: 'default'
                }
              }
            }
          };

          const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
              'Authorization': `key=${fcmServerKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(pushPayload)
          });

          const result = await response.json();
          
          if (!response.ok) {
            console.error(`Failed to send notification to user ${user.user_id}:`, result);
            throw new Error(`FCM error: ${result.error || 'Unknown error'}`);
          }

          console.log(`Notification sent successfully to user ${user.user_id}`);
          return result;
        })
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      console.log(`Notifications sent: ${successful} successful, ${failed} failed`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Notifications processed`,
          sent: successful,
          failed: failed,
          total: users.length
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})