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

// Robust URL parser with smart HTML parsing + URL-based fallback
export const parseProductUrl = async (url: string, _options: RobustParsingOptions = {}): Promise<ProductInfo> => {
  console.log('🔍 urlParser: Starting robust parse for', url);
  
  // Fast URL-based extraction first (never fails)
  const urlBasedResult: ProductInfo = {
    itemName: extractProductNameFromUrl(url),
    storeName: extractStoreNameFromUrl(url)
  };
  
  console.log('🔍 urlParser: URL-based extraction result:', urlBasedResult);
  
  // Primary path: smart HTML parser (uses Firecrawl + enhanced fallbacks)
  try {
    const { parseProductUrlSmart } = await import('./smartUrlParser');
    const smartResult = await parseProductUrlSmart(url);
    
    console.log('🔍 urlParser: Smart parser result:', smartResult);
    
    if (smartResult.success) {
      const data = smartResult.data || {};
      const finalResult: ProductInfo = {
        // Prefer parsed name, then URL-based, then store name
        itemName: data.itemName || urlBasedResult.itemName || urlBasedResult.storeName,
        storeName: data.storeName || urlBasedResult.storeName,
        price: data.price,
        imageUrl: data.imageUrl,
      };
      
      console.log('🔍 urlParser: Final smart+URL merged result:', finalResult);
      return finalResult;
    }
  } catch (smartError) {
    console.error('🔍 urlParser: Smart parser failed:', smartError);
  }
  
  // Secondary path: legacy enhanced parser as a backup for some sites
  try {
    const { parseProductUrl: enhancedParser } = await import('./enhancedUrlParser');
    const enhancedResult = await enhancedParser(url);
    
    console.log('🔍 urlParser: Enhanced parser backup result:', enhancedResult);
    
    const finalResult: ProductInfo = {
      itemName: enhancedResult.itemName || urlBasedResult.itemName || urlBasedResult.storeName,
      storeName: enhancedResult.storeName || urlBasedResult.storeName,
      price: enhancedResult.price,
      imageUrl: enhancedResult.imageUrl,
    };
    
    console.log('🔍 urlParser: Final enhanced+URL merged result:', finalResult);
    return finalResult;
  } catch (enhancedError) {
    console.error('🔍 urlParser: Enhanced parser backup failed:', enhancedError);
  }
  
  // Final fallback: URL-based only (no image/price)
  const fallbackResult: ProductInfo = {
    itemName: urlBasedResult.itemName || urlBasedResult.storeName || 'Product',
    storeName: urlBasedResult.storeName,
  };
  
  console.log('🔍 urlParser: Final URL-only fallback result:', fallbackResult);
  return fallbackResult;
};