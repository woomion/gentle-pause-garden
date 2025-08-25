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
    // For demo purposes, return mock data
    // In a real implementation, you would call a service like:
    // - Open Food Facts API
    // - UPC Database
    // - Your own product database
    
    // Mock implementation with better examples
    const mockProducts: Record<string, ProductInfo> = {
      '012345678905': {
        itemName: 'Sample Product',
        storeName: 'Demo Store',
        price: '19.99',
        imageUrl: ''
      },
      // Add some common test barcodes
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

    // Try to get basic info from Open Food Facts API (free service)
    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await response.json();
      
      if (data.status === 1 && data.product) {
        return {
          itemName: data.product.product_name || `Scanned Item (${barcode.slice(-4)})`,
          storeName: data.product.brands || '',
          price: '',
          imageUrl: data.product.image_url || ''
        };
      }
    } catch (apiError) {
      console.log('API lookup failed, using fallback');
    }

    // Fallback: Create a more descriptive placeholder
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