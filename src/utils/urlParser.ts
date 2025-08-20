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

// Updated function - uses enhanced parser for direct extraction  
export const parseProductUrl = async (url: string, options: RobustParsingOptions = {}): Promise<ProductInfo> => {
  console.log('🔍 urlParser: Starting parse for', url);
  
  try {
    // Use enhanced parser directly for better results
    const { parseProductUrl: enhancedParser } = await import('./enhancedUrlParser');
    const result = await enhancedParser(url);
    
    console.log('🔍 urlParser: Enhanced parser result:', result);
    return result;
  } catch (error) {
    console.error('🔍 urlParser: Enhanced parser failed:', error);
    
    // Fallback to smart parser
    try {
      const { parseProductUrlSmart } = await import('./smartUrlParser');
      const smartResult = await parseProductUrlSmart(url);
      
      console.log('🔍 urlParser: Smart parser result:', smartResult);
      return smartResult.data || { storeName: 'Unknown Store' };
    } catch (smartError) {
      console.error('🔍 urlParser: Smart parser also failed:', smartError);
      return { storeName: 'Unknown Store' };
    }
  }
};