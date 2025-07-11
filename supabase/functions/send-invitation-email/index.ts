import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  inviterName: string;
  inviterEmail: string;
  inviteeEmail: string;
  invitationId: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Received request:", req.method);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { inviterName, inviterEmail, inviteeEmail, invitationId }: InvitationEmailRequest = await req.json();
    console.log("Processing invitation email for:", { inviterName, inviterEmail, inviteeEmail });

    const appUrl = "https://pocketpause.app"; // Update this to your actual domain
    const acceptUrl = `${appUrl}?invite=${invitationId}`;

    const emailResponse = await resend.emails.send({
      from: "PocketPause <woodsm@pocketpause.app>", // Using your verified domain
      to: [inviteeEmail],
      subject: `${inviterName} invited you to be their Pause Partner!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">You're invited to be a Pause Partner!</h1>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="font-size: 16px; line-height: 1.5; color: #555;">
              <strong>${inviterName}</strong> (${inviterEmail}) has invited you to be their Pause Partner on PocketPause!
            </p>
            
            <p style="font-size: 14px; line-height: 1.5; color: #666;">
              As Pause Partners, you can share your paused shopping items with each other, 
              support each other's mindful shopping journey, and help each other make better purchasing decisions.
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${acceptUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; font-weight: bold;
                      display: inline-block;">
              Accept Invitation
            </a>
          </div>

          <p style="font-size: 12px; color: #888; text-align: center; margin-top: 30px;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <p style="font-size: 12px; color: #888; text-align: center;">
            This email was sent by PocketPause. Visit <a href="${appUrl}" style="color: #007bff;">pocketpause.app</a> to learn more.
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-invitation-email function:", error);
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