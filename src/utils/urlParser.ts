import { supabase } from '@/integrations/supabase/client';

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

// Performance-optimized cache with TTL
const urlCache = new Map<string, { data: ProductInfo; timestamp: number; hits: number; quality: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

// Calculate data quality score
const calculateQuality = (productInfo: ProductInfo): number => {
  let quality = 0;
  if (productInfo.itemName && productInfo.itemName.length > 5) quality += 40;
  if (productInfo.price && productInfo.price.match(/[\d.,]+/)) quality += 30;
  if (productInfo.imageUrl && isValidImageUrl(productInfo.imageUrl)) quality += 20;
  if (productInfo.storeName) quality += 10;
  return quality;
};

const isValidImageUrl = (url: string): boolean => {
  try {
    new URL(url);
    return /\.(jpg|jpeg|png|webp|gif|svg|avif)($|\?)/i.test(url) || 
           url.includes('images') || url.includes('cdn') || url.includes('static');
  } catch {
    return false;
  }
};

const isValidUrl = (string: string): boolean => {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
};

const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Remove common tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid', 'ref', 'referrer'];
    trackingParams.forEach(param => urlObj.searchParams.delete(param));
    return urlObj.toString();
  } catch {
    return url;
  }
};

const resolveRedirects = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, { 
      method: 'HEAD',
      redirect: 'follow',
      signal: AbortSignal.timeout(5000)
    });
    return response.url;
  } catch {
    return url;
  }
};

const extractStoreName = (hostname: string): string => {
  const cleanHostname = hostname.replace(/^www\./, '');
  
  const storeMap: { [key: string]: string } = {
    'amazon.com': 'Amazon',
    'shopbop.com': 'Shopbop',
    'nordstrom.com': 'Nordstrom',
    'saks.com': 'Saks',
    'saksfifthavenue.com': 'Saks Fifth Avenue',
    'barneys.com': 'Barneys',
    'bergdorfgoodman.com': 'Bergdorf Goodman',
    'neimanmarcus.com': 'Neiman Marcus',
    'ssense.com': 'SSENSE',
    'farfetch.com': 'Farfetch',
    'net-a-porter.com': 'Net-A-Porter',
    'mrporter.com': 'Mr Porter',
    'matchesfashion.com': 'Matches Fashion',
    'revolve.com': 'Revolve',
    'asos.com': 'ASOS',
    'zara.com': 'Zara',
    'hm.com': 'H&M'
  };

  return storeMap[cleanHostname] || cleanHostname.split('.')[0];
};

const extractFromUrlStructure = (url: string, hostname: string): Partial<ProductInfo> => {
  const productInfo: Partial<ProductInfo> = {};
  
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Extract potential product name from URL path
    const pathSegments = pathname.split('/').filter(segment => segment.length > 0);
    
    // Look for product-like segments
    const productSegment = pathSegments.find(segment => 
      segment.length > 3 && 
      !['products', 'product', 'item', 'shop', 'buy', 'p'].includes(segment.toLowerCase())
    );
    
    if (productSegment) {
      productInfo.itemName = decodeURIComponent(productSegment)
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase());
    }
  } catch {
    // URL parsing failed, skip extraction
  }
  
  return productInfo;
};

const extractItemName = (doc: Document): string | undefined => {
  const selectors = [
    'h1[data-automation-id="product-title"]',
    'h1.pdp-product-name',
    'h1[data-testid="product-name"]',
    '.product-title h1',
    '.product-name',
    '.pdp-product-name',
    '[data-testid="product-title"]',
    '[data-automation-id="product-title"]',
    'h1[id*="product"]',
    'h1[class*="product"]',
    'h1[class*="title"]',
    '.product h1',
    '#product-title',
    'h1',
    'title'
  ];

  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element) {
      const text = element.textContent?.trim();
      if (text && text.length > 3 && text.length < 200) {
        return text;
      }
    }
  }

  return undefined;
};

const extractPrice = (doc: Document): string | undefined => {
  const selectors = [
    // Shopbop specific
    '.prices .price-sale',
    '.prices .price',
    '[data-automation-id="product-price"]',
    '.product-prices .price',
    '.price-box .price',
    '.pricing .price',
    // Generic selectors
    '.price-current',
    '.price-now',
    '.product-price',
    '.pdp-price',
    '[data-testid="price"]',
    '.price',
    '[class*="price"]',
    '[id*="price"]',
    '.money',
    '.cost',
    '.amount',
    'span[class*="price"]',
    'div[class*="price"]'
  ];

  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    console.log(`🔍 Price selector ${selector}:`, element ? `Found element with text: "${element.textContent?.trim()}"` : 'No element found');
    if (element) {
      const text = element.textContent?.trim();
      if (text) {
        // More robust price matching
        const priceMatch = text.match(/\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
        if (priceMatch) {
          let price = priceMatch[1];
          // Remove commas for consistency
          price = price.replace(/,/g, '');
          console.log(`💰 Found price: ${price} from selector: ${selector}`);
          return price;
        } else {
          console.log(`💰 Text "${text}" didn't match price pattern`);
        }
      }
    }
  }

  return undefined;
};

const extractImageUrl = (doc: Document, baseUrl: string): string | undefined => {
  const selectors = [
    // Shopbop specific
    '.product-image img',
    '.product-images img',
    '.image-container img',
    '.main-image img',
    // Generic selectors
    'img[data-automation-id="product-image"]',
    '.pdp-image img',
    '[data-testid="product-image"] img',
    '.hero-image img',
    'img[alt*="product"]',
    'img[src*="product"]',
    'img[class*="product"]',
    'img[class*="main"]',
    'img[class*="primary"]',
    '.gallery img:first-child',
    '.images img:first-child',
    'img[data-src]',
    'img[srcset]'
  ];

  for (const selector of selectors) {
    const img = doc.querySelector(selector) as HTMLImageElement;
    console.log(`🔍 Image selector ${selector}:`, img ? `Found img with src: "${img.src || img.getAttribute('data-src') || 'no src'}"` : 'No img found');
    if (img) {
      // Try multiple src attributes
      let imgSrc = img.src || img.getAttribute('data-src') || img.getAttribute('data-original') || img.getAttribute('srcset')?.split(' ')[0];
      
      if (imgSrc) {
        try {
          const url = new URL(imgSrc, baseUrl);
          if (isValidImageUrl(url.toString())) {
            console.log(`🖼️ Found valid image: ${url.toString()} from selector: ${selector}`);
            return url.toString();
          } else {
            console.log(`🖼️ Image ${url.toString()} failed validation`);
          }
        } catch (e) {
          console.log(`🖼️ Failed to create URL from ${imgSrc}:`, e);
          continue;
        }
      }
    }
  }

  return undefined;
};

export const parseProductUrl = async (url: string, options: RobustParsingOptions = {}): Promise<ProductInfo> => {
  const startTime = performance.now();
  
  try {
    console.log('🚀 Advanced parsing URL using Firecrawl:', url);
    
    // Robust URL validation and cleaning
    let cleanUrl = url.trim();
    if (!cleanUrl) {
      throw new Error('Empty URL provided');
    }

    if (!isValidUrl(cleanUrl)) {
      throw new Error(`Invalid URL format: ${cleanUrl}`);
    }

    // Normalize URL and remove tracking
    cleanUrl = normalizeUrl(cleanUrl);
    console.log('🔗 Normalized URL:', cleanUrl);

    // Enhanced cache check
    const cacheKey = cleanUrl;
    const cached = urlCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      cached.hits++;
      if (cached.quality >= 50) {
        console.log('✅ Cache hit! Returning cached result in', performance.now() - startTime, 'ms');
        return cached.data;
      }
    }

    // Fast redirect resolution
    const resolvedUrl = await resolveRedirects(cleanUrl);
    const urlObj = new URL(resolvedUrl);
    const resolvedHostname = urlObj.hostname.toLowerCase();
    
    // Extract store name from hostname
    const storeName = extractStoreName(resolvedHostname);
    
    // Initial product info with URL-based extraction as fallback
    const productInfo: ProductInfo = { 
      storeName,
      ...extractFromUrlStructure(cleanUrl, resolvedHostname)
    };
    
    // Primary method: Use Firecrawl via Supabase Edge Function
    console.log('🧪 Using Firecrawl for advanced parsing');
    try {
      console.log('🔗 Calling firecrawl-proxy with URL:', resolvedUrl);
      const { data, error } = await supabase.functions.invoke('firecrawl-proxy', {
        body: { url: resolvedUrl }
      });
      
      console.log('📡 Firecrawl proxy response:', { hasData: !!data, hasError: !!error, error });
      
      if (error) {
        console.log('❌ Firecrawl error:', error);
        throw new Error(`Firecrawl failed: ${error.message}`);
      }
      
      if (data && data.success !== false) {
        console.log('✅ Firecrawl response received:', data);
        
        // Extract content from various possible response formats
        let html = data.html || data.content || (data.data && data.data[0] && data.data[0].html) || (data.data && data.data[0] && data.data[0].content);
        
        console.log('🔍 HTML extraction attempt:', { 
          hasDirectHtml: !!data.html, 
          hasContent: !!data.content,
          hasDataArray: !!data.data,
          htmlLength: html ? html.length : 0
        });
        
        // Also try markdown content if HTML not available
        if (!html) {
          const markdown = data.markdown || data.md || (data.data && data.data[0] && data.data[0].markdown);
          console.log('🔍 Markdown fallback:', { hasMarkdown: !!markdown, markdownLength: markdown ? markdown.length : 0 });
          if (markdown) {
            // Convert markdown to a basic HTML structure for parsing
            html = `<html><body><div>${markdown}</div></body></html>`;
          }
        }
        
        if (html && typeof html === 'string' && html.length > 100) {
          console.log('🔥 Firecrawl returned HTML, parsing with DOMParser...');
          console.log('📄 HTML length:', html.length);
          console.log('📄 HTML preview:', html.substring(0, 500));
          
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          
          console.log('🔍 Before Firecrawl parsing:', productInfo);
          
          if (!productInfo.itemName) {
            const extractedName = extractItemName(doc);
            console.log('📝 Extracted item name:', extractedName);
            productInfo.itemName = extractedName;
          }
          if (!productInfo.price) {
            const extractedPrice = extractPrice(doc);
            console.log('💰 Extracted price:', extractedPrice);
            productInfo.price = extractedPrice;
          }
          if (!productInfo.imageUrl) {
            const extractedImage = extractImageUrl(doc, resolvedUrl);
            console.log('🖼️ Extracted image:', extractedImage);
            productInfo.imageUrl = extractedImage;
          }
          
          console.log('🔍 After Firecrawl parsing:', productInfo);
          
          console.log('✅ Firecrawl parsing successful:', {
            itemName: !!productInfo.itemName,
            price: !!productInfo.price, 
            imageUrl: !!productInfo.imageUrl,
            storeName: !!productInfo.storeName
          });
        } else {
          console.log('⚠️ Firecrawl returned insufficient content');
          throw new Error('Firecrawl returned insufficient content');
        }
      } else {
        console.log('⚠️ Firecrawl returned unsuccessful response');
        throw new Error('Firecrawl returned unsuccessful response');
      }
    } catch (firecrawlError) {
      console.log('❌ Firecrawl failed, trying fallback methods:', firecrawlError.message);
      
      // Fallback: Try Shopify API if applicable
      if (resolvedHostname.includes('shopify') || resolvedUrl.includes('/products/')) {
        try {
          const productApiUrl = resolvedUrl.replace(/\?.*$/, '') + '.json';
          const apiResponse = await fetch(productApiUrl, { 
            signal: AbortSignal.timeout(5000) 
          });
          if (apiResponse.ok) {
            const productData = await apiResponse.json();
            if (productData.product) {
              if (productData.product.title) productInfo.itemName = productData.product.title;
              if (productData.product.variants?.[0]?.price) {
                productInfo.price = parseFloat(productData.product.variants[0].price).toFixed(2);
              }
              if (productData.product.images?.[0]?.src) productInfo.imageUrl = productData.product.images[0].src;
              console.log('✅ Shopify API fallback successful');
            }
          }
        } catch (apiError) {
          console.log('⚠️ Shopify API fallback failed:', apiError.message);
        }
      }
      
      // Last resort: Try direct fetch (works in native apps)
      if (!productInfo.itemName || !productInfo.price) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          const response = await fetch(resolvedUrl, {
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const html = await response.text();
            if (html && html.length > 100) {
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              
              if (!productInfo.itemName) {
                const itemName = extractItemName(doc);
                if (itemName) productInfo.itemName = itemName;
              }
              if (!productInfo.price) {
                const price = extractPrice(doc);
                if (price) productInfo.price = price;
              }
              if (!productInfo.imageUrl) {
                const imageUrl = extractImageUrl(doc, resolvedUrl);
                if (imageUrl) productInfo.imageUrl = imageUrl;
              }
              console.log('✅ Direct fetch fallback successful');
            }
          }
        } catch (directError) {
          console.log('⚠️ Direct fetch fallback failed:', directError.message);
        }
      }
    }

    // Cache the result for future use
    const quality = calculateQuality(productInfo);
    urlCache.set(cacheKey, {
      data: productInfo,
      timestamp: Date.now(),
      hits: 1,
      quality
    });

    console.log('✅ Final parsing result:', productInfo);
    console.log(`⚡ Total parsing time: ${performance.now() - startTime}ms`);
    return productInfo;

  } catch (error) {
    console.error('❌ URL parsing failed:', error);
    
    // Return basic extraction as last resort
    try {
      const urlObj = new URL(url);
      const storeName = extractStoreName(urlObj.hostname.toLowerCase());
      const fallbackInfo = { 
        storeName,
        ...extractFromUrlStructure(url, urlObj.hostname.toLowerCase())
      };
      console.log('🔄 Returning fallback extraction:', fallbackInfo);
      return fallbackInfo;
    } catch (fallbackError) {
      console.error('❌ Even fallback parsing failed:', fallbackError);
      return {};
    }
  }
};