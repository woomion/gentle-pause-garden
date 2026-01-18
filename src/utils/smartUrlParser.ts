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
  canonicalUrl?: string;
  screenshot?: string;
  raw?: any;
}

interface SiteConfig {
  domain: string;
  problematic: boolean;
  requiresJs: boolean;
  extractSchema?: any;
}

// Configuration for site-specific handling
const SITE_CONFIGS: SiteConfig[] = [
  // Fashion sites that heavily use JS
  { domain: 'shopbop.com', problematic: true, requiresJs: true },
  { domain: 'asics.com', problematic: true, requiresJs: true },
  { domain: 'nike.com', problematic: true, requiresJs: true },
  { domain: 'adidas.com', problematic: true, requiresJs: true },
  { domain: 'zara.com', problematic: true, requiresJs: true },
  { domain: 'hm.com', problematic: true, requiresJs: true },
  { domain: 'lululemon.com', problematic: true, requiresJs: true },
  { domain: 'anthropologie.com', problematic: true, requiresJs: true },
  { domain: 'freepeople.com', problematic: true, requiresJs: true },
  { domain: 'nordstrom.com', problematic: true, requiresJs: true },
  { domain: 'saksfifthavenue.com', problematic: true, requiresJs: true },
  { domain: 'barneys.com', problematic: true, requiresJs: true },
  { domain: 'ssense.com', problematic: true, requiresJs: true },
  { domain: 'mrporter.com', problematic: true, requiresJs: true },
  { domain: 'netaporter.com', problematic: true, requiresJs: true },
  { domain: 'patagonia.com', problematic: true, requiresJs: true },
  { domain: 'sculpd.com', problematic: true, requiresJs: true },
  
  // Amazon shortener domains - need expansion first
  { domain: 'a.co', problematic: false, requiresJs: false },
  { domain: 'amzn.to', problematic: false, requiresJs: false },
  
  // Well-structured e-commerce sites
  { domain: 'amazon.com', problematic: false, requiresJs: false },
  { domain: 'target.com', problematic: false, requiresJs: false },
  { domain: 'walmart.com', problematic: false, requiresJs: false },
  { domain: 'bestbuy.com', problematic: false, requiresJs: false },
  { domain: 'homedepot.com', problematic: false, requiresJs: false },
  { domain: 'lowes.com', problematic: false, requiresJs: false },
  { domain: 'wayfair.com', problematic: false, requiresJs: false },
  { domain: 'overstock.com', problematic: false, requiresJs: false },
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
  const images = doc.querySelectorAll('img[src], img[data-src]') as NodeListOf<HTMLImageElement>;
  let biggestImage: HTMLImageElement | null = null;
  let maxArea = 0;

  for (const img of images) {
    // Get actual source - check data-src for lazy-loaded images
    const imgSrc = img.src || img.getAttribute('data-src') || '';
    
    // Skip tiny images, icons, and loading indicators
    const width = img.width || img.naturalWidth || parseInt(img.getAttribute('width') || '0');
    const height = img.height || img.naturalHeight || parseInt(img.getAttribute('height') || '0');
    
    if (width > 100 && height > 100) {
      const area = width * height;
      if (area > maxArea && 
          !imgSrc.includes('icon') && 
          !imgSrc.includes('logo') &&
          !imgSrc.includes('loading') &&
          !imgSrc.includes('placeholder') &&
          !imgSrc.includes('pixel') &&
          !imgSrc.includes('transparent')) {
        maxArea = area;
        biggestImage = img;
      }
    }
  }

  if (biggestImage) {
    const imgSrc = biggestImage.src || biggestImage.getAttribute('data-src') || '';
    if (imgSrc) {
      try {
        return new URL(imgSrc, baseUrl).toString();
      } catch {
        return imgSrc;
      }
    }
  }

  return null;
};

// Enhanced image extraction with multiple strategies
const extractBestImage = (doc: Document, url: string): string | null => {
  // Strategy 1: og:image (most reliable for e-commerce)
  const ogImage = doc.querySelector('meta[property="og:image"]')?.getAttribute('content');
  if (ogImage) {
    try {
      const imageUrl = new URL(ogImage, url).toString();
      if (isValidProductImageUrl(imageUrl)) {
        console.log('🖼️ Found og:image:', imageUrl);
        return imageUrl;
      }
    } catch {}
  }

  // Strategy 2: twitter:image
  const twitterImage = doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
  if (twitterImage) {
    try {
      const imageUrl = new URL(twitterImage, url).toString();
      if (isValidProductImageUrl(imageUrl)) {
        console.log('🖼️ Found twitter:image:', imageUrl);
        return imageUrl;
      }
    } catch {}
  }

  // Strategy 3: JSON-LD Product schema
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item['@type'] === 'Product' || (Array.isArray(item['@type']) && item['@type'].includes('Product'))) {
          if (item.image) {
            const imageData = Array.isArray(item.image) ? item.image[0] : item.image;
            const imageUrl = typeof imageData === 'string' ? imageData : imageData?.url;
            if (imageUrl) {
              const normalizedUrl = new URL(imageUrl, url).toString();
              if (isValidProductImageUrl(normalizedUrl)) {
                console.log('🖼️ Found JSON-LD image:', normalizedUrl);
                return normalizedUrl;
              }
            }
          }
        }
      }
    } catch {}
  }

  // Strategy 4: itemprop="image"
  const itempropImg = doc.querySelector('[itemprop="image"]');
  if (itempropImg) {
    const imgSrc = itempropImg.getAttribute('src') || itempropImg.getAttribute('content') || itempropImg.getAttribute('href');
    if (imgSrc) {
      try {
        const imageUrl = new URL(imgSrc, url).toString();
        if (isValidProductImageUrl(imageUrl)) {
          console.log('🖼️ Found itemprop image:', imageUrl);
          return imageUrl;
        }
      } catch {}
    }
  }

  // Strategy 5: Product-specific image selectors
  const productImageSelectors = [
    '.product-image img[src]',
    '.product-gallery img[src]',
    '.hero-image img[src]',
    '[data-testid*="product"] img[src]',
    '.main-image img[src]',
    '.pdp-image img[src]',
    'img[class*="product"][src]',
    'img[class*="hero"][src]',
    'img[data-src][class*="product"]',
    'img[data-src][class*="main"]',
  ];

  for (const selector of productImageSelectors) {
    const img = doc.querySelector(selector) as HTMLImageElement;
    if (img) {
      const imgSrc = img.src || img.getAttribute('data-src') || '';
      if (imgSrc && isValidProductImageUrl(imgSrc)) {
        try {
          const imageUrl = new URL(imgSrc, url).toString();
          console.log('🖼️ Found product image via selector:', imageUrl);
          return imageUrl;
        } catch {}
      }
    }
  }

  // Strategy 6: picture > source srcset
  const pictureSource = doc.querySelector('picture source[srcset]');
  if (pictureSource) {
    const srcset = pictureSource.getAttribute('srcset') || '';
    const firstUrl = srcset.split(',')[0]?.trim().split(' ')[0];
    if (firstUrl && isValidProductImageUrl(firstUrl)) {
      try {
        const imageUrl = new URL(firstUrl, url).toString();
        console.log('🖼️ Found picture source:', imageUrl);
        return imageUrl;
      } catch {}
    }
  }

  // Strategy 7: Large img with srcset
  const imgsWithSrcset = doc.querySelectorAll('img[srcset]');
  for (const img of imgsWithSrcset) {
    const srcset = img.getAttribute('srcset') || '';
    // Parse and get the largest
    const parts = srcset.split(',').map(s => s.trim());
    let largestUrl = '';
    let largestWidth = 0;
    for (const part of parts) {
      const [partUrl, descriptor] = part.split(/\s+/);
      const width = parseInt(descriptor?.replace('w', '') || '0');
      if (width > largestWidth) {
        largestWidth = width;
        largestUrl = partUrl;
      }
    }
    if (largestUrl && largestWidth >= 300 && isValidProductImageUrl(largestUrl)) {
      try {
        const imageUrl = new URL(largestUrl, url).toString();
        console.log('🖼️ Found srcset image:', imageUrl);
        return imageUrl;
      } catch {}
    }
  }

  return null;
};

// Check if URL is likely a valid product image
const isValidProductImageUrl = (url: string): boolean => {
  if (!url) return false;
  const lowerUrl = url.toLowerCase();
  
  const blacklist = [
    'icon', 'logo', 'sprite', 'placeholder', 'loading', 'blank',
    'pixel', 'spacer', 'tracking', 'beacon', 'button', 'arrow',
    '1x1', 'transparent', 'badge', 'social', 'share', 'cart',
    'favicon', 'avatar', 'profile', 'user', 'rating', 'star'
  ];
  
  for (const pattern of blacklist) {
    if (lowerUrl.includes(pattern)) return false;
  }
  
  return true;
};

// Find price near "Add to cart" or "Buy now" buttons for proximity detection
const findPriceNearBuyButton = (doc: Document): string | null => {
  const buySelectors = [
    '[class*="add-to-cart"]',
    '[class*="buy-now"]', 
    '[class*="add-to-bag"]',
    '[data-testid*="add-to-cart"]',
    '[data-testid*="buy"]',
    'button[type="submit"]'
  ];

  // Also look for buttons with specific text content
  const buttons = doc.querySelectorAll('button');
  const buyButtons: Element[] = [];
  
  for (const button of buttons) {
    const text = button.textContent?.toLowerCase() || '';
    if (text.includes('add to cart') || text.includes('buy now') || 
        text.includes('add to bag') || text.includes('purchase') ||
        text.includes('add to basket')) {
      buyButtons.push(button);
    }
  }

  // Add selector-matched elements
  for (const selector of buySelectors) {
    const elements = doc.querySelectorAll(selector);
    buyButtons.push(...Array.from(elements));
  }

  for (const button of buyButtons) {
    // Look for price elements within 4 parent levels
    let current = button.parentElement;
    let level = 0;
    
    while (current && level < 4) {
      const priceElements = current.querySelectorAll('[class*="price"], [data-testid*="price"], [class*="cost"]');
      
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
  
  return null;
};

// Enhanced Firecrawl integration with extract mode
const fetchViaFirecrawlExtract = async (url: string): Promise<ParseResult> => {
  try {
    console.log('🎯 Using Firecrawl extract mode for:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout for extract+fallback

    const response = await fetch('https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/firecrawl-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        mode: 'extract',
        schema: PRODUCT_EXTRACTION_SCHEMA,
        prompt: 'Extract product information including name, price, brand, and main image from this product page'
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Firecrawl request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🎯 Firecrawl response:', { success: data.success, hasExtracted: !!data.extracted, hasHtml: !!data.html, hasOgImage: !!data.ogImage });
    
    // Get any available ogImage from the response (works for both extract and scrape responses)
    const responseOgImage = data.ogImage && isValidUrl(data.ogImage) ? normalizeImageUrl(data.ogImage) : undefined;
    console.log('🖼️ Response ogImage available:', responseOgImage);
    
    // Check if we got extracted data
    if (data.success && data.extracted) {
      const extracted = data.extracted;
      
      // Determine image URL - prioritize extracted, fallback to ogImage from metadata
      let finalImageUrl = extracted.imageUrl && isValidUrl(extracted.imageUrl) ? normalizeImageUrl(extracted.imageUrl) : undefined;
      
      // Fallback to ogImage if no extracted image
      if (!finalImageUrl && responseOgImage) {
        console.log('🖼️ No extracted image, using ogImage from metadata:', responseOgImage);
        finalImageUrl = responseOgImage;
      }
      
      const result: ProductInfo = {
        itemName: extracted.itemName?.trim(),
        price: extracted.price ? String(extracted.price).replace(/[^\d.]/g, '') : undefined,
        priceCurrency: extracted.currency || 'USD',
        brand: extracted.brand?.trim(),
        imageUrl: finalImageUrl,
        availability: extracted.availability,
        storeName: getEnhancedStoreName(url)
      };

      // Calculate confidence based on data quality
      let confidence = 0.3;
      if (result.itemName && result.itemName.length > 3) confidence += 0.3;
      if (result.price && !isNaN(parseFloat(result.price))) confidence += 0.2;
      if (result.imageUrl) confidence += 0.1;
      if (result.brand) confidence += 0.1;

      return {
        success: true,
        data: result,
        method: 'firecrawl-extract',
        confidence,
        url,
        canonicalUrl: result.canonicalUrl || url
      };
    }
    
    // Check if we got HTML (fallback from extract to scrape in edge function)
    if (data.html || data.success) {
      console.log('🔄 Got response from scrape mode, parsing...', { hasHtml: !!data.html, hasOgImage: !!responseOgImage });
      
      // If we have HTML, try to parse it
      if (data.html) {
        const parseResult = await parseGenericEnhanced(data.html, url);
        
        // ALWAYS use ogImage as fallback if parsing didn't find an image
        if (!parseResult.data.imageUrl && responseOgImage) {
          console.log('🖼️ Using ogImage from metadata after HTML parsing:', responseOgImage);
          parseResult.data.imageUrl = responseOgImage;
          parseResult.confidence = Math.min(parseResult.confidence + 0.15, 1);
        }
        
        return parseResult;
      }
      
      // No HTML but we might have ogImage - return a basic result with the image
      if (responseOgImage) {
        console.log('🖼️ No HTML but have ogImage, creating basic result');
        return {
          success: true,
          data: {
            storeName: getEnhancedStoreName(url),
            imageUrl: responseOgImage
          },
          method: 'firecrawl-ogimage-only',
          confidence: 0.3,
          url,
          canonicalUrl: url
        };
      }
    }

    throw new Error('No data extracted or scraped');
  } catch (error) {
    console.error('Firecrawl request failed:', error);
    return {
      success: false,
      data: { storeName: getEnhancedStoreName(url) },
      method: 'firecrawl-extract',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      url,
      canonicalUrl: url
    };
  }
};

// Enhanced generic parser with improved fallbacks
const parseGenericEnhanced = async (html: string, url: string): Promise<ParseResult> => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const result: ProductInfo = {
      storeName: getEnhancedStoreName(url)
    };

    // Extract structured data first (JSON-LD)
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
              const imageUrl = typeof imageData === 'string' ? imageData : imageData?.url;
              if (imageUrl && isValidProductImageUrl(imageUrl)) {
                try {
                  result.imageUrl = new URL(imageUrl, url).toString();
                } catch {
                  result.imageUrl = imageUrl;
                }
              }
            }
            break;
          }
        }
      } catch {
        continue;
      }
    }

    // Title extraction
    if (!result.itemName) {
      const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
      if (ogTitle) {
        result.itemName = ogTitle.replace(/\s*[|\-–—]\s*[^|\-–—]*$/, '').trim();
      }
    }

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
      const proximityPrice = findPriceNearBuyButton(doc);
      if (proximityPrice) {
        result.price = proximityPrice;
        result.priceCurrency = 'USD';
      } else {
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
              result.priceCurrency = 'USD';
              break;
            }
          }
        }
      }
    }

    // Use enhanced image extraction if no image found yet
    if (!result.imageUrl) {
      result.imageUrl = extractBestImage(doc, url) || undefined;
    }

    const confidence = (result.itemName ? 0.4 : 0) + (result.price ? 0.3 : 0) + (result.imageUrl ? 0.2 : 0);

    return {
      success: true,
      data: result,
      method: 'enhanced-generic',
      confidence,
      url,
      canonicalUrl: result.canonicalUrl || url,
      raw: result
    };
  } catch (error) {
    return {
      success: false,
      data: { storeName: getEnhancedStoreName(url) },
      method: 'enhanced-generic',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      url,
      canonicalUrl: url
    };
  }
};

// Main smart parser with layered strategy
export const parseProductUrlSmart = async (url: string): Promise<ParseResult> => {
  // Phase 0: URL Expansion for shortened links
  console.log('🔗 Starting URL expansion check for:', url);
  const { expandUrl } = await import('./urlExpander');
  const expandResult = await expandUrl(url);
  
  const finalUrl = expandResult.success ? expandResult.finalUrl : url;
  console.log('🎯 Using final URL for parsing:', finalUrl);
  
  // If URL was expanded, log the redirect chain
  if (expandResult.redirectChain.length > 1) {
    console.log('↪️ Redirect chain:', expandResult.redirectChain);
  }

  const normalizedUrl = normalizeUrl(finalUrl);
  
  // Check cache first (using final URL)
  const cached = cache.get(normalizedUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('✅ Cache hit for:', normalizedUrl);
    return cached.data;
  }

  const siteConfig = getSiteConfig(finalUrl);
  
  try {
    let result: ParseResult;

    // Import content extraction and screenshot fallback
    const { extractContent, detectCurrency } = await import('./contentExtractor');
    const { shouldUseScreenshotFallback, captureScreenshotFallback, createFallbackResult } = await import('./screenshotFallback');

    // Phase 1: Smart routing based on site configuration
    if (siteConfig?.problematic) {
      console.log('🎯 Detected problematic site, using Firecrawl extract mode');
      result = await fetchViaFirecrawlExtract(finalUrl);
      
      // If extract mode fails, fallback to enhanced generic
      if (!result.success || result.confidence < 0.3) {
        console.log('📋 Extract mode failed, trying enhanced parser');
        
        // Try to get HTML via Firecrawl first, then fallback chain
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);

          const response = await fetch('https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/firecrawl-proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: finalUrl }),
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok) {
            const data = await response.json();
            if (data.html) {
              result = await parseGenericEnhanced(data.html, finalUrl);
              
              // If we got ogImage from metadata but no imageUrl from parsing, use it
              if (!result.data.imageUrl && data.ogImage) {
                console.log('🖼️ Using ogImage from Firecrawl metadata:', data.ogImage);
                result.data.imageUrl = normalizeImageUrl(data.ogImage);
                result.confidence = Math.min(result.confidence + 0.15, 1);
              }
            } else {
              throw new Error('No HTML content received');
            }
          } else {
            throw new Error(`Firecrawl failed: ${response.status}`);
          }
        } catch (error) {
          console.log('📋 Firecrawl HTML fetch failed, trying enhanced parser with URL extraction');
          
          // Try enhanced fallback  
          try {
            const { parseProductUrl: enhancedParser } = await import('./enhancedUrlParser');
            const enhancedResult = await enhancedParser(finalUrl);
            
            // If enhanced parser failed to get name, try URL extraction
            if (!enhancedResult.itemName) {
              console.log('🔍 Enhanced parser failed for', finalUrl, ', trying URL extraction');
              enhancedResult.itemName = extractProductNameFromUrl(finalUrl);
              console.log('🔍 URL extraction result for', finalUrl, ':', enhancedResult.itemName);
            }
            
            if (enhancedResult.itemName || enhancedResult.price || enhancedResult.imageUrl) {
              result = {
                success: true,
                data: enhancedResult,
                method: 'enhanced-fallback',
                confidence: 0.4,
                url: finalUrl,
                canonicalUrl: enhancedResult.canonicalUrl || finalUrl,
                raw: enhancedResult
              };
            } else {
              // Simple fallback with URL extraction
              const { parseProductUrl: simpleParser } = await import('./simpleUrlParser');
              const simpleResult = await simpleParser(finalUrl);
              
              if (!simpleResult.itemName) {
                console.log('🔍 Simple parser failed for', finalUrl, ', trying URL extraction');
                simpleResult.itemName = extractProductNameFromUrl(finalUrl);
                console.log('🔍 URL extraction result for', finalUrl, ':', simpleResult.itemName);
              }
              
              result = {
                success: true,
                data: simpleResult,
                method: 'url-extraction-fallback',
                confidence: simpleResult.itemName ? 0.3 : 0.2,
                url: finalUrl,
                canonicalUrl: simpleResult.canonicalUrl || finalUrl,
                raw: simpleResult
              };
            }
          } catch (fallbackError) {
            console.error('All fallbacks failed:', fallbackError);
            
            // Last resort: URL-only extraction with better fallback
            const urlName = extractProductNameFromUrl(finalUrl);
            console.log('🔄 URL extraction result:', urlName);
            
            // Try basic title extraction if URL extraction fails
            let finalName = urlName;
            if (!urlName || urlName === 'Product') {
              console.log('📝 Trying basic title extraction as final fallback');
              try {
                const response = await fetch(finalUrl, {
                  method: 'GET',
                  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
                  signal: AbortSignal.timeout(5000)
                });
                
                if (response.ok) {
                  const html = await response.text();
                  const titleMatch = html.match(/<title[^>]*>([^<]+)</i);
                  if (titleMatch && titleMatch[1]) {
                    const title = titleMatch[1].trim().replace(/\s*[|\-–—]\s*[^|\-–—]*$/, '').trim();
                    if (title.length > 3 && !title.toLowerCase().includes('error')) {
                      finalName = title;
                      console.log('✅ Extracted title as fallback:', title);
                    }
                  }
                }
              } catch (error) {
                console.log('❌ Basic title extraction failed:', error);
              }
            }
            
            result = {
              success: finalName !== 'Product',
              data: {
                itemName: finalName || 'Product',
                storeName: getEnhancedStoreName(finalUrl),
                canonicalUrl: finalUrl
              },
              method: 'url-only',
              confidence: finalName && finalName !== 'Product' ? 0.3 : 0.1,
              url: finalUrl,
              canonicalUrl: finalUrl
            };
          }
        }
      }
    } else {
      // For non-problematic sites, use Firecrawl to ensure we get ogImage from metadata
      console.log('📋 Using Firecrawl scrape for well-behaved site to get ogImage');
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const response = await fetch('https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/firecrawl-proxy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: finalUrl }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📋 Firecrawl scrape response:', { hasHtml: !!data.html, hasOgImage: !!data.ogImage, ogImage: data.ogImage });
          
          if (data.html) {
            result = await parseGenericEnhanced(data.html, finalUrl);
            
            // ALWAYS use ogImage as fallback if no image found in parsing
            if (!result.data.imageUrl && data.ogImage && isValidUrl(data.ogImage)) {
              console.log('🖼️ Using ogImage from Firecrawl metadata for well-behaved site:', data.ogImage);
              result.data.imageUrl = normalizeImageUrl(data.ogImage);
              result.confidence = Math.min(result.confidence + 0.15, 1);
            }
            
            // Even for well-behaved sites, try URL extraction if no name found
            if (!result.data.itemName) {
              result.data.itemName = extractProductNameFromUrl(finalUrl);
            }
          } else {
            throw new Error('No HTML from Firecrawl');
          }
        } else {
          throw new Error('Firecrawl request failed');
        }
      } catch (error) {
        console.log('⚠️ Firecrawl failed for well-behaved site, falling back to enhanced parser:', error);
        const { parseProductUrl: enhancedParser } = await import('./enhancedUrlParser');
        const enhancedResult = await enhancedParser(finalUrl);
        
        // Even for well-behaved sites, try URL extraction if no name found
        if (!enhancedResult.itemName) {
          enhancedResult.itemName = extractProductNameFromUrl(finalUrl);
        }
        
        result = {
          success: true,
          data: enhancedResult,
          method: 'enhanced',
          confidence: 0.7,
          url: finalUrl,
          canonicalUrl: enhancedResult.canonicalUrl || finalUrl,
          raw: enhancedResult
        };
      }
    }

    // Check if we should use screenshot fallback
    if (shouldUseScreenshotFallback([result])) {
      console.log('🖼️ Using screenshot fallback for low-confidence result');
      const screenshotResult = await captureScreenshotFallback(finalUrl);
      
      if (screenshotResult.success) {
        result = await createFallbackResult(finalUrl, result.data, screenshotResult.screenshotUrl);
        if (screenshotResult.title && !result.data.itemName) {
          result.data.itemName = screenshotResult.title;
        }
      }
    }

    // Cache the result
    cache.set(normalizedUrl, { data: result, timestamp: Date.now() });
    
    return result;
  } catch (error) {
    // Try screenshot fallback even on complete failure
    try {
      const { captureScreenshotFallback, createFallbackResult } = await import('./screenshotFallback');
      const screenshotResult = await captureScreenshotFallback(finalUrl);
      
      if (screenshotResult.success) {
        const fallbackResult = await createFallbackResult(finalUrl, { storeName: getEnhancedStoreName(finalUrl) }, screenshotResult.screenshotUrl);
        if (screenshotResult.title) {
          fallbackResult.data.itemName = screenshotResult.title;
        }
        cache.set(normalizedUrl, { data: fallbackResult, timestamp: Date.now() });
        return fallbackResult;
      }
    } catch (screenshotError) {
      console.error('Screenshot fallback also failed:', screenshotError);
    }
    
    const errorResult: ParseResult = {
      success: false,
      data: { storeName: getEnhancedStoreName(finalUrl) },
      method: 'error',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      url: finalUrl,
      canonicalUrl: finalUrl
    };
    
    cache.set(normalizedUrl, { data: errorResult, timestamp: Date.now() });
    return errorResult;
  }
};

// Helper function to validate URLs and normalize http to https
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Helper function to normalize image URLs (convert http to https)
const normalizeImageUrl = (url: string): string => {
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  return url;
};

// Enhanced store name extraction with common retailer mappings
const getEnhancedStoreName = (url: string): string => {
  const storeMap: Record<string, string> = {
    'amazon.com': 'Amazon',
    'target.com': 'Target',
    'walmart.com': 'Walmart',
    'bestbuy.com': 'Best Buy',
    'homedepot.com': 'Home Depot',
    'lowes.com': "Lowe's",
    'shopbop.com': 'Shopbop',
    'nordstrom.com': 'Nordstrom',
    'saksfifthavenue.com': 'Saks Fifth Avenue',
    'anthropologie.com': 'Anthropologie',
    'freepeople.com': 'Free People',
    'lululemon.com': 'Lululemon',
    'nike.com': 'Nike',
    'adidas.com': 'Adidas',
    'zara.com': 'Zara',
    'hm.com': 'H&M'
  };

  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    
    // Check for exact matches first
    for (const [domain, name] of Object.entries(storeMap)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return name;
      }
    }
    
    // Fallback to domain extraction
    const parts = hostname.split('.');
    const domain = parts[parts.length - 2] || hostname;
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Unknown Store';
  }
};

// Enhanced URL-based product name extraction
export const extractProductNameFromUrl = (url: string): string | undefined => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    console.log('🔍 Extracting product name from URL:', pathname);
    console.log('🔍 Full URL:', url);
    
    // Check if this is a shopbop URL for specific handling
    const isShopbop = url.toLowerCase().includes('shopbop.com');
    
    if (isShopbop) {
      console.log('🛍️ SHOPBOP: Processing URL:', pathname);
      
      // Multiple patterns to try for Shopbop URLs
      const shopbopPatterns = [
        // Pattern: /product-name/vp/v=1/1234567890.htm
        /\/([^\/]+)\/vp\/.*$/,
        // Pattern: /v/product-name
        /\/v\/([^\/\?]+)/,
        // Pattern: anything before /vp/
        /\/([^\/]+)\/vp\//,
        // General product pattern
        /\/([a-zA-Z0-9\-_]+)(?:\/|$)/
      ];
      
      for (const pattern of shopbopPatterns) {
        const match = pathname.match(pattern);
        if (match && match[1]) {
          console.log('🛍️ SHOPBOP: Pattern matched:', pattern, 'Raw:', match[1]);
          
          // Skip if it's just "v" or other single letters
          if (match[1].length <= 2 || match[1] === 'v') {
            continue;
          }
          
          const rawName = match[1];
          const productName = rawName
            .replace(/-/g, ' ')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
            .trim();
          
          console.log('🛍️ SHOPBOP: Extracted product name:', productName);
          
          if (productName && productName.length > 2 && isValidProductName(productName)) {
            return productName;
          }
        }
      }
      
      console.log('🛍️ SHOPBOP: No valid pattern match found');
    }
    
    // General e-commerce URL patterns
    const generalPatterns = [
      // /products/product-name or /product/product-name
      /\/products?\/([^\/\?]+)/,
      // /p/product-name
      /\/p\/([^\/\?]+)/,
      // /item/product-name
      /\/item\/([^\/\?]+)/,
      // /dp/product-name (Amazon style)
      /\/dp\/([^\/\?]+)/,
      // Any meaningful last segment (at least 10 chars)
      /\/([^\/\?]{10,})(?:\.html?)?$/
    ];
    
    for (const pattern of generalPatterns) {
      const match = pathname.match(pattern);
      if (match && match[1]) {
        const productName = cleanUrlProductName(match[1]);
        console.log('✅ General pattern matched:', productName);
        if (productName && isValidProductName(productName)) {
          return productName;
        }
      }
    }
    
    // Last resort: try the last meaningful path segment
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      if (lastSegment.length > 5) {
        const productName = cleanUrlProductName(lastSegment);
        console.log('✅ Last segment extraction:', productName);
        if (productName && isValidProductName(productName)) {
          return productName;
        }
      }
    }
    
    console.log('❌ No valid product name found in URL');
  } catch (error) {
    console.error('Error extracting product name from URL:', error);
  }
  
  return undefined;
};

// Helper function to clean and format URL product names
const cleanUrlProductName = (urlSegment: string): string => {
  return urlSegment
    .replace(/[-_+%20]/g, ' ')  // Replace separators with spaces
    .replace(/\.(html?|php|asp)$/i, '') // Remove file extensions
    .replace(/\w\S*/g, (txt) => 
      txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    ) // Title case each word
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
};

// Helper function to validate if extracted text is a real product name
const isValidProductName = (name: string): boolean => {
  if (!name || name.length < 4) return false;
  
  const blacklist = [
    'product', 'item', 'shop', 'category', 'brand', 'collection',
    'products', 'items', 'page', 'index', 'home', 'search',
    'cart', 'checkout', 'account', 'login', 'register'
  ];
  
  const lowerName = name.toLowerCase();
  
  // Check if it's in blacklist
  if (blacklist.includes(lowerName)) return false;
  
  // Check if it's mostly numbers (like product IDs)
  if (/^\d+$/.test(name.replace(/\s/g, ''))) return false;
  
  // Should have at least some letters
  if (!/[a-zA-Z]/.test(name)) return false;
  
  return true;
};

// Basic title extraction as absolute fallback
const tryBasicTitleExtraction = async (url: string): Promise<string | null> => {
  try {
    console.log('🔄 Trying basic title extraction for:', url);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: AbortSignal.timeout(5000)
    });
    
    if (response.ok) {
      const html = await response.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)</i);
      if (titleMatch && titleMatch[1]) {
        const title = titleMatch[1].trim()
          .replace(/\s*[|\-–—]\s*[^|\-–—]*$/, '')
          .trim();
        console.log('✅ Extracted title:', title);
        return title.length > 3 ? title : null;
      }
    }
  } catch (error) {
    console.log('❌ Basic title extraction failed:', error);
  }
  return null;
};

// Legacy compatibility function
export const parseProductUrl = async (url: string): Promise<ProductInfo> => {
  const result = await parseProductUrlSmart(url);
  return result.data;
};