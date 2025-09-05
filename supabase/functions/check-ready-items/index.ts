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
    console.log('🔍 Checking for newly ready items...');

    // Find items that are ready for review and haven't been notified yet
    // This ensures we notify for all ready items that haven't been notified
    const now = new Date().toISOString();
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { data: readyItems, error: itemsError } = await supabase
      .from('paused_items')
      .select('id, user_id, title, review_at, individual_reminder_sent_at, created_at')
      .eq('status', 'paused')
      .lte('review_at', now) // Items that are ready now
      .lte('created_at', fiveMinutesAgo) // Only items created more than 5 minutes ago (avoid immediate notifications)
      .is('individual_reminder_sent_at', null) // Haven't been notified yet
      .limit(50); // Process in batches to avoid timeouts

    if (itemsError) {
      console.error('Error fetching ready items:', itemsError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: itemsError.message 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!readyItems || readyItems.length === 0) {
      console.log('📭 No newly ready items found');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No newly ready items found',
        processedCount: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`📬 Found ${readyItems.length} newly ready items`);

    // Group items by user to check settings once per user
    const itemsByUser = new Map<string, typeof readyItems>();
    for (const item of readyItems) {
      if (!itemsByUser.has(item.user_id)) {
        itemsByUser.set(item.user_id, []);
      }
      itemsByUser.get(item.user_id)!.push(item);
    }

    let processedCount = 0;
    let successCount = 0;
    let skipCount = 0;

    // Process each user's items
    for (const [userId, userItems] of itemsByUser) {
      try {
        console.log(`👤 Processing ${userItems.length} items for user ${userId}`);

        // Check user settings
        const { data: userSettings, error: settingsError } = await supabase
          .from('user_settings')
          .select('notifications_enabled, notification_delivery_style')
          .eq('user_id', userId)
          .single();

        if (settingsError || !userSettings) {
          console.log(`⚠️ No settings found for user ${userId}, skipping`);
          skipCount += userItems.length;
          continue;
        }

        // Skip if notifications disabled
        if (!userSettings.notifications_enabled) {
          console.log(`🔕 Notifications disabled for user ${userId}, skipping`);
          skipCount += userItems.length;
          continue;
        }

        // Process items based on notification delivery style
        if (userSettings.notification_delivery_style === 'item_by_item') {
          console.log(`📱 Sending individual notifications for user ${userId}`);
          
          // Send individual notification for each item
          for (const item of userItems) {
            try {
              const { error: notificationError } = await supabase.functions.invoke('send-item-notifications', {
                body: {
                  type: 'individual',
                  userId: userId,
                  itemId: item.id
                }
              });

              if (notificationError) {
                console.error(`❌ Error sending notification for item ${item.id}:`, notificationError);
                skipCount++;
              } else {
                console.log(`✅ Individual notification sent for item ${item.id}`);
                successCount++;
              }
              processedCount++;
            } catch (error) {
              console.error(`❌ Error processing item ${item.id}:`, error);
              skipCount++;
              processedCount++;
            }
          }
        } else {
          console.log(`⏰ User ${userId} has ${userSettings.notification_delivery_style} delivery style, skipping individual notifications`);
          skipCount += userItems.length;
        }
      } catch (error) {
        console.error(`❌ Error processing user ${userId}:`, error);
        skipCount += userItems.length;
      }
    }

    console.log(`✅ Processing complete: ${processedCount} processed, ${successCount} notifications sent, ${skipCount} skipped`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${processedCount} items, sent ${successCount} notifications, skipped ${skipCount}`,
      processedCount,
      successCount,
      skipCount
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in check-ready-items function:", error);
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