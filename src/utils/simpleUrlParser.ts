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

interface ParseAttempt {
  method: string;
  success: boolean;
  error?: string;
  data?: Partial<ProductInfo>;
}

interface StructuredData {
  jsonLd?: any[];
  openGraph?: Record<string, string>;
  microdata?: any[];
}

// Enhanced in-memory cache with attempt tracking
const cache = new Map<string, { data: ProductInfo; timestamp: number; attempts: ParseAttempt[]; canonical?: string }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_RETRIES = 3;

const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Remove extensive tracking parameters including affiliate links
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
      'fbclid', 'gclid', 'gclsrc', 'dclid', 'msclkid',
      'ref', 'referrer', 'source', 'campaign',
      '_ga', '_gl', 'mc_cid', 'mc_eid',
      // Affiliate & tracking extensions
      'irgwc', 'affid', 'subid', 'aff_id', 'affiliate_id',
      'clickid', 'subId1', 'subId2', 'subId3',
      // Shopping specific
      'tag', 'camp', 'creative', 'linkCode', 'creativeASIN'
    ];
    
    trackingParams.forEach(param => urlObj.searchParams.delete(param));
    
    // Remove common fragment identifiers
    urlObj.hash = '';
    
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

// Extract structured data (JSON-LD, OpenGraph, Microdata)
const extractStructuredData = (html: string): StructuredData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const structured: StructuredData = {
    jsonLd: [],
    openGraph: {},
    microdata: []
  };

  // Extract JSON-LD
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  jsonLdScripts.forEach(script => {
    try {
      const jsonText = script.textContent?.trim();
      if (jsonText) {
        // Clean common JSON-LD issues
        const cleanedJson = jsonText
          .replace(/,\s*}/g, '}')  // Remove trailing commas
          .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
        
        const data = JSON.parse(cleanedJson);
        if (Array.isArray(data)) {
          structured.jsonLd?.push(...data);
        } else {
          structured.jsonLd?.push(data);
        }
      }
    } catch (error) {
      console.warn('Failed to parse JSON-LD:', error);
    }
  });

  // Extract OpenGraph
  const ogMetas = doc.querySelectorAll('meta[property^="og:"], meta[name^="twitter:"]');
  ogMetas.forEach(meta => {
    const property = meta.getAttribute('property') || meta.getAttribute('name');
    const content = meta.getAttribute('content');
    if (property && content) {
      structured.openGraph![property] = content;
    }
  });

  // Extract Microdata
  const microdataItems = doc.querySelectorAll('[itemtype*="schema.org/Product"]');
  microdataItems.forEach(item => {
    const itemData: any = { type: item.getAttribute('itemtype') };
    const props = item.querySelectorAll('[itemprop]');
    props.forEach(prop => {
      const name = prop.getAttribute('itemprop');
      const content = prop.getAttribute('content') || prop.textContent?.trim();
      if (name && content) {
        itemData[name] = content;
      }
    });
    structured.microdata?.push(itemData);
  });

  return structured;
};

// Extract canonical URL
const extractCanonicalUrl = (html: string, originalUrl: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const canonical = doc.querySelector('link[rel="canonical"]');
  if (canonical) {
    const href = canonical.getAttribute('href');
    if (href) {
      try {
        return new URL(href, originalUrl).toString();
      } catch {
        return originalUrl;
      }
    }
  }
  
  return originalUrl;
};

// Extract product info from structured data with priority system
const extractFromStructuredData = (structured: StructuredData, baseUrl: string): ProductInfo => {
  const result: ProductInfo = {};

  // Priority 1: JSON-LD Product schema
  for (const item of structured.jsonLd || []) {
    if (item['@type'] === 'Product' || (Array.isArray(item['@type']) && item['@type'].includes('Product'))) {
      // Extract basic product info
      if (item.name && !result.itemName) {
        result.itemName = String(item.name).trim();
      }
      
      if (item.brand?.name && !result.brand) {
        result.brand = String(item.brand.name).trim();
      }
      
      if (item.sku && !result.sku) {
        result.sku = String(item.sku).trim();
      }
      
      // Extract price from offers
      const offers = Array.isArray(item.offers) ? item.offers : [item.offers].filter(Boolean);
      for (const offer of offers) {
        if (offer && !result.price) {
          // Handle different offer types
          if (offer['@type'] === 'AggregateOffer') {
            if (offer.lowPrice) {
              result.price = String(offer.lowPrice);
              result.priceCurrency = offer.priceCurrency || 'USD';
            }
          } else if (offer.price || offer.priceSpecification?.price) {
            result.price = String(offer.price || offer.priceSpecification.price);
            result.priceCurrency = offer.priceCurrency || offer.priceSpecification?.priceCurrency || 'USD';
          }
          
          if (offer.availability && !result.availability) {
            result.availability = String(offer.availability).replace('https://schema.org/', '');
          }
        }
      }
      
      // Extract image
      if (item.image && !result.imageUrl) {
        const imageData = Array.isArray(item.image) ? item.image[0] : item.image;
        const imageUrl = typeof imageData === 'string' ? imageData : imageData?.url;
        if (imageUrl) {
          try {
            result.imageUrl = new URL(imageUrl, baseUrl).toString();
          } catch {
            result.imageUrl = imageUrl;
          }
        }
      }
    }
  }

  // Priority 2: OpenGraph/Twitter
  if (!result.itemName && structured.openGraph) {
    result.itemName = structured.openGraph['og:title'] || structured.openGraph['twitter:title'];
  }
  
  if (!result.imageUrl && structured.openGraph) {
    const ogImage = structured.openGraph['og:image'] || structured.openGraph['twitter:image'];
    if (ogImage) {
      try {
        result.imageUrl = new URL(ogImage, baseUrl).toString();
      } catch {
        result.imageUrl = ogImage;
      }
    }
  }

  // Priority 3: Microdata
  for (const item of structured.microdata || []) {
    if (!result.itemName && item.name) {
      result.itemName = String(item.name).trim();
    }
    if (!result.price && item.price) {
      result.price = String(item.price);
    }
    if (!result.imageUrl && item.image) {
      try {
        result.imageUrl = new URL(item.image, baseUrl).toString();
      } catch {
        result.imageUrl = item.image;
      }
    }
  }

  return result;
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

// Currency inference from locale/domain
const inferCurrency = (url: string, locale?: string): string => {
  const hostname = new URL(url).hostname.toLowerCase();
  
  // Domain-based currency inference
  const currencyMap: Record<string, string> = {
    '.co.uk': 'GBP',
    '.uk': 'GBP',
    '.de': 'EUR',
    '.fr': 'EUR',
    '.es': 'EUR',
    '.it': 'EUR',
    '.nl': 'EUR',
    '.ca': 'CAD',
    '.au': 'AUD',
    '.jp': 'JPY',
    '.in': 'INR',
    '.br': 'BRL',
    '.mx': 'MXN'
  };
  
  for (const [domain, currency] of Object.entries(currencyMap)) {
    if (hostname.includes(domain)) {
      return currency;
    }
  }
  
  // Locale-based inference
  if (locale) {
    const localeMap: Record<string, string> = {
      'en-GB': 'GBP',
      'de-DE': 'EUR',
      'fr-FR': 'EUR',
      'ja-JP': 'JPY',
      'en-CA': 'CAD',
      'en-AU': 'AUD'
    };
    
    if (localeMap[locale]) {
      return localeMap[locale];
    }
  }
  
  return 'USD'; // Default fallback
};

// Domain-specific shims for known problematic sites
const applyDomainShims = (result: ProductInfo, url: string, html: string): ProductInfo => {
  const hostname = new URL(url).hostname.toLowerCase();
  
  if (hostname.includes('shopbop.com')) {
    // Shopbop often has region-gated pricing
    if (!result.price) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      // Try Shopbop-specific selectors
      const priceSelectors = [
        '.price-current-value',
        '[data-test="current-price"]',
        '.price-sales'
      ];
      
      for (const selector of priceSelectors) {
        const element = doc.querySelector(selector);
        if (element?.textContent) {
          const match = element.textContent.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
          if (match) {
            result.price = match[1];
            result.priceCurrency = 'USD';
            break;
          }
        }
      }
    }
  }
  
  if (hostname.includes('asics.com')) {
    // ASICS has regional templates
    if (!result.price && !html.includes('price')) {
      // Suggest retry with US locale headers
      console.log('🔄 ASICS detected - may need US locale retry');
    }
  }
  
  return result;
};

export const parseProductUrl = async (url: string): Promise<ProductInfo> => {
  console.log('🔥 Enhanced URL parser called with:', url);
  
  if (!url?.trim()) {
    console.log('❌ Empty URL provided');
    return {};
  }
  
  const normalizedUrl = normalizeUrl(url);
  
  // Check cache with canonical URL support
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
    let canonicalUrl = normalizedUrl;

    // Simplified reliable approach - prioritize what was working
    const approaches = [
      { 
        name: 'direct', 
        fn: () => fetchDirect(normalizedUrl),
        isStructured: false 
      },
      { 
        name: 'firecrawl', 
        fn: () => fetchViaFirecrawl(normalizedUrl),
        isStructured: false 
      },
      { 
        name: 'proxy', 
        fn: () => fetchViaProxy(normalizedUrl),
        isStructured: false 
      }
    ];

    for (const approach of approaches) {
      try {
        console.log(`🔄 Trying ${approach.name} for:`, normalizedUrl);
        
        const data = await approach.fn();
        console.log(`📊 ${approach.name} returned:`, { 
          dataType: typeof data, 
          hasContent: data ? (typeof data === 'string' ? data.length : 'object') : 'null'
        });
        
        if (data && typeof data === 'string' && data.length > 500) {
          // Handle HTML response - focus on DOM extraction
          console.log(`🎯 Processing HTML data from ${approach.name}, length:`, data.length);
          const html = data as string;
          
          // Extract canonical URL on first successful fetch
          if (canonicalUrl === normalizedUrl) {
            canonicalUrl = extractCanonicalUrl(html, normalizedUrl);
            if (canonicalUrl !== normalizedUrl) {
              console.log('📍 Found canonical URL:', canonicalUrl);
              // Check cache with canonical URL
              const canonicalCached = cache.get(canonicalUrl);
              if (canonicalCached && Date.now() - canonicalCached.timestamp < CACHE_TTL) {
                console.log('✅ Canonical cache hit:', canonicalUrl);
                return canonicalCached.data;
              }
            }
          }
          
          // Primary: Direct DOM extraction (what was working before)
          console.log(`🎯 Starting DOM extraction...`);
          const domResult = extractFromDOM(html, canonicalUrl);
          console.log(`🎯 DOM parsing result:`, domResult);
          Object.assign(result, domResult);
          
          // Secondary: Try structured data to fill gaps
          console.log(`🎯 Checking for structured data to fill gaps...`);
          const structured = extractStructuredData(html);
          const structuredResult = extractFromStructuredData(structured, canonicalUrl);
          console.log(`🎯 Structured result:`, structuredResult);
          
          // Only use structured data to fill missing fields
          if (!result.itemName && structuredResult.itemName) {
            result.itemName = structuredResult.itemName;
          }
          if (!result.price && structuredResult.price) {
            result.price = structuredResult.price;
            result.priceCurrency = structuredResult.priceCurrency;
          }
          if (!result.imageUrl && structuredResult.imageUrl) {
            result.imageUrl = structuredResult.imageUrl;
          }
          
          // Apply domain-specific fixes
          applyDomainShims(result, canonicalUrl, html);
          console.log(`🎯 Result after domain shims:`, result);
          
          // Infer currency if missing
          if (result.price && !result.priceCurrency) {
            const locale = structured.openGraph?.['og:locale'];
            result.priceCurrency = inferCurrency(canonicalUrl, locale);
          }
          
          const hasUsefulData = result.itemName || result.price || result.imageUrl;
          console.log(`🎯 Final useful data check:`, { 
            hasUsefulData, 
            itemName: !!result.itemName, 
            price: !!result.price, 
            imageUrl: !!result.imageUrl,
            fullResult: result
          });
          
          attempts.push({
            method: approach.name,
            success: !!hasUsefulData,
            data: { ...result }
          });
          
          if (hasUsefulData) {
            console.log('✅ Successfully parsed with', approach.name, ':', result);
            cache.set(canonicalUrl, { 
              data: result, 
              timestamp: Date.now(),
              attempts,
              canonical: canonicalUrl
            });
            return result;
          }
        } else {
          console.log(`⚠️ ${approach.name} returned insufficient data:`, { 
            dataType: typeof data,
            dataLength: typeof data === 'string' ? data.length : 'N/A'
          });
          attempts.push({
            method: approach.name,
            success: false,
            error: 'Insufficient content or no data'
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`⚠️ ${approach.name} failed with error:`, errorMsg);
        
        attempts.push({
          method: approach.name,
          success: false,
          error: errorMsg
        });
        
        // Retry with different headers for region-locked sites
        if (errorMsg.includes('403') || errorMsg.includes('429')) {
          try {
            console.log(`🔄 Retrying ${approach.name} with US headers...`);
            await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
            
            if (approach.name === 'direct') {
              const retryData = await fetchDirectWithHeaders(canonicalUrl);
              if (retryData && retryData.length > 500) {
                const structured = extractStructuredData(retryData);
                const structuredResult = extractFromStructuredData(structured, canonicalUrl);
                Object.assign(result, structuredResult);
                
                if (!result.itemName || !result.price || !result.imageUrl) {
                  const domResult = extractFromDOM(retryData, canonicalUrl);
                  Object.assign(result, domResult);
                }
                
                applyDomainShims(result, canonicalUrl, retryData);
                
                if (result.itemName || result.price || result.imageUrl) {
                  console.log('✅ Retry successful with US headers');
                  break;
                }
              }
            }
          } catch (retryError) {
            console.log('⚠️ Retry failed:', retryError);
          }
        }
        
        continue;
      }
    }

    // Enhanced URL-based fallback
    console.log('🔄 Using enhanced URL fallback');
    
    // Try to extract product info from URL structure
    const urlBasedInfo = extractFromUrl(canonicalUrl);
    Object.assign(result, urlBasedInfo);
    
    cache.set(canonicalUrl, { 
      data: result, 
      timestamp: Date.now(),
      attempts,
      canonical: canonicalUrl
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
const fetchViaFirecrawlExtract = async (url: string): Promise<ProductInfo | null> => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    const { data, error } = await supabase.functions.invoke('firecrawl-proxy', {
      body: { 
        url,
        mode: 'extract',
        schema: {
          type: 'object',
          properties: {
            itemName: { type: 'string', description: 'Product name or title' },
            price: { type: 'string', description: 'Product price as string' },
            priceCurrency: { type: 'string', description: 'Currency code (ISO 4217)' },
            availability: { type: 'string', description: 'Product availability status' },
            imageUrl: { type: 'string', description: 'Main product image URL' },
            brand: { type: 'string', description: 'Product brand name' },
            sku: { type: 'string', description: 'Product SKU or identifier' }
          },
          required: ['itemName']
        },
        prompt: 'Extract product information. Prefer JSON-LD Product schema with offers. If missing, use OpenGraph/Twitter meta tags. If still missing, find visible price near add-to-cart button. Return priceCurrency as ISO 4217 code (USD, EUR, GBP, etc).'
      }
    });
    
    if (error) throw new Error(`Firecrawl extract error: ${error.message}`);
    
    return data?.extracted || null;
  } catch (error) {
    throw new Error(`Firecrawl extract failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

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

// Enhanced direct fetch with randomized headers for retry scenarios
const fetchDirectWithHeaders = async (url: string): Promise<string | null> => {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
  ];
  
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Upgrade-Insecure-Requests': '1'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    return content && content.length > 500 ? content : null;
  } catch (error) {
    throw new Error(`Enhanced direct fetch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
