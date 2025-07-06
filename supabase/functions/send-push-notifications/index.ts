import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationPayload {
  userIds?: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
}

// Generate OAuth 2.0 access token using service account
async function getAccessToken(serviceAccount: any): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600; // 1 hour

    // Create JWT header
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    // Create JWT payload
    const payload = {
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: expiry
    };

    // Encode header and payload
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;

    // Import private key for signing
    const privateKey = await crypto.subtle.importKey(
      'pkcs8',
      new TextEncoder().encode(serviceAccount.private_key.replace(/\\n/g, '\n')),
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    );

    // Sign the JWT
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKey,
      new TextEncoder().encode(unsignedToken)
    );

    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
    const jwt = `${unsignedToken}.${encodedSignature}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Failed to get access token:', error);
      return null;
    }

    const tokenData = await tokenResponse.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Error generating access token:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const { userIds, title, body, data }: NotificationPayload = await req.json();

      if (!title || !body) {
        return new Response(
          JSON.stringify({ error: 'Title and body are required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Get push tokens for specified users or all users if no userIds provided
      let query = supabase
        .from('user_settings')
        .select('user_id, push_token, platform')
        .not('push_token', 'is', null);

      if (userIds && userIds.length > 0) {
        query = query.in('user_id', userIds);
      }

      const { data: users, error: fetchError } = await query;

      if (fetchError) {
        console.error('Error fetching push tokens:', fetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch push tokens' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      if (!users || users.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: 'No users with push tokens found', sent: 0 }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Get Firebase service account credentials for HTTP v1 API
      const serviceAccountKey = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_KEY');
      if (!serviceAccountKey) {
        console.error('FIREBASE_SERVICE_ACCOUNT_KEY not configured');
        return new Response(
          JSON.stringify({ error: 'Push notification service not configured' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      let serviceAccount;
      try {
        serviceAccount = JSON.parse(serviceAccountKey);
      } catch (error) {
        console.error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format:', error);
        return new Response(
          JSON.stringify({ error: 'Invalid service account configuration' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Generate OAuth 2.0 access token
      const accessToken = await getAccessToken(serviceAccount);
      if (!accessToken) {
        console.error('Failed to get access token');
        return new Response(
          JSON.stringify({ error: 'Authentication failed' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      const results = await Promise.allSettled(
        users.map(async (user) => {
          const message = {
            message: {
              token: user.push_token,
              notification: {
                title,
                body,
              },
              data: {
                ...data,
                userId: user.user_id,
                action: data?.action || 'review_items'
              },
              android: {
                notification: {
                  channel_id: 'pocket_pause_notifications',
                  sound: 'default',
                  priority: 'high',
                  icon: 'ic_notification',
                  color: '#6366f1'
                }
              },
              apns: {
                payload: {
                  aps: {
                    alert: {
                      title,
                      body
                    },
                    badge: 1,
                    sound: 'default',
                    category: 'pocket-pause-notification'
                  }
                }
              },
              webpush: {
                notification: {
                  title,
                  body,
                  icon: '/favicon.ico',
                  badge: '/favicon.ico',
                  tag: 'pocket-pause-notification',
                  requireInteraction: false
                }
              }
            }
          };

          const response = await fetch(
            `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(message)
            }
          );

          const result = await response.json();
          
          if (!response.ok) {
            console.error(`Failed to send notification to user ${user.user_id}:`, result);
            throw new Error(`FCM error: ${result.error?.message || 'Unknown error'}`);
          }

          console.log(`Notification sent successfully to user ${user.user_id}`);
          return result;
        })
      );

      const successful = results.filter(result => result.status === 'fulfilled').length;
      const failed = results.filter(result => result.status === 'rejected').length;

      console.log(`Notifications sent: ${successful} successful, ${failed} failed`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Notifications processed`,
          sent: successful,
          failed: failed,
          total: users.length
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
})