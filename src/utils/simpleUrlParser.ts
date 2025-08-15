interface ProductInfo {
  itemName?: string;
  storeName?: string;
  price?: string;
  imageUrl?: string;
}

interface ParseAttempt {
  method: string;
  success: boolean;
  error?: string;
  data?: Partial<ProductInfo>;
}

// Enhanced in-memory cache with attempt tracking
const cache = new Map<string, { data: ProductInfo; timestamp: number; attempts: ParseAttempt[] }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_RETRIES = 3;

const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Remove extensive tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'fbclid', 'gclid', 'gclsrc', 'dclid', 'msclkid',
      'ref', 'referrer', 'source', 'campaign',
      '_ga', '_gl', 'mc_cid', 'mc_eid'
    ];
    
    trackingParams.forEach(param => urlObj.searchParams.delete(param));
    
    // Normalize URL format
    return urlObj.toString().toLowerCase();
  } catch {
    return url.toLowerCase();
  }
};

const extractStoreName = (hostname: string): string => {
  const cleanHostname = hostname.replace(/^www\./, '').toLowerCase();
  
  // Comprehensive store mapping
  const storeMap: Record<string, string> = {
    // Major retailers
    'amazon.com': 'Amazon',
    'amazon.ca': 'Amazon',
    'amazon.co.uk': 'Amazon',
    'amazon.de': 'Amazon',
    'amazon.fr': 'Amazon',
    'shopbop.com': 'Shopbop',
    'nordstrom.com': 'Nordstrom',
    'nordstromrack.com': 'Nordstrom Rack',
    'saks.com': 'Saks',
    'saksfifthavenue.com': 'Saks',
    'zara.com': 'Zara',
    'hm.com': 'H&M',
    'asos.com': 'ASOS',
    'target.com': 'Target',
    'walmart.com': 'Walmart',
    'bestbuy.com': 'Best Buy',
    'macys.com': 'Macy\'s',
    'bloomingdales.com': 'Bloomingdale\'s',
    'nike.com': 'Nike',
    'adidas.com': 'Adidas',
    'gap.com': 'Gap',
    'bananarepublic.com': 'Banana Republic',
    'jcrew.com': 'J.Crew',
    'anthropologie.com': 'Anthropologie',
    'urbanoutfitters.com': 'Urban Outfitters',
    'freepeople.com': 'Free People',
    'lululemon.com': 'Lululemon',
    'patagonia.com': 'Patagonia',
    'rei.com': 'REI',
    'sephora.com': 'Sephora',
    'ulta.com': 'Ulta',
    'etsy.com': 'Etsy',
    'wayfair.com': 'Wayfair',
    'ikea.com': 'IKEA',
    'homedepot.com': 'Home Depot',
    'lowes.com': 'Lowe\'s'
  };

  // Check exact matches first
  if (storeMap[cleanHostname]) {
    return storeMap[cleanHostname];
  }

  // Check for partial matches (subdomains)
  for (const [domain, storeName] of Object.entries(storeMap)) {
    if (cleanHostname.includes(domain)) {
      return storeName;
    }
  }

  // Fallback to domain name cleanup
  const domainParts = cleanHostname.split('.');
  const mainDomain = domainParts[domainParts.length - 2] || cleanHostname;
  
  return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
};

const extractFromDOM = (html: string, baseUrl: string): ProductInfo => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const result: ProductInfo = {};

  // Enhanced title extraction with more comprehensive selectors
  const titleSelectors = [
    // E-commerce specific
    'h1[data-automation-id="product-title"]',
    'h1.pdp-product-name',
    'h1[data-testid="product-title"]',
    'h1[data-cy="product-title"]',
    'h1[class*="product-title"]',
    'h1[class*="ProductTitle"]',
    'h1[class*="product-name"]',
    'h1[class*="ProductName"]',
    '.product-title h1',
    '.product-name h1',
    '.ProductTitle h1',
    '.ProductName h1',
    
    // Generic product selectors
    '[data-testid="product-name"]',
    '[data-cy="product-name"]',
    '.product-details h1',
    '.item-title h1',
    '.listing-title h1',
    
    // Meta tags
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'title',
    
    // Amazon specific
    '#productTitle',
    'span#productTitle',
    
    // Shopify
    '.product-single__title',
    '.product__title',
    
    // WooCommerce
    '.product_title',
    'h1.entry-title',
    
    // Generic fallbacks
    'h1[class*="title"]',
    'h1[class*="name"]',
    'h1'
  ];

  for (const selector of titleSelectors) {
    let element: Element | null = null;
    let text = '';

    if (selector.startsWith('meta')) {
      element = doc.querySelector(selector);
      text = element?.getAttribute('content') || '';
    } else {
      element = doc.querySelector(selector);
      text = element?.textContent?.trim() || '';
    }

    if (text && text.length > 3 && text.length < 300) {
      // Clean up common title artifacts
      text = text.replace(/\s*[|\-–—]\s*[^|\-–—]*$/, ''); // Remove site name
      text = text.replace(/^\s*[^:]*:\s*/, ''); // Remove category prefix
      text = text.trim();
      
      if (text.length > 3) {
        result.itemName = text;
        break;
      }
    }
  }

  // Enhanced price extraction with multi-currency support
  const priceSelectors = [
    // Specific price selectors
    '.price-current',
    '.price-now',
    '.price-sale',
    '.current-price',
    '.sale-price',
    '.final-price',
    '[data-testid="price"]',
    '[data-cy="price"]',
    '[data-automation-id="price"]',
    
    // Class-based selectors
    '.price',
    '[class*="price"]:not([class*="original"]):not([class*="was"]):not([class*="before"])',
    '.cost',
    '.amount',
    '.pricing',
    '.money',
    
    // Amazon specific
    '.a-price-whole',
    '.a-offscreen',
    '#price_inside_buybox',
    
    // Generic selectors
    '[class*="Price"]:not([class*="Original"]):not([class*="Was"])',
    '[id*="price"]',
    
    // Schema.org structured data
    '[itemProp="price"]',
    '[itemProp="lowPrice"]'
  ];

  // Multi-currency regex patterns
  const currencyPatterns = [
    /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,           // USD
    /€\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,           // EUR
    /£\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,           // GBP
    /¥\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,           // JPY/CNY
    /₹\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g,           // INR
    /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/g,             // USD without space
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*USD/gi,        // USD suffix
    /USD\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi         // USD prefix
  ];

  for (const selector of priceSelectors) {
    const elements = doc.querySelectorAll(selector);
    
    for (const element of elements) {
      const text = element.textContent?.trim() || '';
      
      for (const pattern of currencyPatterns) {
        const matches = Array.from(text.matchAll(pattern));
        
        for (const match of matches) {
          const priceStr = match[1] || match[0];
          const price = parseFloat(priceStr.replace(/[,$]/g, ''));
          
          if (price > 0 && price < 100000) {
            result.price = price.toFixed(2);
            break;
          }
        }
        
        if (result.price) break;
      }
      
      if (result.price) break;
    }
    
    if (result.price) break;
  }

  // Enhanced image extraction
  const imageSelectors = [
    // Product-specific image selectors
    '.product-image img',
    '.product-photo img',
    '.main-image img',
    '.hero-image img',
    '.primary-image img',
    '.featured-image img',
    
    // Data attributes
    'img[data-testid*="product"]',
    'img[data-cy*="product"]',
    'img[data-automation-id*="product"]',
    
    // Alt text patterns
    'img[alt*="product" i]',
    'img[alt*="item" i]',
    'img[alt*="photo" i]',
    
    // Class patterns
    'img[class*="product"]',
    'img[class*="Product"]',
    'img[class*="hero"]',
    'img[class*="main"]',
    'img[class*="primary"]',
    'img[class*="featured"]',
    
    // Amazon specific
    '#landingImage',
    '#imgBlkFront',
    
    // Shopify
    '.product-single__photo img',
    '.product__photo img',
    
    // Schema.org
    'img[itemprop="image"]',
    
    // Open Graph
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    
    // Generic fallbacks
    '.gallery img:first-child',
    '.slider img:first-child',
    '.carousel img:first-child',
    'picture img',
    'figure img'
  ];

  for (const selector of imageSelectors) {
    let imgSrc = '';
    
    if (selector.startsWith('meta')) {
      const meta = doc.querySelector(selector);
      imgSrc = meta?.getAttribute('content') || '';
    } else {
      const img = doc.querySelector(selector) as HTMLImageElement;
      if (img) {
        // Try multiple image source attributes
        imgSrc = img.src || 
                 img.getAttribute('data-src') || 
                 img.getAttribute('data-lazy-src') || 
                 img.getAttribute('data-original') || 
                 img.getAttribute('srcset')?.split(' ')[0] || '';
      }
    }
    
    if (imgSrc) {
      try {
        // Convert relative URLs to absolute
        const absoluteUrl = imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, baseUrl).toString();
        
        // Validate image URL
        if (absoluteUrl.match(/\.(jpg|jpeg|png|webp|gif|avif|svg)($|\?)/i) || 
            absoluteUrl.includes('image') || 
            selector.startsWith('meta')) {
          result.imageUrl = absoluteUrl;
          break;
        }
      } catch {
        continue;
      }
    }
  }

  return result;
};

const trackAttempt = (url: string, method: string, success: boolean, error?: string, data?: Partial<ProductInfo>) => {
  const cached = cache.get(url);
  const attempts = cached?.attempts || [];
  
  attempts.push({
    method,
    success,
    error,
    data
  });
  
  // Keep only last 5 attempts
  if (attempts.length > 5) {
    attempts.splice(0, attempts.length - 5);
  }
  
  return attempts;
};

export const parseProductUrl = async (url: string): Promise<ProductInfo> => {
  console.log('🔥 Enhanced URL parser called with:', url);
  
  if (!url?.trim()) return {};
  
  const normalizedUrl = normalizeUrl(url);
  
  // Check cache
  const cached = cache.get(normalizedUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('✅ Cache hit for:', normalizedUrl);
    return cached.data;
  }

  try {
    const urlObj = new URL(normalizedUrl);
    const storeName = extractStoreName(urlObj.hostname);
    
    const result: ProductInfo = { storeName };
    const attempts: ParseAttempt[] = [];

    // Enhanced approach order based on reliability
    const approaches = [
      { name: 'firecrawl', fn: () => fetchViaFirecrawl(normalizedUrl) },
      { name: 'proxy', fn: () => fetchViaProxy(normalizedUrl) },
      { name: 'direct', fn: () => fetchDirect(normalizedUrl) }
    ];

    for (const approach of approaches) {
      try {
        console.log(`🔄 Trying ${approach.name} for:`, normalizedUrl);
        
        const html = await approach.fn();
        
        if (html && html.length > 500) {
          const extracted = extractFromDOM(html, normalizedUrl);
          Object.assign(result, extracted);
          
          const hasUsefulData = result.itemName || result.price || result.imageUrl;
          
          attempts.push({
            method: approach.name,
            success: !!hasUsefulData,
            data: extracted
          });
          
          if (hasUsefulData) {
            console.log('✅ Successfully parsed with', approach.name, ':', result);
            cache.set(normalizedUrl, { 
              data: result, 
              timestamp: Date.now(),
              attempts 
            });
            return result;
          }
        } else {
          attempts.push({
            method: approach.name,
            success: false,
            error: 'Insufficient content'
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`⚠️ ${approach.name} failed:`, errorMsg);
        
        attempts.push({
          method: approach.name,
          success: false,
          error: errorMsg
        });
        
        continue;
      }
    }

    // Enhanced URL-based fallback
    console.log('🔄 Using enhanced URL fallback');
    
    // Try to extract product info from URL structure
    const urlBasedInfo = extractFromUrl(normalizedUrl);
    Object.assign(result, urlBasedInfo);
    
    cache.set(normalizedUrl, { 
      data: result, 
      timestamp: Date.now(),
      attempts 
    });
    
    return result;

  } catch (error) {
    console.error('❌ Parse failed:', error);
    return { storeName: 'Unknown Store' };
  }
};

// Extract info from URL structure as fallback
const extractFromUrl = (url: string): Partial<ProductInfo> => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Common URL patterns for product names
    const productPatterns = [
      /\/products?\/([^\/]+)/i,
      /\/item\/([^\/]+)/i,
      /\/p\/([^\/]+)/i,
      /\/([^\/]+)\/p\//i
    ];
    
    for (const pattern of productPatterns) {
      const match = pathname.match(pattern);
      if (match && match[1]) {
        const productSlug = match[1]
          .replace(/[-_]/g, ' ')
          .replace(/\+/g, ' ')
          .replace(/%20/g, ' ')
          .split('?')[0]
          .trim();
        
        if (productSlug.length > 3 && productSlug.length < 100) {
          return {
            itemName: productSlug.split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ')
          };
        }
      }
    }
  } catch {
    // Ignore URL parsing errors
  }
  
  return {};
};

// Enhanced fetch implementations with better error handling
const fetchViaFirecrawl = async (url: string): Promise<string | null> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('firecrawl-proxy', {
      body: { url }
    });
    
    if (error) throw new Error(`Firecrawl error: ${error.message}`);
    
    const content = data?.html || data?.content || data?.markdown;
    return content && content.length > 500 ? content : null;
  } catch (error) {
    throw new Error(`Firecrawl failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const fetchViaProxy = async (url: string): Promise<string | null> => {
  try {
    // Try multiple proxy services
    const proxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
      `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];
    
    for (const proxyUrl of proxies) {
      try {
        const response = await fetch(proxyUrl, { 
          signal: AbortSignal.timeout(10000),
          headers: {
            'Accept': 'application/json'
          }
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        const content = data.contents || data.data;
        
        if (content && content.length > 500) {
          return content;
        }
      } catch {
        continue;
      }
    }
    
    throw new Error('All proxy attempts failed');
  } catch (error) {
    throw new Error(`Proxy failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const fetchDirect = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    return content && content.length > 500 ? content : null;
  } catch (error) {
    throw new Error(`Direct fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
