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

        // Create email content
        const formatPrice = (price: number | null) => {
          if (!price) return '';
          return `, $${price.toFixed(2)}`;
        };

        const itemsList = reviewItems.map(item => 
          `${item.title}${item.store_name ? `, ${item.store_name}` : ''}${formatPrice(item.price)}`
        ).join('<br>');

        const emailHtml = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #333;">
            
            <div style="text-align: center; margin-bottom: 32px;">
              <h2 style="color: #333; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">
                ${reviewItems.length} item${reviewItems.length > 1 ? 's' : ''} ${reviewItems.length > 1 ? 'are' : 'is'} ready whenever you are.
              </h2>
            </div>

            <div style="margin-bottom: 24px;">
              <h1 style="color: #333; font-size: 20px; font-weight: bold; margin: 0 0 4px 0;">Pocket Pause</h1>
              <p style="color: #666; font-style: italic; margin: 0 0 16px 0; font-size: 16px;">Your paused items are ready for review.</p>
              
              <p style="color: #333; font-size: 16px; line-height: 1.5; margin: 0 0 24px 0;">
                Here's what's been waiting for you. Take a breath and choose with clarity.
              </p>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 24px 0; border-left: 4px solid #8B5CF6;">
              <div style="color: #333; font-size: 15px; line-height: 1.6;">
                ${itemsList}
              </div>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.dev') || 'https://cnjznmbgxprsrovmdywe.lovable.dev'}" 
                 style="background: #8B5CF6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 500; display: inline-block; font-size: 16px;">
                Review Now →
              </a>
            </div>
            
            ${longPausedCount > 0 ? `
            <div style="background: #fff9e6; border: 1px solid #f0d000; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
              <p style="color: #8B5CF6; font-size: 14px; margin: 0;">
                ✦ Notice: ${longPausedCount} of these items ${longPausedCount > 1 ? 'have' : 'has'} been paused for more than 10 days. ${longPausedCount > 1 ? 'Do they' : 'Does it'} still hold meaning?
              </p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 32px 0 16px 0;">
              <p style="color: #666; font-style: italic; margin: 0; font-size: 16px;">
                Clarity grows in pauses. Thanks for taking yours.
              </p>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
            
            <div style="text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0 0 8px 0;">
                <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.dev') || 'https://cnjznmbgxprsrovmdywe.lovable.dev'}" style="color: #8B5CF6; text-decoration: none;">Manage account / settings</a>
              </p>
              <p style="color: #ccc; font-size: 11px; margin: 0;">
                Pocket-sized presence before you buy.
              </p>
            </div>
          </div>
        `;

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