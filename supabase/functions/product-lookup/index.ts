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
  // Try OpenFoodFacts first - works well for food products
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await response.json();
    
    if (data.status === 1 && data.product && data.product.product_name) {
      const product = data.product;
      
      // Get the best available image
      let imageUrl = '';
      if (product.image_url && product.image_url.startsWith('http')) {
        imageUrl = product.image_url;
      } else if (product.image_front_url && product.image_front_url.startsWith('http')) {
        imageUrl = product.image_front_url;
      } else if (product.selected_images?.front?.display?.en) {
        imageUrl = product.selected_images.front.display.en;
      } else if (product.images?.front?.display) {
        imageUrl = product.images.front.display;
      }
      
      return {
        itemName: product.product_name,
        storeName: product.brands || 'Food Product',
        price: '',
        imageUrl: imageUrl,
        usePlaceholder: !imageUrl
      };
    }
  } catch {}

  // Try Barcode Lookup API
  try {
    const response = await fetch(`https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=demo`);
    const data = await response.json();
    
    if (data.products && data.products.length > 0) {
      const product = data.products[0];
      let imageUrl = '';
      if (product.images && product.images.length > 0 && product.images[0].startsWith('http')) {
        imageUrl = product.images[0];
      }
      
      return {
        itemName: product.product_name || product.title,
        storeName: product.brand || product.manufacturer || 'Product',
        price: '',
        imageUrl: imageUrl,
        usePlaceholder: !imageUrl
      };
    }
  } catch {}

  // Try UPC Database
  try {
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
    const data = await response.json();
    
    if (data.code === "OK" && data.items && data.items.length > 0) {
      const item = data.items[0];
      let imageUrl = '';
      if (item.images && item.images.length > 0 && item.images[0].startsWith('http')) {
        imageUrl = item.images[0];
      }
      
      return {
        itemName: item.title,
        storeName: item.brand || 'Product',
        price: '',
        imageUrl: imageUrl,
        usePlaceholder: !imageUrl
      };
    }
  } catch {}

  // Try Nutritionix API
  try {
    const response = await fetch(`https://trackapi.nutritionix.com/v2/search/item?upc=${barcode}`, {
      headers: {
        'x-app-id': 'demo',
        'x-app-key': 'demo'
      }
    });
    const data = await response.json();
    
    if (data.foods && data.foods.length > 0) {
      const food = data.foods[0];
      return {
        itemName: food.food_name,
        storeName: food.brand_name || 'Food Product',
        price: '',
        imageUrl: food.photo?.thumb || '',
        usePlaceholder: false
      };
    }
  } catch {}

  // Try Edamam Food Database
  try {
    const response = await fetch(`https://api.edamam.com/api/food-database/v2/parser?upc=${barcode}&app_id=demo&app_key=demo`);
    const data = await response.json();
    
    if (data.hints && data.hints.length > 0) {
      const hint = data.hints[0];
      return {
        itemName: hint.food.label,
        storeName: hint.food.brand || 'Food Product',
        price: '',
        imageUrl: hint.food.image || '',
        usePlaceholder: false
      };
    }
  } catch {}

  // If all APIs fail, return a descriptive fallback
  return {
    itemName: `Product ${barcode.slice(-4)}`,
    storeName: 'Tap to edit details',
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
    const { barcode } = await req.json();
    
    if (!barcode) {
      throw new Error('No barcode provided');
    }

    const productInfo = await lookupProductByBarcode(barcode);
    
    return new Response(JSON.stringify(productInfo), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      itemName: 'Scanned Product',
      storeName: 'Tap to edit details',
      price: '',
      imageUrl: '',
      usePlaceholder: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});