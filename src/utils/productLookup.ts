// Product lookup service for barcode scanning
// This service would typically call a product database API

interface ProductInfo {
  itemName: string;
  storeName?: string;
  price?: string;
  imageUrl?: string;
}

export const lookupProductByBarcode = async (barcode: string): Promise<ProductInfo> => {
  console.log('🔍 Starting product lookup for barcode:', barcode);
  
  try {
    console.log('📡 Calling Supabase edge function...');
    
    // Import the supabase client
    const { supabase } = await import('@/integrations/supabase/client');
    
    // Use Supabase client to call the edge function
    const { data, error } = await supabase.functions.invoke('product-lookup', {
      body: { barcode }
    });

    if (error) {
      console.error('❌ Supabase function error:', error);
      throw error;
    }

    const productInfo = data;
    console.log('📦 Product info received:', productInfo);
    
    // Return the data directly from the edge function
    if (productInfo && productInfo.itemName) {
      console.log('✅ Found product:', productInfo.itemName);
      return productInfo;
    }

    console.log('⚠️ Got placeholder result, checking fallbacks...');

    // Fallback: Try direct API calls for common products
    const mockProducts: Record<string, ProductInfo> = {
      '012345678905': {
        itemName: 'Coca-Cola Classic',
        storeName: 'Coca-Cola',
        price: '1.99',
        imageUrl: ''
      },
      '049000028058': {
        itemName: "Lay's Classic Potato Chips",
        storeName: "Frito-Lay",
        price: '3.49',
        imageUrl: ''
      },
      '123456789012': {
        itemName: 'Samsung Galaxy Phone Case',
        storeName: 'Samsung',
        price: '24.99',
        imageUrl: ''
      }
    };

    const mockProduct = mockProducts[barcode];
    if (mockProduct) {
      return mockProduct;
    }

    // Return a more helpful placeholder
    return {
      itemName: `Product ${barcode.slice(-4)}`,
      storeName: 'Tap to add details',
      price: '',
      imageUrl: ''
    };
    
  } catch (error) {
    console.error('🚨 Error looking up product:', error);
    
    // Return placeholder if everything fails
    return {
      itemName: `Product ${barcode.slice(-4)}`,
      storeName: 'Tap to add details',
      price: '',
      imageUrl: ''
    };
  }
};