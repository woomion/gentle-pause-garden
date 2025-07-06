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

      // Create push_tokens table if it doesn't exist (will be handled by migration)
      // For now, store in user_settings or create a new table
      
      // First check if token already exists for this user
      const { data: existingToken, error: selectError } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking existing token:', selectError);
        return new Response(
          JSON.stringify({ error: 'Database error' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      // For now, we'll extend user_settings to include push token
      // In production, you'd want a separate push_tokens table
      const { error: upsertError } = await supabase
        .from('user_settings')
        .upsert({ 
          user_id: userId,
          push_token: token,
          platform: platform,
          updated_at: new Date().toISOString()
        }, { 
          onConflict: 'user_id' 
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