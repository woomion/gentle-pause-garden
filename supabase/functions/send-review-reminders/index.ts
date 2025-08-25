import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import React from 'npm:react@18.3.1';
import { ReviewReminderEmail } from './_templates/review-reminder.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
    console.log('Starting review reminders process...');
    
    // Get all users who have items ready for review and notifications enabled
    const { data: usersWithSettings, error: usersError } = await supabase
      .from('user_settings')
      .select('user_id, notifications_enabled, email_batching_enabled, timezone, notification_time_preference, last_reminder_sent')
      .eq('notifications_enabled', true);

    if (usersError) {
      throw new Error(`Failed to fetch user settings: ${usersError.message}`);
    }

    console.log(`Found ${usersWithSettings?.length || 0} users with notifications enabled`);

    for (const userSetting of usersWithSettings || []) {
      try {
        // Check if user should receive reminder based on their timezone and time preference
        const userTimezone = userSetting.timezone || 'UTC';
        const preferredTime = userSetting.notification_time_preference || '19:00:00'; // Default to 7 PM
        const lastReminderSent = userSetting.last_reminder_sent;
        const emailBatchingEnabled = userSetting.email_batching_enabled || false;
        
        // Convert current UTC time to user's timezone
        const now = new Date();
        const userLocalTime = new Intl.DateTimeFormat('en-US', {
          timeZone: userTimezone,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(now);
        
        const userLocalHour = parseInt(userLocalTime.split(':')[0]);
        const preferredHour = parseInt(preferredTime.split(':')[0]);
        
        // Check if we should skip based on timing and last reminder
        const today = new Date().toISOString().split('T')[0];
        const alreadySentToday = lastReminderSent && lastReminderSent.split('T')[0] === today;
        
        // For batching mode: only send if it's within 1 hour of their preferred time and haven't sent today
        // For immediate mode: send whenever items are ready, but still respect daily limit
        if (emailBatchingEnabled) {
          // Batch mode: only send at preferred time once per day
          if (Math.abs(userLocalHour - preferredHour) > 1 || alreadySentToday) {
            console.log(`Skipping user ${userSetting.user_id} - batch mode: wrong time (${userLocalHour} vs ${preferredHour}) or already sent today`);
            continue;
          }
        } else {
          // Immediate mode: send as items become ready, but respect daily limit
          if (alreadySentToday) {
            console.log(`Skipping user ${userSetting.user_id} - immediate mode: already sent today`);
            continue;
          }
        }

        // Get user's email from auth.users (using service role key)
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userSetting.user_id);
        
        if (authError || !authUser.user?.email) {
          console.log(`Skipping user ${userSetting.user_id} - no email found`);
          continue;
        }

        // Get items ready for review for this user
        const { data: reviewItems, error: itemsError } = await supabase
          .from('paused_items')
          .select('id, title, store_name, review_at, price, created_at')
          .eq('user_id', userSetting.user_id)
          .eq('status', 'paused')
          .lte('review_at', new Date().toISOString());

        if (itemsError) {
          console.log(`Error fetching items for user ${userSetting.user_id}:`, itemsError);
          continue;
        }

        if (!reviewItems || reviewItems.length === 0) {
          console.log(`No items ready for review for user ${userSetting.user_id}`);
          continue;
        }

        console.log(`Sending reminder to ${authUser.user.email} for ${reviewItems.length} items`);

        // Calculate items paused for more than 10 days
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
        const longPausedCount = reviewItems.filter(item => 
          new Date(item.created_at) < tenDaysAgo
        ).length;

        // Generate beautiful email HTML using React Email
        const appUrl = 'https://cnjznmbgxprsrovmdywe.lovable.dev';
        
        const emailHtml = await renderAsync(
          React.createElement(ReviewReminderEmail, {
            reviewItems,
            appUrl,
            longPausedCount,
          })
        );

        // Send email using Resend
        const emailResponse = await resend.emails.send({
          from: "Pocket Pause <reminders@resend.dev>",
          to: [authUser.user.email],
          subject: "Your paused items are ready when you are ✦",
          html: emailHtml,
        });

        if (emailResponse.error) {
          console.log(`Failed to send email to ${authUser.user.email}:`, emailResponse.error);
        } else {
          console.log(`Successfully sent reminder to ${authUser.user.email}`);
          
          // Update last reminder sent timestamp
          await supabase
            .from('user_settings')
            .update({ last_reminder_sent: new Date().toISOString() })
            .eq('user_id', userSetting.user_id);
        }

      } catch (userError) {
        console.log(`Error processing user ${userSetting.user_id}:`, userError);
        continue;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Processed ${usersWithSettings?.length || 0} users` 
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in send-review-reminders function:", error);
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