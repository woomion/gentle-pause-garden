interface ProductInfo {
  itemName?: string;
  storeName?: string;
  price?: string;
  priceCurrency?: string;
  imageUrl?: string;
  availability?: string;
  brand?: string;
  sku?: string;
  description?: string;
  canonicalUrl?: string;
}

interface ParseResult {
  success: boolean;
  data: ProductInfo;
  method: string;
  confidence: number;
  error?: string;
  url: string;
  parseTime: number;
}

interface SiteStrategy {
  domain: string;
  strategy: 'firecrawl' | 'enhanced' | 'simple';
  requiresJs: boolean;
  customSelectors?: {
    title?: string[];
    price?: string[];
    image?: string[];
  };
}

// Optimized site configurations with performance-based strategies
const SITE_STRATEGIES: SiteStrategy[] = [
  // High-performance sites - use simple parsing
  { domain: 'amazon.com', strategy: 'simple', requiresJs: false },
  { domain: 'target.com', strategy: 'simple', requiresJs: false },
  { domain: 'walmart.com', strategy: 'simple', requiresJs: false },
  { domain: 'bestbuy.com', strategy: 'simple', requiresJs: false },
  { domain: 'homedepot.com', strategy: 'simple', requiresJs: false },
  { domain: 'costco.com', strategy: 'simple', requiresJs: false },
  
  // Medium complexity - use enhanced parsing
  { domain: 'wayfair.com', strategy: 'enhanced', requiresJs: false },
  { domain: 'overstock.com', strategy: 'enhanced', requiresJs: false },
  { domain: 'newegg.com', strategy: 'enhanced', requiresJs: false },
  { domain: 'macys.com', strategy: 'enhanced', requiresJs: false },
  { domain: 'kohls.com', strategy: 'enhanced', requiresJs: false },
  
  // Complex JS-heavy sites - use Firecrawl
  { domain: 'nike.com', strategy: 'firecrawl', requiresJs: true },
  { domain: 'adidas.com', strategy: 'firecrawl', requiresJs: true },
  { domain: 'zara.com', strategy: 'firecrawl', requiresJs: true },
  { domain: 'hm.com', strategy: 'firecrawl', requiresJs: true },
  { domain: 'lululemon.com', strategy: 'firecrawl', requiresJs: true },
  { domain: 'nordstrom.com', strategy: 'firecrawl', requiresJs: true },
  { domain: 'ssense.com', strategy: 'firecrawl', requiresJs: true },
  { domain: 'shopbop.com', strategy: 'firecrawl', requiresJs: true },
];

// Cache with TTL and size limits
const parseCache = new Map<string, { result: ParseResult; timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_SIZE = 100;

// Performance monitoring
const perfMetrics = {
  totalParses: 0,
  cacheHits: 0,
  avgParseTime: 0,
  methodStats: new Map<string, { count: number; totalTime: number }>()
};

export const parseProductUrl = async (url: string): Promise<ProductInfo> => {
  const startTime = performance.now();
  
  try {
    const result = await parseProductUrlWithMetrics(url);
    return result.data;
  } catch (error) {
    console.error('🚨 Unified parser failed:', error);
    return {
      storeName: extractStoreName(url),
      itemName: extractProductNameFromUrl(url) || 'Product'
    };
  } finally {
    const parseTime = performance.now() - startTime;
    perfMetrics.totalParses++;
    perfMetrics.avgParseTime = (perfMetrics.avgParseTime * (perfMetrics.totalParses - 1) + parseTime) / perfMetrics.totalParses;
  }
};

const parseProductUrlWithMetrics = async (url: string): Promise<ParseResult> => {
  const startTime = performance.now();
  
  // Step 1: URL expansion for shortened links (parallel with cache check)
  const [expandResult, normalizedUrl] = await Promise.all([
    expandUrlIfNeeded(url),
    Promise.resolve(normalizeUrl(url))
  ]);
  
  const finalUrl = expandResult?.finalUrl || url;
  const cacheKey = normalizeUrl(finalUrl);
  
  // Step 2: Cache check
  const cached = parseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    perfMetrics.cacheHits++;
    return cached.result;
  }
  
  // Step 3: Strategy selection
  const strategy = selectStrategy(finalUrl);
  console.log(`🎯 Using ${strategy.strategy} strategy for:`, finalUrl);
  
  let result: ParseResult;
  
  try {
    // Step 4: Execute parsing strategy
    switch (strategy.strategy) {
      case 'firecrawl':
        result = await parseWithFirecrawl(finalUrl, strategy);
        break;
      case 'enhanced':
        result = await parseWithEnhanced(finalUrl, strategy);
        break;
      case 'simple':
      default:
        result = await parseWithSimple(finalUrl, strategy);
        break;
    }
    
    // Step 5: Quality improvement with fallbacks
    if (result.confidence < 0.6) {
      console.log('📈 Low confidence, trying fallback strategy');
      const fallbackResult = await tryFallbackStrategy(finalUrl, strategy, result);
      if (fallbackResult.confidence > result.confidence) {
        result = fallbackResult;
      }
    }
    
  } catch (error) {
    console.error(`🚨 ${strategy.strategy} strategy failed:`, error);
    result = await createFallbackResult(finalUrl, error);
  }
  
  // Step 6: Post-processing and caching
  result.parseTime = performance.now() - startTime;
  result = postProcessResult(result, finalUrl);
  
  // Update metrics
  updateMetrics(result.method, result.parseTime);
  
  // Cache result
  cacheResult(cacheKey, result);
  
  return result;
};

// Fast URL expansion check (only for known shorteners)
const expandUrlIfNeeded = async (url: string): Promise<{ finalUrl: string } | null> => {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const shorteners = ['bit.ly', 'tinyurl.com', 'amzn.to', 'a.co', 'goo.gl', 't.co'];
    
    if (shorteners.some(s => hostname.includes(s))) {
      const { expandUrl } = await import('./urlExpander');
      const result = await expandUrl(url);
      return result.success ? { finalUrl: result.finalUrl } : null;
    }
  } catch {
    // Ignore expansion errors
  }
  return null;
};

const selectStrategy = (url: string): SiteStrategy => {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    const config = SITE_STRATEGIES.find(s => hostname.includes(s.domain));
    
    if (config) return config;
    
    // Default strategy based on URL characteristics
    if (hostname.includes('amazon') || hostname.includes('target') || hostname.includes('walmart')) {
      return { domain: hostname, strategy: 'simple', requiresJs: false };
    }
    
    return { domain: hostname, strategy: 'enhanced', requiresJs: false };
  } catch {
    return { domain: 'unknown', strategy: 'simple', requiresJs: false };
  }
};

// Optimized Firecrawl parsing with timeout and retry
const parseWithFirecrawl = async (url: string, strategy: SiteStrategy): Promise<ParseResult> => {
  const startTime = performance.now();
  
  try {
    const { supabase } = await import('../integrations/supabase/client');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout
    
    const response = await supabase.functions.invoke('firecrawl-proxy', {
      body: {
        url,
        mode: 'extract',
        schema: {
          type: "object",
          properties: {
            itemName: { type: "string", description: "Product name" },
            price: { type: "string", description: "Price (numbers only)" },
            imageUrl: { type: "string", description: "Main product image URL" },
            brand: { type: "string", description: "Brand name" }
          },
          required: ["itemName"]
        }
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.error) throw new Error(response.error.message);
    
    const data = response.data;
    if (data.success && data.extracted) {
      const result = processFirecrawlData(data.extracted, url);
      return {
        success: true,
        data: result,
        method: 'firecrawl',
        confidence: calculateConfidence(result),
        url,
        parseTime: performance.now() - startTime
      };
    }
    
    throw new Error('No data extracted');
  } catch (error) {
    return {
      success: false,
      data: { storeName: extractStoreName(url) },
      method: 'firecrawl',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Firecrawl failed',
      url,
      parseTime: performance.now() - startTime
    };
  }
};

// Fast enhanced parsing with optimized selectors
const parseWithEnhanced = async (url: string, strategy: SiteStrategy): Promise<ParseResult> => {
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProductParser/1.0)' },
      signal: AbortSignal.timeout(8000) // 8s timeout
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    
    const result = await extractDataEnhanced(doc, url, strategy);
    
    return {
      success: true,
      data: result,
      method: 'enhanced',
      confidence: calculateConfidence(result),
      url,
      parseTime: performance.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      data: { storeName: extractStoreName(url) },
      method: 'enhanced',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Enhanced parsing failed',
      url,
      parseTime: performance.now() - startTime
    };
  }
};

// Ultra-fast simple parsing for well-structured sites
const parseWithSimple = async (url: string, strategy: SiteStrategy): Promise<ParseResult> => {
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProductParser/1.0)' },
      signal: AbortSignal.timeout(5000) // 5s timeout
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const html = await response.text();
    const result = extractDataSimple(html, url);
    
    return {
      success: true,
      data: result,
      method: 'simple',
      confidence: calculateConfidence(result),
      url,
      parseTime: performance.now() - startTime
    };
  } catch (error) {
    return {
      success: false,
      data: { storeName: extractStoreName(url) },
      method: 'simple',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Simple parsing failed',
      url,
      parseTime: performance.now() - startTime
    };
  }
};

// Optimized data extraction functions
const extractDataEnhanced = async (doc: Document, url: string, strategy: SiteStrategy): Promise<ProductInfo> => {
  const result: ProductInfo = {
    storeName: extractStoreName(url),
    canonicalUrl: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || url
  };
  
  // Fast parallel extraction
  await Promise.all([
    extractStructuredData(doc, result),
    extractOpenGraph(doc, result, url),
    extractMicrodata(doc, result)
  ]);
  
  // Use custom selectors if available, otherwise defaults
  const selectors = strategy.customSelectors || getDefaultSelectors(url);
  
  // Extract remaining data with optimized selectors
  if (!result.itemName) result.itemName = extractWithSelectors(doc, selectors.title || DEFAULT_TITLE_SELECTORS);
  if (!result.price) result.price = extractPrice(doc, selectors.price || DEFAULT_PRICE_SELECTORS);
  if (!result.imageUrl) result.imageUrl = extractImage(doc, url, selectors.image || DEFAULT_IMAGE_SELECTORS);
  
  return cleanResult(result);
};

const extractDataSimple = (html: string, url: string): ProductInfo => {
  const result: ProductInfo = { storeName: extractStoreName(url) };
  
  // Ultra-fast regex-based extraction for simple sites
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/) || 
                     html.match(/<title>([^<]+)<\/title>/);
  if (titleMatch) {
    result.itemName = titleMatch[1].trim().split(' | ')[0].split(' - ')[0];
  }
  
  const priceMatch = html.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
  if (priceMatch) {
    result.price = priceMatch[1].replace(/,/g, '');
    result.priceCurrency = 'USD';
  }
  
  const ogImageMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (ogImageMatch) {
    result.imageUrl = ogImageMatch[1];
  }
  
  return cleanResult(result);
};

// Optimized helper functions
const DEFAULT_TITLE_SELECTORS = [
  'h1[class*="product"]',
  'h1[data-testid*="title"]',
  '.product-title h1',
  'h1'
];

const DEFAULT_PRICE_SELECTORS = [
  '[data-testid*="price"]:not([data-testid*="original"])',
  '.price:not(.original-price)',
  '[class*="current-price"]',
  '[itemprop="price"]'
];

const DEFAULT_IMAGE_SELECTORS = [
  'img[itemprop="image"]',
  '.product-image img[src]:not([src*="placeholder"])',
  'img[data-testid*="product"]',
  '.main-image img[src]'
];

const extractWithSelectors = (doc: Document, selectors: string[]): string | undefined => {
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element?.textContent?.trim()) {
      return element.textContent.trim();
    }
  }
  return undefined;
};

const extractPrice = (doc: Document, selectors: string[]): string | undefined => {
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element?.textContent) {
      const match = element.textContent.match(/[\$€£¥₹]?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      if (match) return match[1].replace(/,/g, '');
    }
  }
  return undefined;
};

const extractImage = (doc: Document, url: string, selectors: string[]): string | undefined => {
  for (const selector of selectors) {
    const img = doc.querySelector(selector) as HTMLImageElement;
    if (img?.src && !img.src.includes('placeholder')) {
      try {
        return new URL(img.src, url).toString();
      } catch {
        return img.src;
      }
    }
  }
  return undefined;
};

// Fast structured data extraction
const extractStructuredData = async (doc: Document, result: ProductInfo): Promise<void> => {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      const products = Array.isArray(data) ? data : [data];
      
      for (const item of products) {
        if (item['@type'] === 'Product') {
          if (!result.itemName && item.name) result.itemName = item.name;
          if (!result.brand && item.brand?.name) result.brand = item.brand.name;
          
          if (!result.price && item.offers) {
            const offers = Array.isArray(item.offers) ? item.offers : [item.offers];
            const offer = offers[0];
            if (offer?.price) {
              result.price = String(offer.price);
              result.priceCurrency = offer.priceCurrency || 'USD';
            }
          }
          
          if (!result.imageUrl && item.image) {
            const image = Array.isArray(item.image) ? item.image[0] : item.image;
            result.imageUrl = typeof image === 'string' ? image : image?.url;
          }
          
          return; // Found product data, exit early
        }
      }
    } catch {
      continue;
    }
  }
};

const extractOpenGraph = (doc: Document, result: ProductInfo, url: string): void => {
  if (!result.itemName) {
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
    if (ogTitle) result.itemName = ogTitle.replace(/\s*[|\-–—]\s*[^|\-–—]*$/, '').trim();
  }
  
  if (!result.imageUrl) {
    const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
    if (ogImage) {
      try {
        result.imageUrl = new URL(ogImage, url).toString();
      } catch {
        result.imageUrl = ogImage;
      }
    }
  }
};

const extractMicrodata = (doc: Document, result: ProductInfo): void => {
  if (!result.itemName) {
    const nameEl = doc.querySelector('[itemprop="name"]');
    if (nameEl?.textContent) result.itemName = nameEl.textContent.trim();
  }
  
  if (!result.brand) {
    const brandEl = doc.querySelector('[itemprop="brand"]');
    if (brandEl?.textContent) result.brand = brandEl.textContent.trim();
  }
};

// Utility functions
const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid', 'ref'];
    trackingParams.forEach(param => urlObj.searchParams.delete(param));
    urlObj.hash = '';
    return urlObj.toString();
  } catch {
    return url;
  }
};

const extractStoreName = (url: string): string => {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    
    // Enhanced store name mapping
    const storeMap: Record<string, string> = {
      'amazon.com': 'Amazon',
      'target.com': 'Target',
      'walmart.com': 'Walmart',
      'bestbuy.com': 'Best Buy',
      'homedepot.com': 'Home Depot',
      'lowes.com': "Lowe's",
      'macys.com': "Macy's",
      'nordstrom.com': 'Nordstrom',
      'wayfair.com': 'Wayfair'
    };
    
    const mapped = storeMap[hostname];
    if (mapped) return mapped;
    
    const parts = hostname.split('.');
    const domain = parts[parts.length - 2] || hostname;
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Unknown Store';
  }
};

const extractProductNameFromUrl = (url: string): string | null => {
  try {
    const pathParts = new URL(url).pathname.split('/').filter(Boolean);
    const productSegments = pathParts.filter(part => 
      part.length > 3 && 
      !/^(product|item|p|dp|\d+)$/i.test(part)
    );
    
    if (productSegments.length > 0) {
      return productSegments[productSegments.length - 1]
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
  } catch {
    // Ignore errors
  }
  return null;
};

const calculateConfidence = (result: ProductInfo): number => {
  let confidence = 0;
  if (result.itemName && result.itemName.length > 3) confidence += 0.4;
  if (result.price && !isNaN(parseFloat(result.price))) confidence += 0.3;
  if (result.imageUrl) confidence += 0.2;
  if (result.brand) confidence += 0.1;
  return Math.min(confidence, 1.0);
};

const cleanResult = (result: ProductInfo): ProductInfo => {
  if (result.itemName) {
    result.itemName = result.itemName
      .replace(/\s+/g, ' ')
      .replace(/[|–—-]\s*[^|–—-]*$/, '')
      .trim();
  }
  
  if (result.price) {
    const cleaned = result.price.replace(/[^\d.]/g, '');
    if (cleaned && !isNaN(parseFloat(cleaned))) {
      result.price = cleaned;
    } else {
      delete result.price;
    }
  }
  
  return result;
};

// Fallback and support functions
const tryFallbackStrategy = async (url: string, currentStrategy: SiteStrategy, currentResult: ParseResult): Promise<ParseResult> => {
  // Try the next best strategy
  if (currentStrategy.strategy === 'simple') {
    return await parseWithEnhanced(url, { ...currentStrategy, strategy: 'enhanced' });
  } else if (currentStrategy.strategy === 'enhanced') {
    return await parseWithFirecrawl(url, { ...currentStrategy, strategy: 'firecrawl' });
  }
  return currentResult;
};

const createFallbackResult = async (url: string, error: any): Promise<ParseResult> => {
  return {
    success: false,
    data: {
      storeName: extractStoreName(url),
      itemName: extractProductNameFromUrl(url) || 'Product'
    },
    method: 'fallback',
    confidence: 0.1,
    error: error instanceof Error ? error.message : 'Parse failed',
    url,
    parseTime: 0
  };
};

const postProcessResult = (result: ParseResult, url: string): ParseResult => {
  // Ensure we have minimum required data
  if (!result.data.storeName) {
    result.data.storeName = extractStoreName(url);
  }
  
  if (!result.data.itemName) {
    result.data.itemName = extractProductNameFromUrl(url) || result.data.storeName || 'Product';
  }
  
  return result;
};

const processFirecrawlData = (extracted: any, url: string): ProductInfo => {
  return cleanResult({
    itemName: extracted.itemName?.trim(),
    price: extracted.price ? String(extracted.price).replace(/[^\d.]/g, '') : undefined,
    priceCurrency: 'USD',
    brand: extracted.brand?.trim(),
    imageUrl: extracted.imageUrl,
    storeName: extractStoreName(url)
  });
};

const getDefaultSelectors = (url: string): { title?: string[]; price?: string[]; image?: string[] } => {
  const hostname = new URL(url).hostname.toLowerCase();
  
  // Site-specific optimized selectors
  if (hostname.includes('amazon')) {
    return {
      title: ['#productTitle', 'h1.a-size-large'],
      price: ['[data-a-color="price"] .a-price-whole', '.a-price .a-offscreen'],
      image: ['#landingImage', '#imgTagWrapperId img']
    };
  }
  
  return {};
};

// Cache management
const cacheResult = (key: string, result: ParseResult): void => {
  if (parseCache.size >= MAX_CACHE_SIZE) {
    const firstKey = parseCache.keys().next().value;
    parseCache.delete(firstKey);
  }
  
  parseCache.set(key, { result, timestamp: Date.now() });
};

// Metrics tracking
const updateMetrics = (method: string, parseTime: number): void => {
  const current = perfMetrics.methodStats.get(method) || { count: 0, totalTime: 0 };
  current.count++;
  current.totalTime += parseTime;
  perfMetrics.methodStats.set(method, current);
};

// Performance monitoring API
export const getParseMetrics = () => ({
  ...perfMetrics,
  cacheHitRate: perfMetrics.cacheHits / perfMetrics.totalParses,
  methodAverages: Array.from(perfMetrics.methodStats.entries()).map(([method, stats]) => ({
    method,
    avgTime: stats.totalTime / stats.count,
    count: stats.count
  }))
});

export const clearParseCache = () => parseCache.clear();