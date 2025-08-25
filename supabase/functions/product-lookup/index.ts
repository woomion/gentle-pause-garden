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
  // Try Open Food Facts first - most reliable for food products
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    if (response.ok) {
      const data = await response.json();
      if (data.status === 1 && data.product) {
        const product = data.product;
        const name = product.product_name || product.product_name_en || product.generic_name;
        if (name && name.trim() && name.length > 2) {
          return {
            itemName: name.trim(),
            storeName: product.brands || product.brand_owner || 'Food Product',
            price: '',
            imageUrl: product.image_url || product.image_front_url || '',
            usePlaceholder: false
          };
        }
      }
    }
  } catch (e) {
    // Continue to next API
  }

  // Try UPC Item DB
  try {
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
    if (response.ok) {
      const data = await response.json();
      if (data.code === "OK" && data.items?.length > 0) {
        const item = data.items[0];
        if (item.title && item.title.trim()) {
          return {
            itemName: item.title.trim(),
            storeName: item.brand || 'Product',
            price: '',
            imageUrl: item.images?.[0] || '',
            usePlaceholder: false
          };
        }
      }
    }
  } catch (e) {
    // Continue to next fallback
  }

  // Try direct Open Food Facts search
  try {
    const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${barcode}&search_simple=1&action=process&json=1`);
    if (response.ok) {
      const data = await response.json();
      if (data.products?.length > 0) {
        const product = data.products[0];
        const name = product.product_name || product.product_name_en;
        if (name && name.trim()) {
          return {
            itemName: name.trim(),
            storeName: product.brands || 'Food Product',
            price: '',
            imageUrl: product.image_url || '',
            usePlaceholder: false
          };
        }
      }
    }
  } catch (e) {
    // Final fallback
  }

  // Fallback with smart naming
  return {
    itemName: `Product ${barcode.slice(-4)}`,
    storeName: 'Edit details',
    price: '',
    imageUrl: '',
    usePlaceholder: true
  };
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
      JSON.stringify({ 
        itemName: `Scanned Item`,
        storeName: 'Edit details',
        price: '',
        imageUrl: '',
        usePlaceholder: true
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});