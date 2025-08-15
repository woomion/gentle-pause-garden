interface ProductInfo {
  itemName?: string;
  storeName?: string;
  price?: string;
  priceCurrency?: string;
  imageUrl?: string;
  availability?: string;
  brand?: string;
  sku?: string;
}

interface DomainParser {
  domain: string;
  storeName: string;
  parseTitle: (doc: Document) => string | null;
  parsePrice: (doc: Document) => { price: string; currency: string } | null;
  parseImage: (doc: Document) => string | null;
}

// Enhanced cache with better TTL
const cache = new Map<string, { data: ProductInfo; timestamp: number; ttl: number }>();

const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    
    // Remove tracking parameters
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'fbclid', 'gclid', 'ref', 'referrer', 'source', 'campaign',
      '_ga', '_gl', 'mc_cid', 'mc_eid', 'affid', 'clickid'
    ];
    
    trackingParams.forEach(param => urlObj.searchParams.delete(param));
    urlObj.hash = '';
    
    return urlObj.toString();
  } catch {
    return url;
  }
};

// Domain-specific parsers for major retailers
const domainParsers: DomainParser[] = [
  {
    domain: 'amazon.com',
    storeName: 'Amazon',
    parseTitle: (doc) => {
      const selectors = ['#productTitle', 'span#productTitle', 'h1.a-size-large'];
      for (const selector of selectors) {
        const element = doc.querySelector(selector);
        if (element?.textContent?.trim()) {
          return element.textContent.trim();
        }
      }
      return null;
    },
    parsePrice: (doc) => {
      const priceSelectors = [
        '.a-price .a-offscreen',
        '.a-price-whole',
        '#price_inside_buybox .a-price .a-offscreen',
        '.a-price-current .a-offscreen'
      ];
      
      for (const selector of priceSelectors) {
        const element = doc.querySelector(selector);
        if (element?.textContent) {
          const match = element.textContent.match(/\$?(\d+\.?\d*)/);
          if (match) {
            return { price: match[1], currency: 'USD' };
          }
        }
      }
      return null;
    },
    parseImage: (doc) => {
      const imgSelectors = ['#landingImage', '#imgBlkFront', '.a-dynamic-image'];
      for (const selector of imgSelectors) {
        const img = doc.querySelector(selector) as HTMLImageElement;
        if (img?.src) {
          return img.src;
        }
      }
      return null;
    }
  },
  {
    domain: 'target.com',
    storeName: 'Target',
    parseTitle: (doc) => {
      const selectors = [
        'h1[data-test="product-title"]',
        'h1[data-automation-id="product-title"]',
        '.pdp-product-name h1'
      ];
      for (const selector of selectors) {
        const element = doc.querySelector(selector);
        if (element?.textContent?.trim()) {
          return element.textContent.trim();
        }
      }
      return null;
    },
    parsePrice: (doc) => {
      const priceSelectors = [
        '[data-test="product-price"]',
        '.sr-only:contains("current price")',
        '.h-text-red'
      ];
      
      for (const selector of priceSelectors) {
        const element = doc.querySelector(selector);
        if (element?.textContent) {
          const match = element.textContent.match(/\$(\d+\.?\d*)/);
          if (match) {
            return { price: match[1], currency: 'USD' };
          }
        }
      }
      return null;
    },
    parseImage: (doc) => {
      const img = doc.querySelector('img[data-test="hero-image"]') as HTMLImageElement;
      return img?.src || null;
    }
  },
  {
    domain: 'walmart.com',
    storeName: 'Walmart',
    parseTitle: (doc) => {
      const element = doc.querySelector('h1[data-automation-id="product-title"]');
      return element?.textContent?.trim() || null;
    },
    parsePrice: (doc) => {
      const element = doc.querySelector('[data-automation-id="product-price"]');
      if (element?.textContent) {
        const match = element.textContent.match(/\$(\d+\.?\d*)/);
        if (match) {
          return { price: match[1], currency: 'USD' };
        }
      }
      return null;
    },
    parseImage: (doc) => {
      const img = doc.querySelector('img[data-testid="hero-image"]') as HTMLImageElement;
      return img?.src || null;
    }
  },
  {
    domain: 'shopbop.com',
    storeName: 'Shopbop',
    parseTitle: (doc) => {
      const selectors = [
        'h1.product-title',
        '.product-details h1',
        'h1[data-test="product-title"]'
      ];
      for (const selector of selectors) {
        const element = doc.querySelector(selector);
        if (element?.textContent?.trim()) {
          return element.textContent.trim();
        }
      }
      return null;
    },
    parsePrice: (doc) => {
      const priceSelectors = [
        '.price-current-value',
        '[data-test="current-price"]',
        '.price-sales'
      ];
      
      for (const selector of priceSelectors) {
        const element = doc.querySelector(selector);
        if (element?.textContent) {
          const match = element.textContent.match(/\$(\d+\.?\d*)/);
          if (match) {
            return { price: match[1], currency: 'USD' };
          }
        }
      }
      return null;
    },
    parseImage: (doc) => {
      const img = doc.querySelector('.product-image img') as HTMLImageElement;
      return img?.src || null;
    }
  }
];

// Generic parser for unknown domains
const parseGeneric = (doc: Document, url: string): ProductInfo => {
  const result: ProductInfo = {};
  
  // Try structured data first
  const structuredData = extractJsonLd(doc);
  if (structuredData) {
    Object.assign(result, structuredData);
  }
  
  // Try OpenGraph
  if (!result.itemName) {
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
    if (ogTitle) {
      result.itemName = ogTitle.replace(/\s*[|\-–—]\s*[^|\-–—]*$/, '').trim();
    }
  }
  
  // Generic title fallback
  if (!result.itemName) {
    const titleSelectors = [
      'h1[class*="product"]',
      'h1[class*="title"]',
      '.product-title',
      '.product-name',
      'h1'
    ];
    
    for (const selector of titleSelectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim() && element.textContent.length > 3) {
        result.itemName = element.textContent.trim();
        break;
      }
    }
  }
  
  // Generic price extraction
  if (!result.price) {
    const priceSelectors = [
      '.price',
      '[class*="price"]:not([class*="original"])',
      '[data-testid*="price"]',
      '[id*="price"]'
    ];
    
    for (const selector of priceSelectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent) {
        const match = element.textContent.match(/[\$€£¥₹](\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (match) {
          result.price = match[1];
          result.priceCurrency = inferCurrencyFromSymbol(match[0].charAt(0));
          break;
        }
      }
    }
  }
  
  // Generic image extraction
  if (!result.imageUrl) {
    const imgSelectors = [
      '.product-image img',
      '.hero-image img',
      'meta[property="og:image"]'
    ];
    
    for (const selector of imgSelectors) {
      if (selector.startsWith('meta')) {
        const meta = doc.querySelector(selector);
        const content = meta?.getAttribute('content');
        if (content) {
          result.imageUrl = new URL(content, url).toString();
          break;
        }
      } else {
        const img = doc.querySelector(selector) as HTMLImageElement;
        if (img?.src) {
          result.imageUrl = img.src;
          break;
        }
      }
    }
  }
  
  return result;
};

const extractJsonLd = (doc: Document): ProductInfo | null => {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      const products = Array.isArray(data) ? data : [data];
      
      for (const item of products) {
        if (item['@type'] === 'Product' || (Array.isArray(item['@type']) && item['@type'].includes('Product'))) {
          const result: ProductInfo = {};
          
          if (item.name) result.itemName = item.name;
          if (item.brand?.name) result.brand = item.brand.name;
          if (item.sku) result.sku = item.sku;
          
          // Extract price from offers
          const offers = Array.isArray(item.offers) ? item.offers : [item.offers].filter(Boolean);
          for (const offer of offers) {
            if (offer?.price) {
              result.price = String(offer.price);
              result.priceCurrency = offer.priceCurrency || 'USD';
              break;
            }
          }
          
          // Extract image
          if (item.image) {
            const imageData = Array.isArray(item.image) ? item.image[0] : item.image;
            result.imageUrl = typeof imageData === 'string' ? imageData : imageData?.url;
          }
          
          return result;
        }
      }
    } catch {
      continue;
    }
  }
  
  return null;
};

const inferCurrencyFromSymbol = (symbol: string): string => {
  const currencyMap: Record<string, string> = {
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY',
    '₹': 'INR'
  };
  return currencyMap[symbol] || 'USD';
};

const getStoreName = (hostname: string): string => {
  const cleanHostname = hostname.replace(/^www\./, '').toLowerCase();
  
  const storeMap: Record<string, string> = {
    'amazon.com': 'Amazon',
    'amazon.ca': 'Amazon',
    'amazon.co.uk': 'Amazon',
    'target.com': 'Target',
    'walmart.com': 'Walmart',
    'shopbop.com': 'Shopbop',
    'nordstrom.com': 'Nordstrom',
    'zara.com': 'Zara',
    'hm.com': 'H&M',
    'nike.com': 'Nike',
    'adidas.com': 'Adidas'
  };
  
  if (storeMap[cleanHostname]) {
    return storeMap[cleanHostname];
  }
  
  // Fallback to domain name
  const parts = cleanHostname.split('.');
  const domain = parts[parts.length - 2] || cleanHostname;
  return domain.charAt(0).toUpperCase() + domain.slice(1);
};

const fetchWithRetry = async (url: string, maxRetries = 2): Promise<string> => {
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Connection': 'keep-alive'
        }
      });
      
      if (response.ok) {
        return await response.text();
      }
      
      if (response.status === 403 || response.status === 429) {
        // Wait before retry for rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
    }
  }
  
  throw new Error('Max retries exceeded');
};

export const parseProductUrl = async (url: string): Promise<ProductInfo> => {
  console.log('🚀 Enhanced URL parser called with:', url);
  
  if (!url?.trim()) {
    return {};
  }
  
  const normalizedUrl = normalizeUrl(url);
  
  // Check cache
  const cached = cache.get(normalizedUrl);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    console.log('✅ Cache hit');
    return cached.data;
  }
  
  try {
    const urlObj = new URL(normalizedUrl);
    const hostname = urlObj.hostname.toLowerCase();
    const storeName = getStoreName(hostname);
    
    // Find domain-specific parser
    const domainParser = domainParsers.find(parser => 
      hostname.includes(parser.domain)
    );
    
    console.log('🎯 Domain parser found:', !!domainParser, 'for', hostname);
    
    // Try to fetch the page
    let html: string;
    try {
      html = await fetchWithRetry(normalizedUrl);
      console.log('✅ Successfully fetched HTML, length:', html.length);
    } catch (error) {
      console.log('❌ Failed to fetch HTML:', error);
      // Return basic info from URL
      return {
        storeName,
        itemName: extractTitleFromUrl(normalizedUrl)
      };
    }
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    let result: ProductInfo = { storeName };
    
    if (domainParser) {
      // Use domain-specific parser
      const title = domainParser.parseTitle(doc);
      if (title) result.itemName = title;
      
      const priceData = domainParser.parsePrice(doc);
      if (priceData) {
        result.price = priceData.price;
        result.priceCurrency = priceData.currency;
      }
      
      const image = domainParser.parseImage(doc);
      if (image) result.imageUrl = image;
      
      console.log('🎯 Domain-specific parsing result:', result);
    } else {
      // Use generic parser
      result = { storeName, ...parseGeneric(doc, normalizedUrl) };
      console.log('🎯 Generic parsing result:', result);
    }
    
    // Cache with appropriate TTL
    const ttl = (result.itemName && result.price) ? 3600000 : 1800000; // 1h vs 30min
    cache.set(normalizedUrl, {
      data: result,
      timestamp: Date.now(),
      ttl
    });
    
    console.log('✅ Final result:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Parse failed:', error);
    
    // Fallback: extract what we can from URL
    const urlObj = new URL(normalizedUrl);
    const storeName = getStoreName(urlObj.hostname);
    const itemName = extractTitleFromUrl(normalizedUrl);
    
    return { storeName, itemName };
  }
};

const extractTitleFromUrl = (url: string): string | undefined => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Common patterns for product names in URLs
    const patterns = [
      /\/products?\/([^\/]+)/i,
      /\/p\/([^\/]+)/i,
      /\/item\/([^\/]+)/i,
      /\/([^\/]+)\/p\//i
    ];
    
    for (const pattern of patterns) {
      const match = pathname.match(pattern);
      if (match && match[1]) {
        return match[1]
          .replace(/[-_]/g, ' ')
          .replace(/%20/g, ' ')
          .split('?')[0]
          .trim()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
    }
  } catch {
    // Ignore errors
  }
  
  return undefined;
};