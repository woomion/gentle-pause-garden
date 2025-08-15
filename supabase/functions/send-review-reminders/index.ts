import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.10';

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
      .select('user_id, notifications_enabled')
      .eq('notifications_enabled', true);

    if (usersError) {
      throw new Error(`Failed to fetch user settings: ${usersError.message}`);
    }

    console.log(`Found ${usersWithSettings?.length || 0} users with notifications enabled`);

    for (const userSetting of usersWithSettings || []) {
      try {
        // Get user's email from auth.users (using service role key)
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userSetting.user_id);
        
        if (authError || !authUser.user?.email) {
          console.log(`Skipping user ${userSetting.user_id} - no email found`);
          continue;
        }

        // Get items ready for review for this user
        const { data: reviewItems, error: itemsError } = await supabase
          .from('paused_items')
          .select('id, title, store_name, review_at')
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

        // Create email content
        const itemsList = reviewItems.map(item => 
          `• ${item.title}${item.store_name ? ` from ${item.store_name}` : ''}`
        ).join('\n');

        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; font-size: 24px; margin-bottom: 24px;">Time to Review Your Paused Items</h1>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
              You have <strong>${reviewItems.length} item${reviewItems.length > 1 ? 's' : ''}</strong> ready for review:
            </p>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
              <pre style="margin: 0; color: #333; font-size: 14px; white-space: pre-wrap;">${itemsList}</pre>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
              Take a moment to reflect: Do you still want these items? Have your priorities changed? 
              Trust your instincts and make decisions that align with your values.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.dev') || 'https://cnjznmbgxprsrovmdywe.lovable.dev'}" 
                 style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                Review Your Items
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              You're receiving this because you have notifications enabled. 
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.dev') || 'https://cnjznmbgxprsrovmdywe.lovable.dev'}" style="color: #8B5CF6;">Manage preferences</a>
            </p>
          </div>
        `;

        // Send email using Resend
        const emailResponse = await resend.emails.send({
          from: "Pocket Pause <reminders@resend.dev>",
          to: [authUser.user.email],
          subject: `${reviewItems.length} item${reviewItems.length > 1 ? 's' : ''} ready for review`,
          html: emailHtml,
        });

        if (emailResponse.error) {
          console.log(`Failed to send email to ${authUser.user.email}:`, emailResponse.error);
        } else {
          console.log(`Successfully sent reminder to ${authUser.user.email}`);
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