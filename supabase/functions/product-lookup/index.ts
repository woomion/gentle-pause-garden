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
  console.log('🔍 Looking up product for barcode:', barcode);

  // Strategy 1: Try Open Food Facts
  try {
    console.log('🍕 Trying Open Food Facts...');
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();
    console.log('📋 Open Food Facts response:', JSON.stringify(data, null, 2));
    if (data.status === 1 && data.product && data.product.product_name) {
      const result = {
        itemName: data.product.product_name,
        storeName: data.product.brands || '',
        price: '',
        imageUrl: data.product.image_url || ''
      };
      console.log('✅ Found product via Open Food Facts:', result);
      return result;
    }
  } catch (error) {
    console.log('❌ Open Food Facts lookup failed:', error);
  }

  // Strategy 2: Try UPC Database API  
  try {
    console.log('🏷️ Trying UPC Database...');
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
    const data = await response.json();
    console.log('📋 UPC Database response:', JSON.stringify(data, null, 2));
    if (data.code === 'OK' && data.items && data.items.length > 0) {
      const item = data.items[0];
      const productName = item.title || item.description || '';
      if (productName) {
        const result = {
          itemName: productName,
          storeName: item.brand || '',
          price: '',
          imageUrl: item.images && item.images.length > 0 ? item.images[0] : ''
        };
        console.log('✅ Found product via UPC Database:', result);
        return result;
      }
    }
  } catch (error) {
    console.log('❌ UPC Database lookup failed:', error);
  }

  // Strategy 3: Try Google Shopping API alternative (BarcodeLookup.com)
  try {
    console.log('🛒 Trying BarcodeLookup.com...');
    const response = await fetch(`https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=free`);
    const data = await response.json();
    console.log('📋 BarcodeLookup response:', JSON.stringify(data, null, 2));
    if (data.products && data.products.length > 0) {
      const product = data.products[0];
      if (product.title || product.product_name) {
        const result = {
          itemName: product.title || product.product_name,
          storeName: product.brand || product.manufacturer || '',
          price: '',
          imageUrl: product.images && product.images.length > 0 ? product.images[0] : ''
        };
        console.log('✅ Found product via BarcodeLookup:', result);
        return result;
      }
    }
  } catch (error) {
    console.log('❌ BarcodeLookup lookup failed:', error);
  }

  // Strategy 3: Try Barcode Spider
  try {
    const response = await fetch(`https://api.barcodespider.com/v1/lookup?token=free&upc=${barcode}`);
    const data = await response.json();
    if (data && data.item_response && data.item_response.item_attributes) {
      const attrs = data.item_response.item_attributes;
      if (attrs.title || attrs.description) {
        return {
          itemName: attrs.title || attrs.description || '',
          storeName: attrs.brand || '',
          price: '',
          imageUrl: attrs.image || ''
        };
      }
    }
  } catch (error) {
    console.log('Barcode Spider lookup failed:', error);
  }

  // Strategy 4: Try Searchupc.com API
  try {
    const response = await fetch(`https://searchupc.com/handlers/upcsearch.ashx?request_type=3&access_token=11BEDA89-9C18-40F1-9E3C-90B7A8B72DE7&upc=${barcode}`);
    const data = await response.json();
    if (data && data.product && data.product.productname) {
      return {
        itemName: data.product.productname,
        storeName: data.product.brand || '',
        price: '',
        imageUrl: data.product.imageurl || ''
      };
    }
  } catch (error) {
    console.log('Searchupc lookup failed:', error);
  }

  // Fallback: Return placeholder with more info
  console.log('❌ All APIs failed, returning fallback');
  return {
    itemName: `Product ${barcode.slice(-4)}`,
    storeName: 'Unknown Brand',
    price: '',
    imageUrl: ''
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { barcode } = await req.json()
    
    if (!barcode) {
      return new Response(
        JSON.stringify({ error: 'Barcode is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const productInfo = await lookupProductByBarcode(barcode)

    return new Response(
      JSON.stringify(productInfo),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Error in product lookup:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to lookup product' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})