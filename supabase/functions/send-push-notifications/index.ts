import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    console.log('🔔 Push notification function called');

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const payload: NotificationPayload = await req.json();
    console.log('📨 Notification payload:', payload);

    if (!payload.title || !payload.body) {
      return new Response(JSON.stringify({ error: 'Missing title or body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let usersToNotify: string[] = [];

    if (payload.userIds && payload.userIds.length > 0) {
      usersToNotify = payload.userIds;
    } else {
      // If no specific users, get all users with notifications enabled
      const { data: users, error } = await supabase
        .from('user_settings')
        .select('user_id')
        .eq('notifications_enabled', true);

      if (error) {
        console.error('Error fetching users:', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch users' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      usersToNotify = users?.map(u => u.user_id) || [];
    }

    console.log(`📱 Processing notifications for ${usersToNotify.length} users`);

    let successCount = 0;
    let failureCount = 0;

    for (const userId of usersToNotify) {
      try {
        // Get user's notification settings and push tokens
        const [settingsResult, tokensResult] = await Promise.all([
          supabase
            .from('user_settings')
            .select('notifications_enabled')
            .eq('user_id', userId)
            .single(),
          supabase
            .from('push_tokens')
            .select('token, platform')
            .eq('user_id', userId)
        ]);

        const { data: userSettings, error: settingsError } = settingsResult;
        const { data: userTokens, error: tokensError } = tokensResult;

        if (settingsError || !userSettings?.notifications_enabled) {
          console.log(`❌ Skipping user ${userId}: notifications disabled`);
          failureCount++;
          continue;
        }

        if (tokensError || !userTokens || userTokens.length === 0) {
          console.log(`❌ Skipping user ${userId}: no push tokens found`);
          failureCount++;
          continue;
        }

        // Send push notification via Progressier API
        const progressierApiKey = Deno.env.get('PROGRESSIER_API_KEY');
        console.log(`🔑 Progressier API key exists: ${progressierApiKey ? 'YES' : 'NO'}`);
        
        if (!progressierApiKey) {
          console.error('❌ Progressier API key not found');
          failureCount++;
          continue;
        }

        try {
          // Get user email for targeting
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
          
          if (userError || !userData?.user?.email) {
            console.error(`❌ Could not get user email for ${userId}:`, userError);
            failureCount++;
            continue;
          }

          // Try the correct Progressier API endpoint for sending notifications
          const notificationPayload = {
            title: payload.title,
            body: payload.body,
            url: "https://cnjznmbgxprsrovmdywe.supabase.co",
            email: userData.user.email,
            icon: 'https://cnjznmbgxprsrovmdywe.supabase.co/icons/app-icon-512.png',
            badge: 'https://cnjznmbgxprsrovmdywe.supabase.co/icons/app-icon-512.png'
          };

          console.log(`📤 Sending notification to ${userData.user.email}:`, notificationPayload);

          // Try the webhook URL instead of direct API
          const progressierWebhookUrl = `https://progressier.app/webhooks/${progressierApiKey}/push`;
          
          const response = await fetch(progressierWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(notificationPayload)
          });

          console.log(`📥 Progressier webhook response status: ${response.status}`);
          const responseText = await response.text();
          console.log(`📥 Progressier webhook response:`, responseText);

          if (response.ok) {
            console.log(`📧 Notification sent to ${userData.user.email}`);
            successCount++;
          } else {
            console.error(`❌ Failed to send to ${userData.user.email} (${response.status}):`, responseText);
            failureCount++;
          }
        } catch (pushError) {
          console.error(`❌ Push error for user ${userId}:`, pushError);
          failureCount++;
        }

      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
        failureCount++;
      }
    }

    console.log(`✅ Push notification summary: ${successCount} processed, ${failureCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      sent: successCount,
      failed: failureCount,
      message: 'Push notifications processed (development mode - logged only)'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in push notification function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});