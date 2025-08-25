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
  console.log('🔍 Looking up barcode:', barcode);

  try {
    // Test barcodes with known data
    const knownProducts: Record<string, ProductInfo> = {
      '7630585322278': {
        itemName: 'Prosecco Valdobbiadene DOCG',
        storeName: 'Test Brand',
        price: '15.99',
        imageUrl: 'https://images.openfoodfacts.org/images/products/763/058/532/2278/front_en.3.400.jpg',
        usePlaceholder: false
      },
      '123456789012': {
        itemName: 'Demo Product for Testing',
        storeName: 'Demo Brand',
        price: '9.99',
        imageUrl: '',
        usePlaceholder: false
      }
    };

    // Check test products first
    if (knownProducts[barcode]) {
      console.log('🧪 Test product detected');
      return knownProducts[barcode];
    }

    // Try Open Food Facts API (most comprehensive food database)
    try {
      console.log('📡 Trying Open Food Facts API...');
      const offResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      
      if (offResponse.ok) {
        const data = await offResponse.json();
        console.log('📦 Open Food Facts status:', data.status);
        
        if (data.status === 1 && data.product) {
          const product = data.product;
          console.log('📦 Product keys:', Object.keys(product));
          
          // Get product name
          const productName = product.product_name || 
                             product.product_name_en || 
                             product.generic_name ||
                             product.abbreviated_product_name;
          
          if (productName && productName.trim() && productName.length > 2) {
            // Get best available image
            let imageUrl = '';
            if (product.image_url && product.image_url.includes('openfoodfacts')) {
              imageUrl = product.image_url;
            } else if (product.image_front_url) {
              imageUrl = product.image_front_url;
            } else if (product.selected_images?.front?.display?.en) {
              imageUrl = product.selected_images.front.display.en;
            }
            
            const result = {
              itemName: productName.trim(),
              storeName: product.brands || product.brand_owner || product.manufacturer || 'Food Product',
              price: '',
              imageUrl: imageUrl || '',
              usePlaceholder: !imageUrl
            };
            
            console.log('✅ SUCCESS from Open Food Facts:', result.itemName);
            return result;
          }
        }
      }
    } catch (error) {
      console.log('❌ Open Food Facts error:', error.message);
    }

    // Try UPC Database API
    try {
      console.log('📡 Trying UPC Database...');
      const upcResponse = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
      
      if (upcResponse.ok) {
        const upcData = await upcResponse.json();
        console.log('📦 UPC Database status:', upcData.code);
        
        if (upcData.code === "OK" && upcData.items && upcData.items.length > 0) {
          const item = upcData.items[0];
          if (item.title && item.title.trim() && item.title.length > 2) {
            const result = {
              itemName: item.title.trim(),
              storeName: item.brand || 'Retail Product',
              price: '',
              imageUrl: item.images && item.images.length > 0 ? item.images[0] : '',
              usePlaceholder: !item.images || item.images.length === 0
            };
            
            console.log('✅ SUCCESS from UPC Database:', result.itemName);
            return result;
          }
        }
      }
    } catch (error) {
      console.log('❌ UPC Database error:', error.message);
    }

    // Try Barcode Lookup API with demo key
    try {
      console.log('📡 Trying Barcode Lookup API...');
      const blResponse = await fetch(`https://api.barcodelookup.com/v3/products?barcode=${barcode}&formatted=y&key=demo`);
      
      if (blResponse.ok) {
        const blData = await blResponse.json();
        console.log('📦 Barcode Lookup response:', blData);
        
        if (blData.products && blData.products.length > 0) {
          const product = blData.products[0];
          if (product.product_name && product.product_name.trim()) {
            const result = {
              itemName: product.product_name.trim(),
              storeName: product.brand || product.manufacturer || 'Product',
              price: '',
              imageUrl: product.images && product.images.length > 0 ? product.images[0] : '',
              usePlaceholder: !product.images || product.images.length === 0
            };
            
            console.log('✅ SUCCESS from Barcode Lookup:', result.itemName);
            return result;
          }
        }
      }
    } catch (error) {
      console.log('❌ Barcode Lookup error:', error.message);
    }

    console.log('⚠️ All APIs failed, generating smart fallback');
    
    // Generate a meaningful fallback based on barcode patterns
    let fallbackName = 'Unknown Product';
    let fallbackStore = 'Edit details';
    
    // EAN/UPC patterns can give hints about product categories
    if (barcode.length === 13 || barcode.length === 12) {
      const prefix = barcode.substring(0, 3);
      
      if (prefix >= '000' && prefix <= '019') {
        fallbackName = 'US/Canada Product';
        fallbackStore = 'North America';
      } else if (prefix >= '020' && prefix <= '029') {
        fallbackName = 'Store Brand Item';
        fallbackStore = 'Private Label';
      } else if (prefix >= '200' && prefix <= '299') {
        fallbackName = 'Fresh/Weighted Item';
        fallbackStore = 'Fresh Foods';
      } else if (prefix >= '300' && prefix <= '379') {
        fallbackName = 'Pharmaceutical Product';
        fallbackStore = 'Health & Beauty';
      } else if (prefix >= '400' && prefix <= '440') {
        fallbackName = 'European Product';
        fallbackStore = 'Germany';
      } else if (prefix >= '690' && prefix <= '699') {
        fallbackName = 'Chinese Product';
        fallbackStore = 'China';
      } else if (prefix >= '800' && prefix <= '899') {
        fallbackName = 'Italian Product';
        fallbackStore = 'Italy';
      } else {
        fallbackName = `Product ${barcode.slice(-4)}`;
        fallbackStore = 'Unknown Brand';
      }
    }
    
    return {
      itemName: fallbackName,
      storeName: fallbackStore,
      price: '',
      imageUrl: '',
      usePlaceholder: true
    };
    
  } catch (error) {
    console.error('🚨 Error in lookupProductByBarcode:', error);
    
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Product lookup function called');

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const body = await req.text();
    const { barcode } = JSON.parse(body);

    if (!barcode) {
      return new Response(
        JSON.stringify({ error: 'Barcode is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const productInfo = await lookupProductByBarcode(barcode);
    console.log('🎯 Final result:', productInfo.itemName);

    return new Response(
      JSON.stringify(productInfo),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('🚨 Function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});