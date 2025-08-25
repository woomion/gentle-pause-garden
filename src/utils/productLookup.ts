// Product lookup service for barcode scanning
// This service would typically call a product database API

interface ProductInfo {
  itemName: string;
  storeName?: string;
  price?: string;
  imageUrl?: string;
}

export const lookupProductByBarcode = async (barcode: string): Promise<ProductInfo> => {
  console.log('Looking up product for barcode:', barcode);
  
  try {
    // Mock implementation with better examples
    const mockProducts: Record<string, ProductInfo> = {
      '012345678905': {
        itemName: 'Sample Product',
        storeName: 'Demo Store',
        price: '19.99',
        imageUrl: ''
      },
      '123456789012': {
        itemName: 'Test Product',
        storeName: 'Sample Store',
        price: '12.99',
        imageUrl: ''
      }
    };

    const product = mockProducts[barcode];
    if (product) {
      return product;
    }

    // Try multiple strategies for product lookup
    const lookupStrategies = [
      // Strategy 1: Try Barcode Spider (CORS-friendly)
      async () => {
        try {
          const response = await fetch(`https://api.barcodespider.com/v1/lookup?token=free&upc=${barcode}`);
          const data = await response.json();
          if (data && data.item_response && data.item_response.item_attributes) {
            const attrs = data.item_response.item_attributes;
            return {
              itemName: attrs.title || attrs.description || null,
              storeName: attrs.brand || '',
              price: '',
              imageUrl: attrs.image || ''
            };
          }
        } catch (error) {
          console.log('Barcode Spider lookup failed');
        }
        return null;
      },

      // Strategy 2: Try Open Food Facts for food items
      async () => {
        try {
          const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
          const data = await response.json();
          if (data.status === 1 && data.product && data.product.product_name) {
            return {
              itemName: data.product.product_name,
              storeName: data.product.brands || '',
              price: '',
              imageUrl: data.product.image_url || ''
            };
          }
        } catch (error) {
          console.log('Open Food Facts lookup failed');
        }
        return null;
      },

      // Strategy 3: Try Digit-Eyes (free tier)
      async () => {
        try {
          // Note: This would typically require an API key for production use
          const response = await fetch(`https://www.digit-eyes.com/gtin/v2_0/?upcCode=${barcode}&field_names=description,brand,image&language=en&app_key=free`);
          const data = await response.json();
          if (data && data.description) {
            return {
              itemName: data.description || null,
              storeName: data.brand || '',
              price: '',
              imageUrl: data.image || ''
            };
          }
        } catch (error) {
          console.log('Digit-Eyes lookup failed');
        }
        return null;
      }
    ];

    // Try each strategy until one succeeds
    for (const strategy of lookupStrategies) {
      try {
        const result = await strategy();
        if (result && result.itemName) {
          console.log('Product found:', result);
          return result;
        }
      } catch (error) {
        console.log('Lookup strategy failed, trying next...');
      }
    }

    // If all strategies fail, provide a helpful message
    console.log('No product information found for barcode:', barcode);
    return {
      itemName: `Unknown Product (${barcode.slice(-4)})`,
      storeName: 'Tap to edit details',
      price: '',
      imageUrl: ''
    };
    
  } catch (error) {
    console.error('Error looking up product:', error);
    throw new Error('Failed to lookup product information');
  }
};