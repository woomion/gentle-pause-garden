import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushToken {
  token: string;
  userId: string;
  platform: string;
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
      const { token, userId, platform }: PushToken = await req.json();

      if (!token || !userId) {
        return new Response(
          JSON.stringify({ error: 'Token and userId are required' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // Store in the new push_tokens table
      const { error: upsertError } = await supabase
        .from('push_tokens')
        .upsert({ 
          user_id: userId,
          token: token,
          platform: platform || 'web',
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id,platform' 
        });

      if (upsertError) {
        console.error('Error storing push token:', upsertError);
        return new Response(
          JSON.stringify({ error: 'Failed to store push token' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log(`Push token stored for user ${userId} on ${platform}`);

      return new Response(
        JSON.stringify({ success: true, message: 'Push token stored successfully' }),
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