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

    // Try multiple free APIs for different product types
    const lookupStrategies = [
      // Try Open Food Facts for food items
      async () => {
        const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
        const data = await response.json();
        if (data.status === 1 && data.product) {
          return {
            itemName: data.product.product_name || null,
            storeName: data.product.brands || '',
            price: '',
            imageUrl: data.product.image_url || ''
          };
        }
        return null;
      },
      
      // Try UPCitemdb (free tier available)
      async () => {
        try {
          const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`);
          const data = await response.json();
          if (data.code === 'OK' && data.items && data.items.length > 0) {
            const item = data.items[0];
            return {
              itemName: item.title || null,
              storeName: item.brand || '',
              price: '',
              imageUrl: item.images && item.images.length > 0 ? item.images[0] : ''
            };
          }
        } catch (error) {
          console.log('UPCitemdb lookup failed');
        }
        return null;
      }
    ];

    // Try each strategy until one succeeds
    for (const strategy of lookupStrategies) {
      try {
        const result = await strategy();
        if (result && result.itemName) {
          return result;
        }
      } catch (error) {
        console.log('Lookup strategy failed, trying next...');
      }
    }

    // Fallback: Create a descriptive placeholder that can be edited
    return {
      itemName: `Scanned Item (${barcode.slice(-4)})`,
      storeName: '',
      price: '',
      imageUrl: ''
    };
    
  } catch (error) {
    console.error('Error looking up product:', error);
    throw new Error('Failed to lookup product information');
  }
};