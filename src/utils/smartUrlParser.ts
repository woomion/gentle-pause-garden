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

interface ParseResult {
  success: boolean;
  data: ProductInfo;
  method: string;
  confidence: number;
  error?: string;
}

interface SiteConfig {
  domain: string;
  problematic: boolean;
  requiresJs: boolean;
  extractSchema?: any;
}

// Configuration for site-specific handling
const SITE_CONFIGS: SiteConfig[] = [
  { domain: 'shopbop.com', problematic: true, requiresJs: true },
  { domain: 'asics.com', problematic: true, requiresJs: true },
  { domain: 'nike.com', problematic: true, requiresJs: true },
  { domain: 'adidas.com', problematic: true, requiresJs: true },
  { domain: 'zara.com', problematic: true, requiresJs: true },
  { domain: 'hm.com', problematic: true, requiresJs: true },
  { domain: 'lululemon.com', problematic: true, requiresJs: true },
  { domain: 'amazon.com', problematic: false, requiresJs: false },
  { domain: 'target.com', problematic: false, requiresJs: false },
  { domain: 'walmart.com', problematic: false, requiresJs: false },
];

// Structured extraction schema for Firecrawl
const PRODUCT_EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    itemName: {
      type: "string",
      description: "The name or title of the product"
    },
    price: {
      type: "string", 
      description: "The current price of the product (numbers only, no currency symbols)"
    },
    currency: {
      type: "string",
      description: "The currency code (USD, EUR, GBP, etc.)"
    },
    brand: {
      type: "string",
      description: "The brand or manufacturer of the product"
    },
    imageUrl: {
      type: "string",
      description: "URL of the main product image"
    },
    availability: {
      type: "string", 
      description: "Product availability status (in stock, out of stock, etc.)"
    }
  },
  required: ["itemName"]
};

// Cache implementation
const cache = new Map<string, { data: ParseResult; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

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

const getSiteConfig = (url: string): SiteConfig | null => {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    return SITE_CONFIGS.find(config => hostname.includes(config.domain)) || null;
  } catch {
    return null;
  }
};

const extractStoreName = (url: string): string => {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    const parts = hostname.split('.');
    const domain = parts[parts.length - 2] || hostname;
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Unknown Store';
  }
};

// Calculate biggest image by area for generic fallback
const getBiggestImageByArea = (doc: Document, baseUrl: string): string | null => {
  const images = doc.querySelectorAll('img[src]') as NodeListOf<HTMLImageElement>;
  let biggestImage: HTMLImageElement | null = null;
  let maxArea = 0;

  for (const img of images) {
    // Skip tiny images, icons, and loading indicators
    if (img.width && img.height && img.width > 100 && img.height > 100) {
      const area = img.width * img.height;
      if (area > maxArea && 
          !img.src.includes('icon') && 
          !img.src.includes('logo') &&
          !img.src.includes('loading') &&
          !img.src.includes('placeholder')) {
        maxArea = area;
        biggestImage = img;
      }
    }
  }

  if (biggestImage?.src) {
    try {
      return new URL(biggestImage.src, baseUrl).toString();
    } catch {
      return biggestImage.src;
    }
  }

  return null;
};

// Find price near "Add to cart" or "Buy now" buttons for proximity detection
const findPriceNearBuyButton = (doc: Document): string | null => {
  const buySelectors = [
    'button:contains("Add to cart")',
    'button:contains("Buy now")', 
    'button:contains("Add to bag")',
    'button:contains("Purchase")',
    '[class*="add-to-cart"]',
    '[class*="buy-now"]',
    '[data-testid*="add-to-cart"]'
  ];

  for (const selector of buySelectors) {
    const button = doc.querySelector(selector);
    if (button) {
      // Look for price elements within 3 parent levels
      let current = button.parentElement;
      let level = 0;
      
      while (current && level < 3) {
        const priceElements = current.querySelectorAll('[class*="price"], [data-testid*="price"]');
        
        for (const priceEl of priceElements) {
          const text = priceEl.textContent || '';
          const match = text.match(/[\$€£¥₹](\d+(?:,\d{3})*(?:\.\d{2})?)/);
          if (match) {
            return match[1].replace(/,/g, '');
          }
        }
        
        current = current.parentElement;
        level++;
      }
    }
  }
  
  return null;
};

// Enhanced Firecrawl integration with extract mode
const fetchViaFirecrawlExtract = async (url: string): Promise<ParseResult> => {
  try {
    console.log('🎯 Using Firecrawl extract mode for:', url);
    
    const response = await fetch('https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/firecrawl-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        mode: 'extract',
        schema: PRODUCT_EXTRACTION_SCHEMA,
        prompt: 'Extract product information including name, price, brand, and main image from this product page'
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl extract failed: ${response.status}`);
    }

    const data = await response.json();
    if (data.extracted) {
      const result: ProductInfo = {
        itemName: data.extracted.itemName,
        price: data.extracted.price,
        priceCurrency: data.extracted.currency || 'USD',
        brand: data.extracted.brand,
        imageUrl: data.extracted.imageUrl,
        availability: data.extracted.availability,
        storeName: extractStoreName(url)
      };

      return {
        success: true,
        data: result,
        method: 'firecrawl-extract',
        confidence: data.extracted.itemName ? 0.8 : 0.4
      };
    }

    throw new Error('No data extracted');
  } catch (error) {
    console.error('Firecrawl extract failed:', error);
    return {
      success: false,
      data: { storeName: extractStoreName(url) },
      method: 'firecrawl-extract',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Enhanced generic parser with improved fallbacks
const parseGenericEnhanced = async (html: string, url: string): Promise<ParseResult> => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const result: ProductInfo = {
      storeName: extractStoreName(url)
    };

    // Extract structured data first
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent || '');
        const products = Array.isArray(data) ? data : [data];
        
        for (const item of products) {
          if (item['@type'] === 'Product' || (Array.isArray(item['@type']) && item['@type'].includes('Product'))) {
            if (item.name) result.itemName = item.name;
            if (item.brand?.name) result.brand = item.brand.name;
            
            const offers = Array.isArray(item.offers) ? item.offers : [item.offers].filter(Boolean);
            for (const offer of offers) {
              if (offer?.price) {
                result.price = String(offer.price);
                result.priceCurrency = offer.priceCurrency || 'USD';
                break;
              }
            }
            
            if (item.image) {
              const imageData = Array.isArray(item.image) ? item.image[0] : item.image;
              result.imageUrl = typeof imageData === 'string' ? imageData : imageData?.url;
            }
            break;
          }
        }
      } catch {
        continue;
      }
    }

    // OpenGraph fallback
    if (!result.itemName) {
      const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
      if (ogTitle) {
        result.itemName = ogTitle.replace(/\s*[|\-–—]\s*[^|\-–—]*$/, '').trim();
      }
    }

    if (!result.imageUrl) {
      const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
      if (ogImage) {
        result.imageUrl = new URL(ogImage, url).toString();
      }
    }

    // Enhanced title extraction
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

    // Enhanced price extraction with proximity detection
    if (!result.price) {
      // Try proximity detection first
      const proximityPrice = findPriceNearBuyButton(doc);
      if (proximityPrice) {
        result.price = proximityPrice;
        result.priceCurrency = 'USD'; // Default, could be enhanced
      } else {
        // Fallback to standard selectors
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
              result.price = match[1].replace(/,/g, '');
              result.priceCurrency = 'USD'; // Could be enhanced with currency detection
              break;
            }
          }
        }
      }
    }

    // Enhanced image extraction with biggest-by-area fallback
    if (!result.imageUrl) {
      const imgSelectors = [
        '.product-image img',
        '.hero-image img',
        'img[data-testid*="product"]'
      ];
      
      for (const selector of imgSelectors) {
        const img = doc.querySelector(selector) as HTMLImageElement;
        if (img?.src) {
          result.imageUrl = img.src;
          break;
        }
      }
      
      // Use biggest image by area as last resort
      if (!result.imageUrl) {
        result.imageUrl = getBiggestImageByArea(doc, url);
      }
    }

    const confidence = (result.itemName ? 0.4 : 0) + (result.price ? 0.3 : 0) + (result.imageUrl ? 0.2 : 0);

    return {
      success: true,
      data: result,
      method: 'enhanced-generic',
      confidence
    };
  } catch (error) {
    return {
      success: false,
      data: { storeName: extractStoreName(url) },
      method: 'enhanced-generic',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Main smart parser with layered strategy
export const parseProductUrlSmart = async (url: string): Promise<ParseResult> => {
  const normalizedUrl = normalizeUrl(url);
  
  // Check cache first
  const cached = cache.get(normalizedUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const siteConfig = getSiteConfig(url);
  
  try {
    let result: ParseResult;

    // Phase 1: Smart routing based on site configuration
    if (siteConfig?.problematic) {
      console.log('🎯 Detected problematic site, using Firecrawl extract mode');
      result = await fetchViaFirecrawlExtract(url);
      
      // If extract mode fails, fallback to enhanced generic
      if (!result.success || result.confidence < 0.3) {
        console.log('📋 Extract mode failed, trying enhanced parser');
        
        // Try to get HTML via Firecrawl first
        try {
          const response = await fetch('https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/firecrawl-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.html) {
              result = await parseGenericEnhanced(data.html, url);
            }
          }
        } catch (error) {
          console.log('📋 Firecrawl HTML fetch failed, using simple parser');
          const { parseProductUrl: simpleParser } = await import('./simpleUrlParser');
          const simpleResult = await simpleParser(url);
          result = {
            success: true,
            data: simpleResult,
            method: 'simple-fallback',
            confidence: 0.2
          };
        }
      }
    } else {
      // For non-problematic sites, use the enhanced parser
      console.log('📋 Using enhanced parser for well-behaved site');
      const { parseProductUrl: enhancedParser } = await import('./enhancedUrlParser');
      const enhancedResult = await enhancedParser(url);
      result = {
        success: true,
        data: enhancedResult,
        method: 'enhanced',
        confidence: 0.7
      };
    }

    // Cache the result
    cache.set(normalizedUrl, { data: result, timestamp: Date.now() });
    
    return result;
  } catch (error) {
    const errorResult: ParseResult = {
      success: false,
      data: { storeName: extractStoreName(url) },
      method: 'error',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
    
    cache.set(normalizedUrl, { data: errorResult, timestamp: Date.now() });
    return errorResult;
  }
};

// Legacy compatibility function
export const parseProductUrl = async (url: string): Promise<ProductInfo> => {
  const result = await parseProductUrlSmart(url);
  return result.data;
};