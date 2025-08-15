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
    // Shopbop specific - more comprehensive
    '.pricing-price',
    '.price-current',
    '.price-display',
    '.product-price .price',
    '.current-price',
    '.sale-price',
    '.price-section .price',
    '.product-pricing .price',
    '[data-testid="price-current"]',
    '[data-testid="current-price"]',
    '.prices .price-sale',
    '.prices .price',
    '[data-automation-id="product-price"]',
    '.product-prices .price',
    '.price-box .price',
    '.pricing .price',
    // Generic selectors
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
    'div[class*="price"]',
    // More aggressive selectors
    '*[class*="price" i]',
    '*[data-testid*="price" i]'
  ];

  console.log('💰 Searching for price with selectors...');
  
  // First, try to find any element containing a dollar sign for debugging
  const allElements = doc.querySelectorAll('*');
  const priceElements = Array.from(allElements).filter(el => 
    el.textContent && el.textContent.includes('$') && el.children.length === 0
  );
  
  console.log(`💰 Found ${priceElements.length} elements containing '$'`);
  priceElements.forEach((el, i) => {
    if (i < 10) { // Log first 10 to avoid spam
      console.log(`💰 Price element ${i}: "${el.textContent?.trim()}" (tag: ${el.tagName}, class: ${el.className || 'no class'})`);
    }
  });

  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    console.log(`🔍 Price selector ${selector}:`, element ? `Found element with text: "${element.textContent?.trim()}"` : 'No element found');
    if (element) {
      const text = element.textContent?.trim();
      if (text) {
        // Enhanced price pattern - handles more formats
        const priceMatch = text.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)|(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:USD|EUR|GBP|CAD|AUD|JPY)/i);
        if (priceMatch) {
          let price = priceMatch[1] || priceMatch[2];
          // Clean up the price
          price = price.replace(/,/g, '');
          
          const priceNum = parseFloat(price);
          if (!isNaN(priceNum) && priceNum > 0 && priceNum < 100000) {
            console.log(`💰 Found valid price: ${priceNum} from text: "${text}"`);
            return priceNum.toFixed(2);
          }
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
    // Shopbop specific - more comprehensive
    '.product-image img',
    '.product-images img',
    '.image-container img',
    '.main-image img',
    '.hero-image img',
    '.gallery-image img',
    '.product-gallery img',
    '[data-testid="product-image"] img',
    '[data-testid="hero-image"] img',
    // Generic selectors
    'img[data-automation-id="product-image"]',
    '.pdp-image img',
    'img[alt*="product" i]',
    'img[src*="product" i]',
    'img[class*="product" i]',
    'img[class*="main" i]',
    'img[class*="primary" i]',
    'img[class*="hero" i]',
    '.gallery img:first-child',
    '.images img:first-child',
    'img[data-src]',
    'img[srcset]',
    // More aggressive selectors
    'picture img',
    'figure img',
    'img[width][height]'
  ];

  console.log('🖼️ Searching for images...');
  
  // First, log all images we can find for debugging
  const allImages = doc.querySelectorAll('img');
  console.log(`🖼️ Found ${allImages.length} total images on page`);
  
  // Log first few images with their attributes
  allImages.forEach((img, i) => {
    if (i < 10) { // Log first 10 to avoid spam
      const imgElement = img as HTMLImageElement;
      console.log(`🖼️ Image ${i}:`, {
        src: imgElement.src || 'no src',
        dataSrc: imgElement.getAttribute('data-src') || 'no data-src',
        alt: imgElement.alt || 'no alt',
        className: imgElement.className || 'no class',
        width: imgElement.width || 'no width',
        height: imgElement.height || 'no height'
      });
    }
  });

  for (const selector of selectors) {
    const img = doc.querySelector(selector) as HTMLImageElement;
    console.log(`🔍 Image selector ${selector}:`, img ? `Found img with src: "${img.src || img.getAttribute('data-src') || 'no src'}"` : 'No img found');
    if (img) {
      // Try multiple src attributes
      let imgSrc = img.src || 
                   img.getAttribute('data-src') || 
                   img.getAttribute('data-original') || 
                   img.getAttribute('data-lazy') ||
                   img.getAttribute('data-image') ||
                   img.getAttribute('srcset')?.split(' ')[0];
      
      console.log(`🖼️ Trying image src: "${imgSrc}" from selector: ${selector}`);
      
      if (imgSrc) {
        try {
          // Handle relative URLs
          const url = imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, baseUrl).toString();
          console.log(`🖼️ Processed URL: ${url}`);
          
          if (isValidImageUrl(url)) {
            console.log(`🖼️ Found valid image: ${url} from selector: ${selector}`);
            return url;
          } else {
            console.log(`🖼️ Image ${url} failed validation`);
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
  console.log('🔥🔥🔥 PARSE PRODUCT URL CALLED WITH:', url);
  console.log('🔥🔥🔥 THIS IS THE URL PARSER STARTING');
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
      console.log('🔍 FULL FIRECRAWL RESPONSE:', JSON.stringify(data, null, 2));
      
      if (error) {
        console.log('❌ Firecrawl error:', error);
        throw new Error(`Firecrawl failed: ${error.message}`);
      }
      
      if (data && data.success !== false) {
        console.log('✅ Firecrawl response received, checking content...');
        console.log('🔍 Data.html exists:', !!data.html);
        console.log('🔍 Data.markdown exists:', !!data.markdown);
        
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