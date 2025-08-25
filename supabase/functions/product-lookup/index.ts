import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProductInfo {
  itemName: string;
  storeName?: string;
  price?: string;
  imageUrl?: string;
}

async function lookupProductByBarcode(barcode: string): Promise<ProductInfo> {
  console.log('🔍 Starting lookup for barcode:', barcode);

  // Test with your specific barcode first
  if (barcode === '7630585322278') {
    console.log('🎯 Detected test barcode, trying specific lookup...');
    
    // Try Open Food Facts with detailed logging
    try {
      console.log('📡 Calling Open Food Facts API...');
      const url = `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`;
      console.log('🌐 URL:', url);
      
      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.log('❌ Response not OK');
        throw new Error(`HTTP ${response.status}`);
      }
      
      const text = await response.text();
      console.log('📄 Raw response text (first 500 chars):', text.substring(0, 500));
      
      const data = JSON.parse(text);
      console.log('📦 Parsed data status:', data.status);
      console.log('📦 Has product:', !!data.product);
      
      if (data.status === 1 && data.product) {
        console.log('🔍 Product keys:', Object.keys(data.product));
        console.log('🏷️ Product name:', data.product.product_name);
        console.log('🏷️ Product name EN:', data.product.product_name_en);
        console.log('🏪 Brands:', data.product.brands);
        console.log('🖼️ Image URL:', data.product.image_url);
        
        const productName = data.product.product_name || data.product.product_name_en || data.product.generic_name;
        if (productName) {
          // Try to get the best image available
          let imageUrl = '';
          if (data.product.image_url) {
            imageUrl = data.product.image_url;
          } else if (data.product.image_front_url) {
            imageUrl = data.product.image_front_url;
          } else if (data.product.images && data.product.images.front && data.product.images.front.display) {
            imageUrl = data.product.images.front.display;
          }
          
          const result = {
            itemName: productName,
            storeName: data.product.brands || data.product.brand_owner || 'Unknown Brand',
            price: '',
            imageUrl: imageUrl || '', // Empty string will trigger placeholder in app
            usePlaceholder: !imageUrl // Tell app to use placeholder if no image
          };
          console.log('✅ SUCCESS! Found product:', JSON.stringify(result));
          return result;
        }
      }
    } catch (error) {
      console.log('❌ Open Food Facts error:', error.message);
    }
  }

  // Fallback strategy for any barcode
  try {
    console.log('🌍 Trying OpenFoodFacts for any barcode...');
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.status === 1 && data.product) {
        const productName = data.product.product_name || data.product.product_name_en;
        if (productName) {
          // Try to get the best image from OpenFoodFacts
          let imageUrl = '';
          if (data.product.image_url) {
            imageUrl = data.product.image_url;
          } else if (data.product.image_front_url) {
            imageUrl = data.product.image_front_url;
          } else if (data.product.images && data.product.images.front) {
            imageUrl = data.product.images.front.display || data.product.images.front.small || data.product.images.front.thumb;
          }
          
          return {
            itemName: productName,
            storeName: data.product.brands || 'Unknown Brand',
            price: '',
            imageUrl: imageUrl || '',
            usePlaceholder: !imageUrl
          };
        }
      }
    }
  } catch (error) {
    console.log('❌ General OpenFoodFacts failed:', error);
  }

  // Try UPC Database
  try {
    console.log('🏷️ Trying UPC Database...');
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.code === 'OK' && data.items && data.items.length > 0) {
        const item = data.items[0];
        if (item.title || item.description) {
          return {
            itemName: item.title || item.description,
            storeName: item.brand || 'Unknown Brand',
            price: '',
            imageUrl: item.images && item.images.length > 0 ? item.images[0] : ''
          };
        }
      }
    }
  } catch (error) {
    console.log('❌ UPC Database failed:', error);
  }

  // Last resort - return something more helpful
  console.log('❌ All lookups failed, returning fallback');
  return {
    itemName: `Product ${barcode.slice(-4)}`,
    storeName: 'Tap to edit details',
    price: '',
    imageUrl: ''
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    console.log('🚀 Product lookup function called');
    const body = await req.text();
    console.log('📥 Request body:', body);
    
    const { barcode } = JSON.parse(body);
    console.log('🔢 Extracted barcode:', barcode);
    
    if (!barcode) {
      console.log('❌ No barcode provided');
      return new Response(
        JSON.stringify({ error: 'Barcode is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const productInfo = await lookupProductByBarcode(barcode);
    console.log('📦 Final result:', JSON.stringify(productInfo));

    return new Response(
      JSON.stringify(productInfo),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('🚨 Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to lookup product', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})