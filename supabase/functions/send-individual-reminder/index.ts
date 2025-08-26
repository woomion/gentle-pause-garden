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

interface SendIndividualReminderRequest {
  userId: string;
  itemId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, itemId }: SendIndividualReminderRequest = await req.json();
    
    console.log(`Processing individual reminder for user ${userId}, item ${itemId}`);

    // Get user settings to check if notifications are enabled and individual emails are preferred
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('notifications_enabled, email_batching_enabled')
      .eq('user_id', userId)
      .single();

    if (settingsError || !userSettings) {
      console.log(`No user settings found for user ${userId}`);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'User settings not found' 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if notifications are enabled and batch emails are disabled (individual mode)
    if (!userSettings.notifications_enabled) {
      console.log(`Notifications disabled for user ${userId}`);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Notifications disabled' 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (userSettings.email_batching_enabled) {
      console.log(`User ${userId} has batch emails enabled, skipping individual reminder`);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Batch emails enabled' 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get user's email
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authUser.user?.email) {
      console.log(`No email found for user ${userId}`);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'User email not found' 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get the specific item that just became ready
    const { data: item, error: itemError } = await supabase
      .from('paused_items')
      .select('id, title, store_name, review_at, price, created_at')
      .eq('id', itemId)
      .eq('user_id', userId)
      .eq('status', 'paused')
      .single();

    if (itemError || !item) {
      console.log(`Item ${itemId} not found or not ready for review`);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Item not found or not ready' 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if item is actually ready for review
    const now = new Date();
    const reviewDate = new Date(item.review_at);
    if (reviewDate > now) {
      console.log(`Item ${itemId} is not yet ready for review`);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Item not yet ready for review' 
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Sending individual reminder to ${authUser.user.email} for item: ${item.title}`);

    // Generate email HTML using React Email
    const appUrl = 'https://cnjznmbgxprsrovmdywe.lovable.dev';
    
    const emailHtml = await renderAsync(
      React.createElement(ReviewReminderEmail, {
        reviewItems: [item],
        appUrl,
        longPausedCount: 0,
      })
    );

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Pocket Pause <reminders@resend.dev>",
      to: [authUser.user.email],
      subject: `"${item.title}" is ready for your review ✦`,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.log(`Failed to send email to ${authUser.user.email}:`, emailResponse.error);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Failed to send email',
        error: emailResponse.error
      }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Successfully sent individual reminder to ${authUser.user.email}`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Individual reminder sent to ${authUser.user.email}` 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in send-individual-reminder function:", error);
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