interface ProductInfo {
  itemName?: string;
  storeName?: string;
  price?: string;
  imageUrl?: string;
}

interface RobustParsingOptions {
  maxRetries?: number;
  timeout?: number;
  enableFallbacks?: boolean;
  validateContent?: boolean;
}

// Extract product name from URL path
const extractProductNameFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Remove common URL patterns and get the product part
    const pathParts = pathname.split('/').filter(part => part && part.length > 0);
    
    // Look for product-like segments (usually longer and descriptive)
    const productSegments = pathParts.filter(part => 
      part.length > 3 && 
      !['product', 'item', 'shop', 'store', 'buy', 'cart', 'p', 'dp'].includes(part.toLowerCase()) &&
      !/^\d+$/.test(part) // Not just numbers
    );
    
    if (productSegments.length > 0) {
      // Take the longest segment (usually the product name)
      const productName = productSegments
        .sort((a, b) => b.length - a.length)[0]
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      return productName;
    }
    
    return null;
  } catch {
    return null;
  }
};

// Extract store name from hostname
const extractStoreNameFromUrl = (url: string): string => {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    const parts = hostname.split('.');
    const domain = parts[parts.length - 2] || hostname;
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Unknown Store';
  }
};

// High-performance unified parser with intelligent strategy selection
export const parseProductUrl = async (url: string, options: RobustParsingOptions = {}): Promise<ProductInfo> => {
  console.log('🚀 Starting unified parse for:', url);
  
  try {
    // Use the new unified parser which automatically selects the best strategy
    const { parseProductUrl: unifiedParser } = await import('./unifiedUrlParser');
    const result = await unifiedParser(url);
    
    console.log('✅ Unified parser result:', result);
    return result;
    
  } catch (error) {
    console.error('🚨 Unified parser failed, using fallback:', error);
    
    // Fast fallback using URL-based extraction only
    const fallbackResult: ProductInfo = {
      itemName: extractProductNameFromUrl(url) || extractStoreNameFromUrl(url) || 'Product',
      storeName: extractStoreNameFromUrl(url)
    };
    
    console.log('🔄 Fallback result:', fallbackResult);
    return fallbackResult;
  }
};