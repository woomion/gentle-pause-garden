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

interface TestReminderRequest {
  email: string;
  userId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, userId }: TestReminderRequest = await req.json();
    
    console.log(`Sending test reminder to ${email} for user ${userId || 'current user'}`);
    
    // For test purposes, let's use demo data if no user found
    let reviewItems: any[] = [];
    let targetUserId = userId;
    
    if (!targetUserId) {
      // Try to get user from JWT token
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user) {
          targetUserId = user.id;
        }
      }
    }

    if (targetUserId) {
      // Get items ready for review for this user
      const { data: items, error: itemsError } = await supabase
        .from('paused_items')
        .select('id, title, store_name, review_at')
        .eq('user_id', targetUserId)
        .eq('status', 'paused')
        .lte('review_at', new Date().toISOString());

      if (!itemsError && items) {
        reviewItems = items;
      }
    }

    // If no items found from database, use demo data for test
    if (reviewItems.length === 0) {
      console.log('No items found in database, using demo data for test');
      reviewItems = [
        { title: 'Mindful Focus Hourglass 5', store_name: 'Demo Store' },
        { title: 'Hikerkind X Keen Targhee', store_name: 'Outdoor Gear Co' },
        { title: 'Double Date Night Bundle', store_name: 'Experience Shop' }
      ];
    }

    console.log(`Found ${reviewItems.length} items ready for review`);

    // Create email content
    const itemsList = reviewItems.map(item => 
      `• ${item.title}${item.store_name ? ` from ${item.store_name}` : ''}`
    ).join('\n');

    const emailHtml = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #333; font-size: 24px; margin-bottom: 24px;">🧪 Test: Time to Review Your Paused Items</h1>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 20px;">
          <strong>This is a test email.</strong> You have <strong>${reviewItems.length} item${reviewItems.length > 1 ? 's' : ''}</strong> ready for review:
        </p>
        
        <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <pre style="margin: 0; color: #333; font-size: 14px; white-space: pre-wrap;">${itemsList}</pre>
        </div>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5; margin-bottom: 30px;">
          Take a moment to reflect: Do you still want these items? Have your priorities changed? 
          Trust your instincts and make decisions that align with your values.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://cnjznmbgxprsrovmdywe.lovable.dev" 
             style="background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
            Review Your Items
          </a>
        </div>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          This is a test email from your Pocket Pause app. 
          <a href="https://cnjznmbgxprsrovmdywe.lovable.dev" style="color: #8B5CF6;">Visit your app</a>
        </p>
      </div>
    `;

    // Send email using Resend
    const emailResponse = await resend.emails.send({
      from: "Pocket Pause Test <reminders@resend.dev>",
      to: [email],
      subject: `🧪 Test: ${reviewItems.length} item${reviewItems.length > 1 ? 's' : ''} ready for review`,
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.log(`Failed to send test email to ${email}:`, emailResponse.error);
      return new Response(JSON.stringify({ error: 'Failed to send email', details: emailResponse.error }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else {
      console.log(`Successfully sent test reminder to ${email}`);
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Test email sent to ${email}`,
        itemCount: reviewItems.length,
        emailId: emailResponse.data?.id
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

  } catch (error: any) {
    console.error("Error in send-test-reminder function:", error);
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