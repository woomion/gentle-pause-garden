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

// Updated function - uses enhanced parser
export const parseProductUrl = async (url: string, options: RobustParsingOptions = {}): Promise<ProductInfo> => {
  const { parseProductUrl: enhancedParser } = await import('./enhancedUrlParser');
  return enhancedParser(url);
};