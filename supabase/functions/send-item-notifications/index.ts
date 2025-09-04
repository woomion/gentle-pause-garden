import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  userId?: string;
  itemId?: string;
  type: 'individual' | 'batch';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔔 Item notification function called with method:', req.method);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const progressierApiKey = Deno.env.get('PROGRESSIER_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Accept both GET and POST requests to handle different trigger types
    if (req.method !== 'POST' && req.method !== 'GET') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let payload: NotificationPayload;
    
    if (req.method === 'GET') {
      // Handle GET requests from database triggers (batch check)
      payload = { type: 'batch' };
    } else {
      // Handle POST requests with specific payload
      payload = await req.json();
    }
    
    console.log('📨 Notification payload:', payload);

    if (payload.type === 'individual' && payload.itemId && payload.userId) {
      // Send individual notification for a specific item
      await sendIndividualNotification(supabase, progressierApiKey, payload.userId, payload.itemId);
    } else if (payload.type === 'batch') {
      // Send batch notifications for all users who have daily batch enabled
      await sendBatchNotifications(supabase, progressierApiKey);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Notifications processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in item notification function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function sendIndividualNotification(
  supabase: any, 
  progressierApiKey: string, 
  userId: string, 
  itemId: string
) {
  console.log(`📱 Sending individual notification for item ${itemId} to user ${userId}`);

  // Check if user has individual notifications enabled
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('notification_delivery_style, notifications_enabled')
    .eq('user_id', userId)
    .single();

  if (!userSettings?.notifications_enabled || userSettings?.notification_delivery_style !== 'item_by_item') {
    console.log(`❌ Skipping user ${userId}: individual notifications not enabled`);
    return;
  }

  
  // IMMEDIATELY mark as being processed to prevent duplicates from concurrent calls
  console.log('🔒 Marking item as being processed to prevent duplicate notifications');
  const processingTimestamp = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('paused_items')
    .update({ individual_reminder_sent_at: processingTimestamp })
    .eq('id', itemId)
    .eq('user_id', userId)
    .is('individual_reminder_sent_at', null); // Only update if not already processed

  if (updateError) {
    console.error('❌ Error marking item as processed:', updateError);
    return;
  }

  // Verify the update was successful (no other process beat us to it)
  const { data: checkItem } = await supabase
    .from('paused_items')
    .select('individual_reminder_sent_at, title, store_name')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  if (!checkItem || checkItem.individual_reminder_sent_at !== processingTimestamp) {
    console.log('⏭️ Item already processed by another instance, skipping');
    return;
  }

  console.log(`📱 Processing individual notification for item ${itemId} to user ${userId}`);

  // Send individual notification with proper content
  const notificationData = {
    title: "Space brings clarity. Your item is ready for review.",
    body: `${checkItem.title}${checkItem.store_name ? ` from ${checkItem.store_name}` : ''} is ready for review.`,
    data: {
      itemId: itemId,
      userId: userId,
      type: 'individual'
    }
  };

  try {
    // Use the send-push-notifications function instead of calling Progressier directly
    console.log(`📤 Sending notification via send-push-notifications function for user ${userId}`);
    
    const { data, error } = await supabase.functions.invoke('send-push-notifications', {
      body: {
        userIds: [userId],
        title: notificationData.title,
        body: notificationData.body,
        data: notificationData.data
      }
    });

    if (error) {
      console.error(`❌ Failed to send individual notification:`, error);
      // Timestamp already set above, no need to update again
    } else {
      console.log(`✅ Individual notification sent for item ${itemId}`);
      // Timestamp already set above, no need to update again
    }
  } catch (error) {
    console.error('❌ Error sending individual notification:', error);
    // Timestamp already set above - we attempted to send it, don't retry automatically
  }
}

async function sendBatchNotifications(supabase: any, progressierApiKey: string) {
  console.log('📱 Sending batch notifications');

  // Get all users with batch notifications enabled at the current hour
  const currentHour = new Date().getUTCHours();
  
  const { data: users } = await supabase
    .from('user_settings')
    .select('user_id, notification_timing_hour, timezone')
    .eq('notifications_enabled', true)
    .eq('notification_delivery_style', 'daily_batch')
    .eq('notification_timing_hour', currentHour);

  if (!users || users.length === 0) {
    console.log('❌ No users found for batch notifications at this hour');
    return;
  }

  for (const user of users) {
    try {
      // Get ready items for this user
      const { data: readyItems } = await supabase
        .from('paused_items')
        .select('id, title, store_name')
        .eq('user_id', user.user_id)
        .eq('status', 'paused')
        .lte('review_at', new Date().toISOString());

      if (!readyItems || readyItems.length === 0) {
        console.log(`❌ No ready items for user ${user.user_id}`);
        continue;
      }

      // Send batch notification
      const itemCount = readyItems.length;
      const itemText = itemCount === 1 ? 'item' : 'items';
      
      const notificationData = {
        title: `It's time to meet your paused ${itemText} again.`,
        body: `You have ${itemCount} ${itemText} ready for review.`,
        data: {
          userId: user.user_id,
          type: 'batch',
          itemCount: itemCount
        }
      };

      // Use the send-push-notifications function for consistency
      const { data, error } = await supabase.functions.invoke('send-push-notifications', {
        body: {
          userIds: [user.user_id],
          title: notificationData.title,
          body: notificationData.body,
          data: notificationData.data
        }
      });

      if (error) {
        console.error(`❌ Failed to send batch notification to user ${user.user_id}:`, error);
      } else {
        console.log(`✅ Batch notification sent to user ${user.user_id} for ${itemCount} items`);
      }
    } catch (error) {
      console.error(`❌ Error sending batch notification to user ${user.user_id}:`, error);
    }
  }
}