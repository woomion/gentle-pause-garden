import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  userId?: string;
  itemId?: string;
  type: 'individual' | 'batch';
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 Item notification function called with method:', req.method);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
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
      // Send individual email for a specific item
      await sendIndividualEmail(supabase, payload.userId, payload.itemId);
    } else if (payload.type === 'batch') {
      // Send batch emails for all users who have daily batch enabled
      await sendBatchEmails(supabase);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Email notifications processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in item notification function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: (error as Error).message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

async function sendIndividualEmail(
  supabase: any, 
  userId: string, 
  itemId: string
) {
  console.log(`📧 Sending individual email for item ${itemId} to user ${userId}`);

  // Check if user has email notifications enabled
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('notification_delivery_style, notifications_enabled')
    .eq('user_id', userId)
    .single();

  if (!userSettings?.notifications_enabled || userSettings?.notification_delivery_style !== 'item_by_item') {
    console.log(`❌ Skipping user ${userId}: individual email notifications not enabled`);
    return;
  }

  // Get user's email from auth
  const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
  
  if (userError || !user?.email) {
    console.error('❌ Error fetching user email:', userError);
    return;
  }

  // Get item details and check if already processed in one query
  const { data: item, error: itemError } = await supabase
    .from('paused_items')
    .select('id, individual_reminder_sent_at, title, store_name, url')
    .eq('id', itemId)
    .eq('user_id', userId)
    .single();

  if (itemError || !item) {
    console.error('❌ Error fetching item:', itemError);
    return;
  }

  // If already processed, skip
  if (item.individual_reminder_sent_at) {
    console.log('⏭️ Item already has reminder sent, skipping');
    return;
  }

  // Mark as being processed using atomic update with .is() check
  // NOTE: We use individual_reminder_sent_at as a lock.
  // If sending fails, we reset it to null so the cron can retry.
  const processingTimestamp = new Date().toISOString();
  console.log('🔒 Marking item as being processed to prevent duplicate emails', {
    itemId,
    userId,
    processingTimestamp,
  });

  const { data: updateResult, error: updateError } = await supabase
    .from('paused_items')
    .update({ individual_reminder_sent_at: processingTimestamp })
    .eq('id', itemId)
    .eq('user_id', userId)
    .is('individual_reminder_sent_at', null)
    .select('id');

  // If no rows updated, another process beat us to it
  if (updateError || !updateResult || updateResult.length === 0) {
    console.log('⏭️ Item already processed by another instance, skipping');
    return;
  }

  console.log('✅ Successfully claimed item for email processing');

  const itemTitle = item.title;
  const storeName = item.store_name;
  const itemUrl = item.url;

  let emailSent = false;

  try {
    console.log(`📤 Sending email to ${user.email} for item: ${itemTitle}`);

    const emailResponse: any = await resend.emails.send({
      from: 'Pocket Pause <notifications@pocketpause.app>',
      to: [user.email],
      subject: `Ready to review: ${itemTitle}`,
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
            <h3 style="margin: 0 0 8px 0; font-size: 18px; color: #1a1a1a;">${itemTitle}</h3>
            ${storeName ? `<p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">from ${storeName}</p>` : ''}
            ${itemUrl ? `<a href="${itemUrl}" style="display: inline-block; background: #6B46C1; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 500; font-size: 14px;">View Item</a>` : ''}
          </div>

          <div style="text-align: center;">
            <a href="https://pocketpause.app" style="display: inline-block; background: #1a1a1a; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">Open Pocket Pause</a>
          </div>

          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
            <p>You're receiving this because you enabled email notifications for Pocket Pause.</p>
            <p>To change your preferences, visit your settings in the app.</p>
          </div>
        </body>
        </html>
      `,
    });

    if (emailResponse?.error) {
      console.error('❌ Failed to send email via Resend:', emailResponse.error);
    } else {
      emailSent = true;
      console.log('✅ Email sent successfully:', emailResponse);
    }
  } catch (error) {
    console.error('❌ Error sending email:', error);
  }

  // If email was NOT sent, clear the lock so cron can retry.
  if (!emailSent) {
    console.log('↩️ Clearing individual_reminder_sent_at so the system can retry', {
      itemId,
      userId,
    });

    const { error: resetError } = await supabase
      .from('paused_items')
      .update({ individual_reminder_sent_at: null })
      .eq('id', itemId)
      .eq('user_id', userId)
      .eq('individual_reminder_sent_at', processingTimestamp);

    if (resetError) {
      console.error('❌ Failed to reset individual_reminder_sent_at after send failure:', resetError);
    }
  }
}

async function sendBatchEmails(supabase: any) {
  console.log('📧 Sending batch emails');

  // Get all users with batch notifications enabled at the current hour
  const currentHour = new Date().getUTCHours();
  
  const { data: users } = await supabase
    .from('user_settings')
    .select('user_id, notification_timing_hour, timezone')
    .eq('notifications_enabled', true)
    .eq('notification_delivery_style', 'daily_batch')
    .eq('notification_timing_hour', currentHour);

  if (!users || users.length === 0) {
    console.log('❌ No users found for batch emails at this hour');
    return;
  }

  for (const userSetting of users) {
    try {
      // Get user's email from auth
      const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userSetting.user_id);
      
      if (userError || !user?.email) {
        console.error(`❌ Error fetching email for user ${userSetting.user_id}:`, userError);
        continue;
      }

      // Get ready items for this user
      const { data: readyItems } = await supabase
        .from('paused_items')
        .select('id, title, store_name, url')
        .eq('user_id', userSetting.user_id)
        .eq('status', 'paused')
        .lte('review_at', new Date().toISOString());

      if (!readyItems || readyItems.length === 0) {
        console.log(`❌ No ready items for user ${userSetting.user_id}`);
        continue;
      }

      const itemCount = readyItems.length;
      const itemText = itemCount === 1 ? 'item' : 'items';
      
      // Build items list HTML
      const itemsListHtml = readyItems.slice(0, 5).map((item: any) => `
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 12px; border: 1px solid #e5e7eb;">
          <h4 style="margin: 0 0 4px 0; font-size: 16px; color: #1a1a1a;">${item.title}</h4>
          ${item.store_name ? `<p style="margin: 0; color: #6b7280; font-size: 13px;">from ${item.store_name}</p>` : ''}
        </div>
      `).join('');

      const moreItemsText = readyItems.length > 5 ? `<p style="text-align: center; color: #6b7280; font-size: 14px;">...and ${readyItems.length - 5} more ${readyItems.length - 5 === 1 ? 'item' : 'items'}</p>` : '';

      console.log(`📤 Sending batch email to ${user.email} for ${itemCount} items`);
      
      const { error: emailError } = await resend.emails.send({
        from: 'Pocket Pause <notifications@pocketpause.app>',
        to: [user.email],
        subject: `${itemCount} ${itemText} ready for review`,
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
              <h2 style="margin: 0 0 12px 0; font-size: 20px; color: #1a1a1a;">It's time to meet your paused ${itemText} again ✨</h2>
              <p style="margin: 0; color: #4a4a4a; font-size: 16px;">You have ${itemCount} ${itemText} ready for review.</p>
            </div>
            
            <div style="margin-bottom: 24px;">
              ${itemsListHtml}
              ${moreItemsText}
            </div>
            
            <div style="text-align: center;">
              <a href="https://pocketpause.app" style="display: inline-block; background: #1a1a1a; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 500; font-size: 16px;">Review Your Items</a>
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 12px;">
              <p>You're receiving this because you enabled email notifications for Pocket Pause.</p>
              <p>To change your preferences, visit your settings in the app.</p>
            </div>
          </body>
          </html>
        `,
      });

      if (emailError) {
        console.error(`❌ Failed to send batch email to user ${userSetting.user_id}:`, emailError);
      } else {
        console.log(`✅ Batch email sent to user ${userSetting.user_id} for ${itemCount} items`);
      }
    } catch (error) {
      console.error(`❌ Error sending batch email to user ${userSetting.user_id}:`, error);
    }
  }
}
