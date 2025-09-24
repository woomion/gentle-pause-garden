import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Auth email webhook received");
    
    const payload = await req.text();
    const headers = Object.fromEntries(req.headers);
    
    // If this is a webhook from Supabase, verify it
    const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET');
    
    let emailData;
    if (hookSecret && headers['webhook-signature']) {
      // This is a webhook from Supabase Auth
      const wh = new Webhook(hookSecret);
      const data = wh.verify(payload, headers);
      emailData = data;
    } else {
      // This is a direct call
      emailData = JSON.parse(payload);
    }

    const {
      user,
      email_data: { token, token_hash, redirect_to, email_action_type }
    } = emailData;

    console.log(`DEBUG: Full emailData:`, JSON.stringify(emailData, null, 2));
    console.log(`DEBUG: User object:`, JSON.stringify(user, null, 2));
    console.log(`Sending ${email_action_type} email to ${user.email}`);

    // Create a beautiful magic link email
    const magicLinkUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Magic Link - Pause</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; line-height: 1.6; color: #333; background: #f8fafc; margin: 0; padding: 0;">
          <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden; margin-top: 40px; margin-bottom: 40px;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, hsl(262, 83%, 58%) 0%, hsl(270, 60%, 85%) 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600;">✨ Your Magic Link</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Ready to continue your pause journey?</p>
            </div>
            
            <!-- Content -->
            <div style="padding: 40px 30px;">
              <p style="font-size: 16px; margin-bottom: 30px; color: #4a5568;">
                Click the button below to securely sign in to your Pause account. This link will expire in 1 hour for your security.
              </p>
              
              <!-- Magic Link Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="${magicLinkUrl}" style="display: inline-block; background: linear-gradient(135deg, hsl(262, 83%, 58%) 0%, hsl(270, 60%, 85%) 100%); color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3); transition: transform 0.2s ease;">
                  Sign In to Pocket Pause
                </a>
              </div>
              
              
              <!-- Security Notice -->
              <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
                <p style="font-size: 14px; color: #718096; margin: 0;">
                  🔒 This email was sent to ${user.email}. If you didn't request this login link, you can safely ignore this email.
                </p>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 14px; color: #a0aec0;">
                Made with ❤️ by Pocket Pause - Your mindful shopping companion
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    const { error } = await resend.emails.send({
      from: 'Pocket Pause <noreply@resend.dev>',
      to: [user.email],
      subject: '🔗 Your Magic Link to Pause',
      html: emailHtml,
    });

    if (error) {
      console.error('Resend error:', error);
      throw error;
    }

    console.log('Magic link email sent successfully');

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in send-auth-email function:', error);
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