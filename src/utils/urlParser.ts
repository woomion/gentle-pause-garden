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

// Updated function - uses smart parser with layered strategy
export const parseProductUrl = async (url: string, options: RobustParsingOptions = {}): Promise<ProductInfo> => {
  const { parseProductUrl: smartParser } = await import('./smartUrlParser');
  return smartParser(url);
};