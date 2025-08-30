import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 Starting notification scheduler...');

    // Check for newly ready items that need individual notifications
    console.log('📋 Checking for ready items...');
    const { data: checkData, error: checkError } = await supabase.functions.invoke('check-ready-items');

    if (checkError) {
      console.error('❌ Error checking ready items:', checkError);
    } else {
      console.log('✅ Check ready items result:', checkData);
    }

    // Get users with ready items for push notifications
    const now = new Date().toISOString();
    const { data: usersWithReadyItems, error: usersError } = await supabase
      .from('paused_items')
      .select(`
        user_id,
        title,
        store_name,
        price
      `)
      .eq('status', 'paused')
      .lte('review_at', now)
      .limit(50);

    if (usersError) {
      console.error('❌ Error fetching users with ready items:', usersError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: usersError.message 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!usersWithReadyItems || usersWithReadyItems.length === 0) {
      console.log('📭 No users with ready items found');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No users with ready items found',
        checkResult: checkData
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Group items by user
    const userItemsMap = new Map<string, typeof usersWithReadyItems>();
    for (const item of usersWithReadyItems) {
      if (!userItemsMap.has(item.user_id)) {
        userItemsMap.set(item.user_id, []);
      }
      userItemsMap.get(item.user_id)!.push(item);
    }

    console.log(`📱 Found ${userItemsMap.size} users with ready items`);

    let pushNotificationCount = 0;

    // Send push notifications for each user
    for (const [userId, items] of userItemsMap) {
      try {
        // Check user notification settings
        const { data: userSettings, error: settingsError } = await supabase
          .from('user_settings')
          .select('notifications_enabled, push_token')
          .eq('user_id', userId)
          .single();

        if (settingsError || !userSettings?.notifications_enabled || !userSettings?.push_token) {
          console.log(`⏭️ Skipping push notification for user ${userId} (no settings or token)`);
          continue;
        }

        const title = items.length === 1 
          ? 'Time to review your paused item!'
          : `Time to review ${items.length} paused items!`;
        
        const body = items.length === 1
          ? `"${items[0].title}" is ready for a thoughtful decision.`
          : 'Some of your paused items are ready for thoughtful decisions.';

        console.log(`📤 Sending push notification to user ${userId}:`, { title, body });

        const { data: pushData, error: pushError } = await supabase.functions.invoke('send-push-notifications', {
          body: { 
            userIds: [userId], 
            title, 
            body,
            data: {
              action: 'review_items',
              count: items.length
            }
          }
        });

        if (pushError) {
          console.error(`❌ Failed to send push notification to user ${userId}:`, pushError);
        } else {
          console.log(`✅ Push notification sent to user ${userId}:`, pushData);
          pushNotificationCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing push notification for user ${userId}:`, error);
      }
    }

    console.log(`✅ Notification scheduler complete: ${pushNotificationCount} push notifications sent`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Notification scheduler complete`,
      pushNotificationsSent: pushNotificationCount,
      usersProcessed: userItemsMap.size,
      checkResult: checkData
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Error in notification scheduler:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);