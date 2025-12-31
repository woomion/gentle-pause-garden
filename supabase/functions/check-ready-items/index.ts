import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  console.log('🔍 [START] Checking for ready items that need email notifications...');

  try {
    const now = new Date().toISOString();
    
    // Find items that:
    // 1. Are still paused (not let-go or bought)
    // 2. review_at has passed (item is ready)
    // 3. No email has been sent yet (individual_reminder_sent_at is null)
    // 4. Looking back 7 days to catch any missed items
    const lookbackIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    console.log('📊 Query params:', { now, lookbackIso });

    const { data: readyItems, error: itemsError } = await supabase
      .from('paused_items')
      .select('id, user_id, title, store_name, url, review_at, created_at')
      .eq('status', 'paused')
      .lte('review_at', now)
      .gte('review_at', lookbackIso)
      .is('individual_reminder_sent_at', null)
      .order('review_at', { ascending: true })
      .limit(20);

    if (itemsError) {
      console.error('❌ Error fetching ready items:', itemsError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: itemsError.message 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`📬 Found ${readyItems?.length ?? 0} items ready for notification`);

    if (!readyItems || readyItems.length === 0) {
      console.log('📭 No newly ready items found');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No newly ready items found',
        processedCount: 0,
        duration: `${Date.now() - startTime}ms`
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Log each item found
    for (const item of readyItems) {
      console.log(`  📦 Item: ${item.title} (user: ${item.user_id}, review_at: ${item.review_at})`);
    }

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // Process each item individually
    for (const item of readyItems) {
      try {
        console.log(`\n🔄 Processing item: ${item.id} - "${item.title}"`);

        // Check user settings
        const { data: userSettings, error: settingsError } = await supabase
          .from('user_settings')
          .select('notifications_enabled, notification_delivery_style')
          .eq('user_id', item.user_id)
          .single();

        if (settingsError) {
          console.log(`  ⚠️ No settings for user ${item.user_id}, skipping`);
          skipCount++;
          continue;
        }

        if (!userSettings.notifications_enabled) {
          console.log(`  🔕 Notifications disabled for user, skipping`);
          skipCount++;
          continue;
        }

        if (userSettings.notification_delivery_style !== 'item_by_item') {
          console.log(`  ⏰ User prefers ${userSettings.notification_delivery_style}, skipping individual email`);
          skipCount++;
          continue;
        }

        // Get user email
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(item.user_id);
        
        if (userError || !user?.email) {
          console.error(`  ❌ Could not get email for user ${item.user_id}:`, userError);
          errorCount++;
          continue;
        }

        console.log(`  📧 Sending email to ${user.email}`);

        // ATOMIC: Mark as sent BEFORE sending to prevent duplicates
        // Use a conditional update that only succeeds if still null
        const processingTimestamp = new Date().toISOString();
        const { data: updateResult, error: updateError } = await supabase
          .from('paused_items')
          .update({ individual_reminder_sent_at: processingTimestamp })
          .eq('id', item.id)
          .is('individual_reminder_sent_at', null)
          .select('id');

        if (updateError || !updateResult || updateResult.length === 0) {
          console.log(`  ⏭️ Item already claimed by another process`);
          skipCount++;
          continue;
        }

        // Now send the email
        try {
          const emailResult = await resend.emails.send({
            from: 'Pocket Pause <notifications@pocketpause.app>',
            to: [user.email],
            subject: `Ready to review: ${item.title}`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                <div style="text-align: center; margin-bottom: 30px;">
                  <h1 style="color: #6B46C1; margin: 0; font-size: 24px;">Pocket Pause</h1>
                </div>

                <div style="background: linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                  <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #1a1a1a;">Space brings clarity ✨</h2>
                  <p style="margin: 0; color: #4a4a4a; font-size: 16px;">Your item is ready for review.</p>
                </div>

                <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
                  <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #1a1a1a;">${item.title}</h3>
                  ${item.store_name ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">from ${item.store_name}</p>` : ''}
                </div>

                <div style="text-align: center;">
                  <a href="https://pocketpause.app" style="display: inline-block; background: #6B46C1; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">Open Pocket Pause to Review</a>
                </div>

                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
                  <p>You're receiving this because you enabled email notifications for Pocket Pause.</p>
                  <p>To change your preferences, visit your settings in the app.</p>
                </div>
              </body>
              </html>
            `,
          });

          if (emailResult?.error) {
            console.error(`  ❌ Resend error:`, emailResult.error);
            // Reset the flag so it can retry
            await supabase
              .from('paused_items')
              .update({ individual_reminder_sent_at: null })
              .eq('id', item.id);
            errorCount++;
          } else {
            console.log(`  ✅ Email sent successfully!`, emailResult);
            successCount++;
          }
        } catch (emailError) {
          console.error(`  ❌ Email send failed:`, emailError);
          // Reset the flag so it can retry
          await supabase
            .from('paused_items')
            .update({ individual_reminder_sent_at: null })
            .eq('id', item.id);
          errorCount++;
        }

      } catch (itemError) {
        console.error(`  ❌ Error processing item ${item.id}:`, itemError);
        errorCount++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`\n✅ [COMPLETE] Processed ${readyItems.length} items in ${duration}ms`);
    console.log(`   Success: ${successCount}, Skipped: ${skipCount}, Errors: ${errorCount}`);

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${readyItems.length} items`,
      successCount,
      skipCount,
      errorCount,
      duration: `${duration}ms`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Fatal error in check-ready-items:", error);
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
