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

// Robust URL parser with multiple strategies
export const parseProductUrl = async (url: string, options: RobustParsingOptions = {}): Promise<ProductInfo> => {
  console.log('🔍 urlParser: Starting robust parse for', url);
  
  // Start with URL-based extraction (fast and reliable)
  const urlBasedResult: ProductInfo = {
    itemName: extractProductNameFromUrl(url),
    storeName: extractStoreNameFromUrl(url)
  };
  
  console.log('🔍 urlParser: URL-based extraction result:', urlBasedResult);
  
  // Try enhanced parser for additional data (price, image)
  try {
    const { parseProductUrl: enhancedParser } = await import('./enhancedUrlParser');
    const enhancedResult = await enhancedParser(url);
    
    console.log('🔍 urlParser: Enhanced parser result:', enhancedResult);
    
    // Merge results, preferring URL-based item name if enhanced parser didn't find one
    const finalResult = {
      itemName: enhancedResult.itemName || urlBasedResult.itemName || urlBasedResult.storeName,
      storeName: enhancedResult.storeName || urlBasedResult.storeName,
      price: enhancedResult.price,
      imageUrl: enhancedResult.imageUrl
    };
    
    console.log('🔍 urlParser: Final merged result:', finalResult);
    return finalResult;
    
  } catch (error) {
    console.error('🔍 urlParser: Enhanced parser failed:', error);
    
    // Fallback to smart parser
    try {
      const { parseProductUrlSmart } = await import('./smartUrlParser');
      const smartResult = await parseProductUrlSmart(url);
      
      console.log('🔍 urlParser: Smart parser result:', smartResult);
      
      // Merge with URL-based results
      const finalResult = {
        itemName: smartResult.data?.itemName || urlBasedResult.itemName || urlBasedResult.storeName,
        storeName: smartResult.data?.storeName || urlBasedResult.storeName,
        price: smartResult.data?.price,
        imageUrl: smartResult.data?.imageUrl
      };
      
      console.log('🔍 urlParser: Final smart result:', finalResult);
      return finalResult;
      
    } catch (smartError) {
      console.error('🔍 urlParser: Smart parser also failed:', smartError);
      
      // Return URL-based extraction as final fallback
      const fallbackResult = {
        itemName: urlBasedResult.itemName || urlBasedResult.storeName || 'Product',
        storeName: urlBasedResult.storeName
      };
      
      console.log('🔍 urlParser: Final fallback result:', fallbackResult);
      return fallbackResult;
    }
  }
};