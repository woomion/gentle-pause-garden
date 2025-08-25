import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const barcode = '7630585322278'; // Your test barcode
    
    console.log('🔍 Testing image API for barcode:', barcode);
    
    // Test Open Food Facts API directly
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();
    
    console.log('📦 Full API response:', JSON.stringify(data, null, 2));
    
    if (data.product) {
      console.log('🖼️ All image-related fields:');
      console.log('- image_url:', data.product.image_url);
      console.log('- image_front_url:', data.product.image_front_url);
      console.log('- image_small_url:', data.product.image_small_url);
      console.log('- image_thumb_url:', data.product.image_thumb_url);
      
      if (data.product.images) {
        console.log('- images object keys:', Object.keys(data.product.images));
        if (data.product.images.front) {
          console.log('- images.front keys:', Object.keys(data.product.images.front));
          console.log('- images.front.display:', data.product.images.front.display);
          console.log('- images.front.small:', data.product.images.front.small);
          console.log('- images.front.thumb:', data.product.images.front.thumb);
        }
      }
    }
    
    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('🚨 Test error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});