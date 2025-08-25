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
  usePlaceholder?: boolean;
}

async function lookupProductByBarcode(barcode: string): Promise<ProductInfo> {
  try {
    // Try Open Food Facts API first
    const offResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    
    if (offResponse.ok) {
      const data = await offResponse.json();
      
      if (data.status === 1 && data.product) {
        const product = data.product;
        const productName = product.product_name || product.product_name_en || product.generic_name;
        
        if (productName && productName.trim() && productName.length > 3) {
          let imageUrl = '';
          if (product.image_url) {
            imageUrl = product.image_url;
          } else if (product.image_front_url) {
            imageUrl = product.image_front_url;
          } else if (product.selected_images?.front?.display?.en) {
            imageUrl = product.selected_images.front.display.en;
          }
          
          return {
            itemName: productName.trim(),
            storeName: product.brands || product.brand_owner || 'Food Product',
            price: '',
            imageUrl: imageUrl || '',
            usePlaceholder: !imageUrl
          };
        }
      }
    }

    // Try UPC Database API
    const upcResponse = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
    
    if (upcResponse.ok) {
      const upcData = await upcResponse.json();
      
      if (upcData.code === "OK" && upcData.items && upcData.items.length > 0) {
        const item = upcData.items[0];
        if (item.title && item.title.trim() && item.title.length > 3) {
          return {
            itemName: item.title.trim(),
            storeName: item.brand || 'Product',
            price: '',
            imageUrl: item.images && item.images.length > 0 ? item.images[0] : '',
            usePlaceholder: !item.images || item.images.length === 0
          };
        }
      }
    }

    // Try Barcode Spider API
    const spiderResponse = await fetch(`https://api.barcodespider.com/v1/lookup?token=demo&upc=${barcode}`);
    
    if (spiderResponse.ok) {
      const spiderData = await spiderResponse.json();
      
      if (spiderData.item_response && spiderData.item_response.item_name) {
        return {
          itemName: spiderData.item_response.item_name.trim(),
          storeName: spiderData.item_response.brand || 'Product',
          price: '',
          imageUrl: '',
          usePlaceholder: true
        };
      }
    }

    // Try Open Product Data API
    const opdResponse = await fetch(`https://openproductdata.com/api/products/${barcode}`);
    
    if (opdResponse.ok) {
      const opdData = await opdResponse.json();
      
      if (opdData.name && opdData.name.trim()) {
        return {
          itemName: opdData.name.trim(),
          storeName: opdData.brand || 'Product',
          price: '',
          imageUrl: opdData.images && opdData.images.length > 0 ? opdData.images[0] : '',
          usePlaceholder: !opdData.images || opdData.images.length === 0
        };
      }
    }

    // Fallback with just barcode number
    return {
      itemName: `Product ${barcode.slice(-4)}`,
      storeName: 'Edit details',
      price: '',
      imageUrl: '',
      usePlaceholder: true
    };
    
  } catch (error) {
    return {
      itemName: `Scanned Item ${barcode.slice(-4)}`,
      storeName: 'Edit details',
      price: '',
      imageUrl: '',
      usePlaceholder: true
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.text();
    const { barcode } = JSON.parse(body);

    if (!barcode) {
      return new Response(
        JSON.stringify({ error: 'Barcode is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productInfo = await lookupProductByBarcode(barcode);

    return new Response(
      JSON.stringify(productInfo),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});