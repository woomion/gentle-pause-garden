
interface ProductInfo {
  itemName?: string;
  storeName?: string;
  price?: string;
  imageUrl?: string;
}

// Performance-optimized cache with TTL and hit tracking
const urlCache = new Map<string, { data: ProductInfo; timestamp: number; hits: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_SIZE = 200;

// Ultra-enhanced proxy services with health monitoring and adaptive routing
const PROXY_SERVICES = [
  { url: 'https://api.allorigins.win/get?url=', timeout: 2000, priority: 1, retries: 3, health: 100 },
  { url: 'https://corsproxy.io/?', timeout: 2500, priority: 2, retries: 3, health: 100 },
  { url: 'https://cors-anywhere.herokuapp.com/', timeout: 3000, priority: 3, retries: 2, health: 100 },
  { url: 'https://thingproxy.freeboard.io/fetch/', timeout: 3000, priority: 4, retries: 2, health: 100 },
  { url: 'https://proxy.cors.sh/', timeout: 2500, priority: 5, retries: 2, health: 100 },
  { url: 'https://crossorigin.me/', timeout: 2500, priority: 6, retries: 2, health: 100 },
  { url: 'https://api.codetabs.com/v1/proxy/?quest=', timeout: 3000, priority: 7, retries: 1, health: 100 },
];

// Health monitoring for proxy services
const updateProxyHealth = (serviceUrl: string, success: boolean) => {
  const service = PROXY_SERVICES.find(s => s.url === serviceUrl);
  if (service) {
    if (success) {
      service.health = Math.min(100, service.health + 5);
    } else {
      service.health = Math.max(0, service.health - 10);
    }
  }
};

// Cache management
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of urlCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      urlCache.delete(key);
    }
  }
  
  // If cache is still too large, remove least used items
  if (urlCache.size > MAX_CACHE_SIZE) {
    const sortedEntries = Array.from(urlCache.entries())
      .sort((a, b) => a[1].hits - b[1].hits);
    const toRemove = sortedEntries.slice(0, urlCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => urlCache.delete(key));
  }
};

export const parseProductUrl = async (url: string): Promise<ProductInfo> => {
  const startTime = performance.now();
  
  try {
    console.log('🚀 Enhanced parsing URL:', url);
    
    // Robust URL validation and cleaning
    let cleanUrl = url.trim();
    if (!cleanUrl) {
      throw new Error('Empty URL provided');
    }

    // Enhanced URL validation
    if (!isValidUrl(cleanUrl)) {
      throw new Error('Invalid URL format');
    }

    // Normalize URL
    cleanUrl = normalizeUrl(cleanUrl);

    // Check cache first
    const cacheKey = cleanUrl;
    const cached = urlCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
      cached.hits++;
      console.log('✅ Cache hit! Returning cached result in', performance.now() - startTime, 'ms');
      return cached.data;
    }

    // Clean expired cache periodically
    if (urlCache.size > 0 && Math.random() < 0.1) {
      cleanExpiredCache();
    }

    // Fast redirect resolution (parallel with URL parsing)
    const [resolvedUrl, urlBasedInfo] = await Promise.all([
      resolveRedirects(cleanUrl),
      Promise.resolve(extractFromUrlStructure(cleanUrl, new URL(cleanUrl).hostname.toLowerCase()))
    ]);

    const urlObj = new URL(resolvedUrl);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Extract store name from hostname
    const storeName = extractStoreName(hostname);
    
    // Initial product info with URL-based extraction
    const productInfo: ProductInfo = { 
      storeName,
      ...urlBasedInfo 
    };
    
    // Fast parallel processing approach
    const extractionPromises = [];
    
    // Add API extraction for Shopify stores (parallel)
    if (hostname.includes('shopify') || resolvedUrl.includes('/products/')) {
      extractionPromises.push(
        (async () => {
          try {
            const productApiUrl = resolvedUrl.replace(/\?.*$/, '') + '.json';
            const apiResponse = await fetch(productApiUrl, { 
              signal: AbortSignal.timeout(3000) 
            });
            if (apiResponse.ok) {
              const productData = await apiResponse.json();
              if (productData.product) {
                return {
                  source: 'shopify-api',
                  itemName: productData.product.title,
                  price: productData.product.variants?.[0]?.price ? 
                    parseFloat(productData.product.variants[0].price).toFixed(2) : undefined,
                  imageUrl: productData.product.images?.[0]?.src
                };
              }
            }
          } catch {
            // API failed, will fallback to scraping
          }
          return null;
        })()
      );
    }

    // Ultra-enhanced parallel proxy fetching with health-aware routing and intelligent fallbacks
    extractionPromises.push(
      (async () => {
        // Sort proxies by health score and priority
        const healthyProxies = PROXY_SERVICES
          .filter(service => service.health > 20)
          .sort((a, b) => (b.health * 100 / b.priority) - (a.health * 100 / a.priority));
        
        const fetchPromises = healthyProxies.map(async (service, index) => {
          let lastError: Error | null = null;
          
          // Enhanced retry logic with exponential backoff and jitter
          for (let attempt = 0; attempt <= service.retries; attempt++) {
            try {
              const proxyUrl = service.url + encodeURIComponent(resolvedUrl);
              
              // Enhanced headers for better success rate
              const headers = {
                'User-Agent': getRandomUserAgent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
              };

              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), service.timeout);
              
              const response = await fetch(proxyUrl, {
                signal: controller.signal,
                headers,
                redirect: 'follow'
              });

              clearTimeout(timeoutId);

              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }

              let htmlContent: string;
              const contentType = response.headers.get('content-type') || '';
              
              // Enhanced content type handling
              if (contentType.includes('application/json')) {
                const data = await response.json();
                htmlContent = data.contents || data.response || data.data || '';
              } else {
                htmlContent = await response.text();
              }

              // Enhanced HTML validation
              if (!htmlContent || htmlContent.length < 100) {
                throw new Error('Empty or invalid content');
              }

              if (!htmlContent.includes('<html') && !htmlContent.includes('<HTML')) {
                throw new Error('Content does not appear to be HTML');
              }

              // Check for error pages
              if (isErrorPage(htmlContent)) {
                throw new Error('Received error page content');
              }

              console.log(`✅ Proxy ${index + 1} success on attempt ${attempt + 1}`);
              updateProxyHealth(service.url, true);
              return { 
                htmlContent, 
                service: service.url, 
                priority: service.priority, 
                attempt,
                responseTime: performance.now() - startTime
              };
              
            } catch (error) {
              lastError = error as Error;
              console.log(`⚠️ Proxy ${index + 1} attempt ${attempt + 1} failed:`, error.message);
              
              // Enhanced wait before retry (exponential backoff with jitter)
              if (attempt < service.retries) {
                const baseDelay = Math.pow(2, attempt) * 300;
                const jitter = Math.random() * 200; // Add randomness to prevent thundering herd
                await new Promise(resolve => setTimeout(resolve, baseDelay + jitter));
              }
            }
          }
          
          updateProxyHealth(service.url, false);
          throw new Error(`Proxy ${index + 1} exhausted all retries: ${lastError?.message}`);
        });

        // Ultra-enhanced response handling with intelligent timeout and fallback cascade
        try {
          // Adaptive timeout based on proxy health
          const avgHealth = healthyProxies.reduce((sum, p) => sum + p.health, 0) / healthyProxies.length;
          const adaptiveTimeout = avgHealth > 70 ? 8000 : 12000;
          
          // Race between proxies with adaptive timeout
          const racePromise = Promise.race(fetchPromises);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('All proxies timed out')), adaptiveTimeout)
          );
          
          const result = await Promise.race([racePromise, timeoutPromise]) as any;
          console.log(`✅ Enhanced fetch success via ${result.service} in ${performance.now() - startTime}ms (attempt ${result.attempt + 1})`);
          
          // Parse HTML and extract all data in parallel
          const parser = new DOMParser();
          const doc = parser.parseFromString(result.htmlContent, 'text/html');
          
           const [itemName, price, imageUrl] = await Promise.all([
            Promise.resolve(extractItemName(doc)),
            Promise.resolve(extractPrice(doc)),
            Promise.resolve(extractImageUrl(doc, resolvedUrl))
          ]);

          return {
            source: 'scraping',
            itemName,
            price,
            imageUrl
          };
        } catch (error) {
          console.log('All proxy services failed:', error);
          return null;
        }
      })()
    );

    // Wait for any successful extraction method
    try {
      const results = await Promise.allSettled(extractionPromises);
      const successfulResults = results
        .filter(result => result.status === 'fulfilled' && result.value)
        .map(result => (result as PromiseFulfilledResult<any>).value);

      // Merge results, prioritizing API data over scraped data
      for (const result of successfulResults) {
        if (result.itemName && !productInfo.itemName) {
          productInfo.itemName = result.itemName;
        }
        if (result.price && !productInfo.price) {
          productInfo.price = result.price;
        }
        if (result.imageUrl && !productInfo.imageUrl) {
          productInfo.imageUrl = result.imageUrl;
        }
      }

      console.log(`⚡ Total parsing time: ${performance.now() - startTime}ms`);
    } catch (error) {
      console.log('Extraction failed, using URL-based data only:', error);
    }

    // Cache the result
    urlCache.set(cacheKey, {
      data: productInfo,
      timestamp: Date.now(),
      hits: 1
    });

    return productInfo;
  } catch (error) {
    console.error('Enhanced parser error:', error);
    
    // Return partial data on error with store name at minimum
    try {
      const urlObj = new URL(url);
      return { 
        storeName: extractStoreName(urlObj.hostname.toLowerCase()),
        itemName: extractFromUrlStructure(url, urlObj.hostname.toLowerCase()).itemName
      };
    } catch {
      return {};
    }
  }
};

// Helper functions for robust URL parsing
const isValidUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Remove tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 
                           'ref', 'referrer', 'source', 'campaign', 'gclid', 'fbclid'];
    trackingParams.forEach(param => urlObj.searchParams.delete(param));
    return urlObj.toString();
  } catch {
    return url;
  }
};

const getRandomUserAgent = (): string => {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/121.0.0.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0'
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

const isErrorPage = (htmlContent: string): boolean => {
  const errorIndicators = [
    'access denied', 'forbidden', 'not found', '404', '403', '500', '502', '503',
    'cloudflare', 'rate limit', 'blocked', 'captcha', 'robot', 'challenge',
    'temporarily unavailable', 'maintenance', 'error', 'problem', 'issue',
    'security check', 'verification required', 'please try again',
    'suspicious activity', 'too many requests', 'quota exceeded'
  ];
  const lowerContent = htmlContent.toLowerCase();
  return errorIndicators.some(indicator => lowerContent.includes(indicator));
};

// Enhanced redirect resolution with multiple fallback services and aggressive timeout
const resolveRedirects = async (url: string): Promise<string> => {
  const shortUrlPatterns = [
    'amzn.to', 'amazon.com/dp', 'amazon.com/gp', 'a.co', 'amzn.com',
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'short.link',
    'rb.gy', 'is.gd', 'v.gd', 'rebrand.ly', 'tiny.cc', 'cutt.ly',
    'shorturl.at', 'sl.uy', 'clck.ru', 'buff.ly', 'ift.tt',
    'lnkd.in', 'youtu.be', 'fb.me', 'ig.me', 'tr.im', 'dlvr.it',
    'su.pr', 'shar.es', 'politi.co', 'bzfd.it', 'nyti.ms',
    'wapo.st', 'wsjsoc.com', 'reut.rs', 'cnn.it', 'bbc.in',
    'trib.al', 'huff.to', 'bloom.bg', 'on.mktw.net', 'yhoo.it'
  ];

  try {
    const urlObj = new URL(url);
    const isShortUrl = shortUrlPatterns.some(pattern => 
      urlObj.hostname.includes(pattern) || url.includes(pattern)
    );

    if (!isShortUrl) {
      return url;
    }

    console.log('Resolving redirect for short URL:', url);

    // Enhanced redirect resolution services with improved timeout handling
    const redirectServices = [
      // Direct HEAD request (fastest, most reliable)
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        try {
          const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'follow',
            signal: controller.signal,
            headers: { 'User-Agent': getRandomUserAgent() }
          });
          clearTimeout(timeoutId);
          return response.url;
        } finally {
          clearTimeout(timeoutId);
        }
      },
      
      // Unshorten.me service
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        try {
          const response = await fetch(`https://unshorten.me/json/${encodeURIComponent(url)}`, {
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          const data = await response.json();
          return data.resolved_url || data.url;
        } finally {
          clearTimeout(timeoutId);
        }
      },
      
      // Manual redirect following
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        
        try {
          const response = await fetch(url, {
            method: 'GET',
            redirect: 'manual',
            signal: controller.signal,
            headers: { 'User-Agent': getRandomUserAgent() }
          });
          clearTimeout(timeoutId);
          
          if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');
            if (location) {
              return location.startsWith('http') ? location : new URL(location, url).href;
            }
          }
          return response.url;
        } finally {
          clearTimeout(timeoutId);
        }
      }
    ];

    // Enhanced service trying with race condition
    try {
      const racePromise = Promise.race(
        redirectServices.map(async (service, index) => {
          try {
            const result = await service();
            console.log(`Redirect service ${index + 1} succeeded:`, result);
            return result;
          } catch (error) {
            console.log(`Redirect service ${index + 1} failed:`, error.message);
            throw error;
          }
        })
      );
      
      const timeoutPromise = new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('All redirect services timed out')), 8000)
      );
      
      const resolvedUrl = await Promise.race([racePromise, timeoutPromise]);
      
      if (resolvedUrl && resolvedUrl !== url && resolvedUrl.length >= url.length) {
        console.log('Successfully resolved redirect:', resolvedUrl);
        return resolvedUrl;
      }
    } catch (error) {
      console.log('All redirect services failed:', error.message);
    }
    
    return url;
  } catch (error) {
    console.warn('Could not resolve redirect for:', url, error);
    return url;
  }
};

const extractFromUrlStructure = (url: string, hostname: string): Partial<ProductInfo> => {
  const info: Partial<ProductInfo> = {};
  
  // Amazon specific URL parsing (enhanced for different Amazon URL formats)
  if (hostname.includes('amazon')) {
    // Standard Amazon product URLs
    let match = url.match(/\/([^\/]+)\/dp\/([A-Z0-9]{10})/);
    if (!match) {
      // Alternative Amazon URLs like /gp/product/
      match = url.match(/\/gp\/product\/([A-Z0-9]{10})/);
      if (match) {
        // For /gp/product/ URLs, we don't have the title in the URL
        info.itemName = 'Amazon Product';
      }
    }
    if (!match) {
      // Amazon short URLs or other formats
      match = url.match(/\/([A-Z0-9]{10})/);
    }
    
    if (match && match[1] && match[1].length > 5) {
      if (!info.itemName) {
        const titlePart = match[1];
        // Convert URL-encoded title to readable format
        const decodedTitle = decodeURIComponent(titlePart.replace(/-/g, ' '));
        info.itemName = decodedTitle.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
      }
    }
  }
  
  // ThriftBooks specific URL parsing
  if (hostname.includes('thriftbooks')) {
    const patterns = [
      /\/share\/([^\/\?#]+)/i,
      /\/([^\/\?#]+)\/[\d\-]+/i,
      /\/([^\/\?#]+)\//i
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const titlePart = decodeURIComponent(match[1]);
        const readableTitle = titlePart
          .replace(/[-_]/g, ' ')
          .replace(/\+/g, ' ')
          .replace(/\s+/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
          .trim();
        
        if (readableTitle.length > 3) {
          info.itemName = readableTitle;
          console.log('Extracted ThriftBooks product name from URL:', readableTitle);
          break;
        }
      }
    }
  }
  
  // eBay specific URL parsing (enhanced)
  if (hostname.includes('ebay')) {
    const patterns = [
      /\/itm\/([^\/\?#]+)/,
      /\/p\/([^\/\?#]+)/,
      /\/([^\/\?#]+)\/\d+/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const titlePart = match[1];
        const decodedTitle = decodeURIComponent(titlePart.replace(/-/g, ' '));
        info.itemName = decodedTitle.split(' ').slice(0, 10).join(' '); // Limit length
        console.log('Extracted eBay product name from URL:', info.itemName);
        break;
      }
    }
  }
  
  // Shopify store URL parsing (enhanced)
  if (url.includes('/products/') || hostname.includes('shopify')) {
    const match = url.match(/\/products\/([^\/\?#]+)/);
    if (match) {
      const productSlug = decodeURIComponent(match[1]);
      // Convert slug to readable title
      const readableTitle = productSlug
        .replace(/[-_]/g, ' ')
        .replace(/\+/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      info.itemName = readableTitle;
      console.log('Extracted Shopify product name from URL:', readableTitle);
    }
  }
  
  // Etsy specific URL parsing (enhanced)
  if (hostname.includes('etsy')) {
    const match = url.match(/\/listing\/\d+\/([^\/\?#]+)/);
    if (match) {
      const titlePart = decodeURIComponent(match[1]);
      const readableTitle = titlePart
        .replace(/[-_]/g, ' ')
        .replace(/\+/g, ' ')
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .trim();
      info.itemName = readableTitle;
      console.log('Extracted Etsy product name from URL:', readableTitle);
    }
  }
  
  // Barnes & Noble specific URL parsing
  if (hostname.includes('barnesandnoble') || hostname.includes('bn.com')) {
    const match = url.match(/\/w\/([^\/\?#]+)/);
    if (match) {
      const titlePart = decodeURIComponent(match[1]);
      const readableTitle = titlePart
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      info.itemName = readableTitle;
      console.log('Extracted Barnes & Noble product name from URL:', readableTitle);
    }
  }
  
  // Generic product URL parsing for other e-commerce sites (enhanced)
  if (!info.itemName) {
    // Extended patterns for various e-commerce sites
    const patterns = [
      /\/product\/([^\/\?#]+)/i,
      /\/products\/([^\/\?#]+)/i,
      /\/item\/([^\/\?#]+)/i,
      /\/items\/([^\/\?#]+)/i,
      /\/p\/([^\/\?#]+)/i,
      /\/shop\/([^\/\?#]+)/i,
      /\/book\/([^\/\?#]+)/i,
      /\/books\/([^\/\?#]+)/i,
      /\/catalog\/([^\/\?#]+)/i,
      /\/store\/([^\/\?#]+)/i,
      /\/buy\/([^\/\?#]+)/i,
      /\/detail\/([^\/\?#]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const productSlug = decodeURIComponent(match[1]);
        const readableTitle = productSlug
          .replace(/[-_]/g, ' ')
          .replace(/\+/g, ' ')
          .replace(/\s+/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
          .trim()
          .substring(0, 100); // Limit length
        
        if (readableTitle.length > 3) {
          info.itemName = readableTitle;
          console.log('Extracted product name from generic URL pattern:', readableTitle);
          break;
        }
      }
    }
  }
  
  return info;
};

const extractStoreName = (hostname: string): string => {
  // Remove www. and common TLD extensions
  let storeName = hostname.replace(/^www\./, '');
  
  // Enhanced store mappings with book retailers and more sites
  const storeMap: { [key: string]: string } = {
    // Amazon variants
    'amazon.com': 'Amazon',
    'amazon.co.uk': 'Amazon UK',
    'amazon.ca': 'Amazon Canada',
    'amazon.de': 'Amazon Germany',
    'amazon.fr': 'Amazon France',
    'amazon.it': 'Amazon Italy',
    'amazon.es': 'Amazon Spain',
    'amazon.in': 'Amazon India',
    'amazon.co.jp': 'Amazon Japan',
    'amazon.com.au': 'Amazon Australia',
    'amazon.com.br': 'Amazon Brazil',
    
    // eBay variants
    'ebay.com': 'eBay',
    'ebay.co.uk': 'eBay UK',
    'ebay.de': 'eBay Germany',
    'ebay.fr': 'eBay France',
    'ebay.it': 'eBay Italy',
    'ebay.es': 'eBay Spain',
    'ebay.ca': 'eBay Canada',
    'ebay.com.au': 'eBay Australia',
    
    // Book retailers
    'thriftbooks.com': 'ThriftBooks',
    'barnesandnoble.com': 'Barnes & Noble',
    'bn.com': 'Barnes & Noble',
    'bookdepository.com': 'Book Depository',
    'abebooks.com': 'AbeBooks',
    'alibris.com': 'Alibris',
    'powells.com': 'Powell\'s Books',
    'betterworldbooks.com': 'Better World Books',
    'booksamillion.com': 'Books-A-Million',
    'chapters.indigo.ca': 'Chapters Indigo',
    'waterstones.com': 'Waterstones',
    'whsmith.co.uk': 'WHSmith',
    'scholastic.com': 'Scholastic',
    
    // Major retailers
    'etsy.com': 'Etsy',
    'target.com': 'Target',
    'walmart.com': 'Walmart',
    'bestbuy.com': 'Best Buy',
    'macys.com': "Macy's",
    'nordstrom.com': 'Nordstrom',
    'zappos.com': 'Zappos',
    'wayfair.com': 'Wayfair',
    'overstock.com': 'Overstock',
    'homedepot.com': 'Home Depot',
    'lowes.com': "Lowe's",
    'costco.com': 'Costco',
    'samsclub.com': "Sam's Club",
    'sephora.com': 'Sephora',
    'ulta.com': 'Ulta Beauty',
    
    // Fashion & apparel
    'nike.com': 'Nike',
    'adidas.com': 'Adidas',
    'zara.com': 'Zara',
    'hm.com': 'H&M',
    'uniqlo.com': 'Uniqlo',
    'gap.com': 'Gap',
    'oldnavy.com': 'Old Navy',
    'forever21.com': 'Forever 21',
    'urbanoutfitters.com': 'Urban Outfitters',
    'anthropologie.com': 'Anthropologie',
    'freepeople.com': 'Free People',
    'victoriassecret.com': "Victoria's Secret",
    
    // Home & furniture
    'williams-sonoma.com': 'Williams Sonoma',
    'crateandbarrel.com': 'Crate & Barrel',
    'cb2.com': 'CB2',
    'westelm.com': 'West Elm',
    'potterybarn.com': 'Pottery Barn',
    'ikea.com': 'IKEA',
    'roomandboard.com': 'Room & Board',
    'restorationhardware.com': 'Restoration Hardware',
    
    // E-commerce platforms
    'shopify.com': 'Shopify Store',
    'bigcommerce.com': 'BigCommerce Store',
    'squarespace.com': 'Squarespace Store',
    'wix.com': 'Wix Store',
    'myshopify.com': 'Shopify Store',
    
    // Marketplaces
    'poshmark.com': 'Poshmark',
    'mercari.com': 'Mercari',
    'depop.com': 'Depop',
    'thredup.com': 'ThredUp',
    'realreal.com': 'The RealReal',
    'vestiairecollective.com': 'Vestiaire Collective',
    'rebag.com': 'Rebag',
    'fashionphile.com': 'Fashionphile',
    
    // Electronics & tech
    'newegg.com': 'Newegg',
    'bhphotovideo.com': 'B&H Photo',
    'adorama.com': 'Adorama',
    'microcenter.com': 'Micro Center',
    'apple.com': 'Apple',
    'microsoft.com': 'Microsoft',
    'dell.com': 'Dell',
    'hp.com': 'HP',
    'lenovo.com': 'Lenovo',
    'asus.com': 'ASUS',
    'samsung.com': 'Samsung',
    
    // Specialty stores
    'chewy.com': 'Chewy',
    'petco.com': 'Petco',
    'petsmart.com': 'PetSmart',
    'rei.com': 'REI',
    'dickssportinggoods.com': "Dick's Sporting Goods",
    'academy.com': 'Academy Sports',
    'backcountry.com': 'Backcountry',
    'moosejaw.com': 'Moosejaw',
    'patagonia.com': 'Patagonia',
    
    // International retailers
    'smallable.com': 'Smallable',
    'smallable.fr': 'Smallable France',
    'smallable.co.uk': 'Smallable UK',
    'zalando.com': 'Zalando',
    'zalando.de': 'Zalando Germany',
    'zalando.fr': 'Zalando France',
    'fnac.com': 'Fnac',
    'cdiscount.com': 'Cdiscount',
    'rakuten.com': 'Rakuten',
    'alibaba.com': 'Alibaba',
    'aliexpress.com': 'AliExpress',
    'jd.com': 'JD.com',
    'tmall.com': 'Tmall',
    
    // Luxury & designer
    'net-a-porter.com': 'Net-A-Porter',
    'mr-porter.com': 'Mr Porter',
    'ssense.com': 'SSENSE',
    'farfetch.com': 'Farfetch',
    'yoox.com': 'YOOX',
    'theoutnet.com': 'THE OUTNET',
    
    // Health & beauty
    'dermstore.com': 'Dermstore',
    'lookfantastic.com': 'LookFantastic',
    'spacenk.com': 'Space NK',
    'cultbeauty.com': 'Cult Beauty'
  };
  
  for (const [domain, name] of Object.entries(storeMap)) {
    if (hostname.includes(domain)) {
      return name;
    }
  }
  
  // Enhanced fallback: handle comprehensive TLD extensions
  storeName = storeName.replace(/\.(com|co\.uk|ca|org|net|de|fr|shop|store|io|ly|me|us|biz|info|it|es|be|nl|ch|au|jp|br|mx|in|ru|cn|kr|pl|se|no|dk|fi|at|pt|gr|cz|hu|ro|bg|hr|sk|si|lv|lt|ee|mt|cy|lu|ie|is)$/, '');
  
  // Handle special cases like hyphenated names
  if (storeName.includes('-')) {
    return storeName.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  return storeName.charAt(0).toUpperCase() + storeName.slice(1);
};

const extractItemName = (doc: Document): string | undefined => {
  // Enhanced selectors for product titles with better store coverage
  const selectors = [
    // Meta tags (highest priority)
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'meta[property="product:title"]',
    'meta[name="title"]',
    'meta[property="book:title"]', // For book sites
    
    // Store-specific selectors (enhanced)
    '#productTitle', // Amazon
    '.x-item-title-label', // eBay
    '.x-item-title', // eBay alternative
    '[data-automation-id="product-title"]', // Target
    '[data-testid="product-title"]',
    'h1[data-test-id="listing-page-title"]', // Etsy
    '[data-testid="listing-page-title"]', // Etsy alternative
    '.listing-page-title h1', // Etsy fallback
    '.shop2-listing-page-title', // Etsy legacy
    
    // ThriftBooks specific
    '.AllEditionsItem-title', // ThriftBooks
    '.work-title', // ThriftBooks
    '.book-title', // ThriftBooks
    'h1.title', // ThriftBooks
    '.product-title h1', // ThriftBooks product page
    
    // Barnes & Noble specific
    '.pdp-product-name', // B&N
    '.product-info-title', // B&N
    'h1[data-ux="ProductName"]', // B&N
    
    // Book retailer patterns
    '.book-title',
    '.title-main',
    '.work-title',
    '.book-name',
    '.item-title',
    
    // Shopify patterns (enhanced)
    '.product-single__title',
    '.product__title',
    '.product-title',
    '.product_title',
    '.product-meta__title',
    '[class*="product-title"]',
    '[class*="ProductTitle"]',
    
    // Generic e-commerce patterns
    '.product-title',
    '#product-title',
    '.pdp-product-name',
    '.product-name',
    '.item-title',
    '.listing-page-title',
    '.product-details-product-title',
    '.product-main-title',
    '.main-product-title',
    '[class*="product-title"]',
    '[class*="item-title"]',
    '[class*="listing-page-title"]',
    '[class*="ProductName"]',
    '[class*="product-name"]',
    '[data-product-title]',
    '[data-title]',
    
    // Generic headings (improved priority)
    'h1[class*="title"]',
    'h1[class*="product"]',
    'h1[class*="name"]',
    'h1[class*="book"]',
    '.page-title h1',
    '.content-title h1',
    'main h1',
    'article h1',
    '.container h1',
    'h1'
  ];
  
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element) {
      const content = element.getAttribute('content') || element.textContent;
      if (content && content.trim() && content.length > 3 && content.length < 300) {
        // Enhanced title cleaning
        let cleanTitle = content.trim()
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/^\||\|$/g, '') // Remove leading/trailing pipes
          .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
          .replace(/^:+|:+$/g, '') // Remove leading/trailing colons
          .trim();
        
        // Skip if it's too generic
        const genericWords = ['untitled', 'product', 'item', 'page', 'home', 'shop', 'store'];
        if (!genericWords.some(word => cleanTitle.toLowerCase() === word)) {
          return cleanTitle.substring(0, 150);
        }
      }
    }
  }
  
  // Enhanced title tag fallback
  const title = doc.title;
  if (title && title.length > 3) {
    // Enhanced cleaning for title tag with more store patterns
    const cleanTitle = title
      .replace(/ - (Amazon\.com|Amazon|eBay|Target|Walmart|Best Buy|Barnes & Noble|ThriftBooks|Etsy|Shop|Store|Buy Online|Free Shipping).*$/i, '')
      .replace(/ \| (Amazon|eBay|Target|Walmart|Best Buy|Barnes & Noble|ThriftBooks|Etsy|Shop|Store).*$/i, '')
      .replace(/ :: .*$/i, '') // Remove everything after double colon
      .replace(/ - Buy .*$/i, '') // Remove "Buy" suffixes
      .replace(/ - Shop .*$/i, '') // Remove "Shop" suffixes
      .replace(/ \(.*\)$/i, '') // Remove parenthetical info at end
      .trim();
    
    if (cleanTitle.length > 3) {
      return cleanTitle.substring(0, 150);
    }
  }
  
  return undefined;
};

// Helper function to extract price from text
const extractPriceFromText = (text: string): string | undefined => {
  const pricePatterns = [
    /[\$£€¥]\s*(\d{1,3}(?:[,.\s]\d{3})*(?:[.,]\d{2})?)/gi,
    /(\d{1,3}(?:[,.\s]\d{3})*(?:[.,]\d{2})?)\s*[\$£€¥]/gi,
    /\b(\d{1,4}[.,]\d{2})\b/g,
    /(\d{1,3}(?:\.\d{3})*,\d{2})/g
  ];
  
  for (const pattern of pricePatterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const rawPrice = match[1] || match[0];
      let price = rawPrice.replace(/\s/g, '');
      
      if (price.includes(',') && price.includes('.')) {
        price = price.replace(/\./g, '').replace(',', '.');
      } else if (price.includes(',') && !price.includes('.')) {
        const commaIndex = price.lastIndexOf(',');
        const afterComma = price.substring(commaIndex + 1);
        if (afterComma.length === 2) {
          price = price.replace(',', '.');
        }
      }
      
      price = price.replace(/,/g, '');
      const numPrice = parseFloat(price);
      
      if (!isNaN(numPrice) && numPrice >= 0.01 && numPrice <= 99999) {
        return numPrice.toFixed(2);
      }
    }
  }
  return undefined;
};

const extractPrice = (doc: Document): string | undefined => {
  console.log('🔍 Starting price extraction from DOM...');
  console.log('📄 Page title:', doc.title);
  console.log('📄 URL:', doc.location?.href || 'unknown');
  
  // First, let's see what price-like content exists on the page
  const allText = doc.body?.textContent || '';
  console.log('📄 Full page text length:', allText.length);
  
  // Look for French/European price patterns specifically
  const frenchPriceMatches = allText.match(/\d{1,4}[.,]\d{2}\s*€|€\s*\d{1,4}[.,]\d{2}/g);
  const generalPriceMatches = allText.match(/[\$£€¥]\s*[\d,]+\.?\d{0,2}|\b\d{1,4}[.,]\d{2}\b/g);
  console.log('💰 Found French/European prices:', frenchPriceMatches?.slice(0, 10));
  console.log('💰 Found general prices:', generalPriceMatches?.slice(0, 10));
  
  // Log some HTML structure for debugging
  const priceElements = doc.querySelectorAll('[class*="price"], [class*="Prix"], [data-testid*="price"]');
  console.log('💰 Found price-related elements:', priceElements.length);
  priceElements.forEach((el, i) => {
    if (i < 5) {
      console.log(`💰 Price element ${i}:`, el.className, el.textContent?.trim());
    }
  });
  
  // Check if this is Smallable (any country) and extract directly from their structure
  const currentUrl = doc.location?.href || '';
  const isSmallable = /smallable\.(com|fr|co\.uk|de|es|it|be|nl|ch)/i.test(currentUrl);
  
  console.log('🔍 URL being parsed:', currentUrl);
  console.log('🎯 Is Smallable?', isSmallable);
  
  if (isSmallable) {
    console.log('🎯 Detected Smallable - using specific extraction for', currentUrl);
    
    // Log page structure for debugging
    const allPriceElements = doc.querySelectorAll('[class*="price"], [class*="Price"], [data-testid*="price"], [id*="price"]');
    console.log('💰 All price-related elements found:', allPriceElements.length);
    
    // More comprehensive Smallable price selectors
    const smallablePriceSelectors = [
      // Current price selectors
      '.product-price-value',
      '.product__price',
      '.price-current',
      '.price__current',
      '.current-price',
      '.ProductPrice-current',
      '.Price-current',
      '.formatted-price',
      '[data-testid="current-price"]',
      '[data-testid="price"]',
      '.price-value',
      '.current-price-value',
      '.price',
      '.price-amount',
      '.product-price',
      '.sell-price',
      '.final-price',
      // Meta tags
      'meta[property="product:price:amount"]',
      'meta[property="og:price:amount"]',
      'meta[name="price"]',
      // Generic patterns
      '[class*="price"]:not([class*="was"]):not([class*="original"])',
      '[data-price]'
    ];
    
    for (const selector of smallablePriceSelectors) {
      const elements = doc.querySelectorAll(selector);
      console.log(`💰 Checking "${selector}": found ${elements.length} elements`);
      
      for (const element of elements) {
        let priceText = '';
        
        if (element.tagName === 'META') {
          priceText = element.getAttribute('content') || '';
        } else {
          priceText = element.textContent?.trim() || '';
        }
        
        console.log(`💰 Element text:`, priceText);
        
        if (priceText) {
          const price = extractPriceFromText(priceText);
          if (price) {
            console.log('✅ Smallable price extracted successfully:', price);
            return price;
          }
        }
      }
    }
    
    // Fallback: search entire page text for European price patterns
    const pageText = doc.body?.textContent || '';
    const europeanPrices = pageText.match(/\d{1,4}[.,]\d{2}\s*€|€\s*\d{1,4}[.,]\d{2}|\d{1,4}[.,]\d{2}\s*EUR/g);
    console.log('💰 European prices found in page text:', europeanPrices?.slice(0, 5));
    
    if (europeanPrices && europeanPrices.length > 0) {
      for (const priceMatch of europeanPrices) {
        const price = extractPriceFromText(priceMatch);
        if (price) {
          console.log('✅ Smallable price from page text:', price);
          return price;
        }
      }
    }
  }

  // Enhanced selectors for price with better store coverage
  const selectors = [
    // Meta tags (most reliable)
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    'meta[property="product:price"]',
    'meta[name="price"]',
    
    // ThriftBooks specific selectors (high priority)
    '.SearchResultListItem-price', // ThriftBooks search results
    '.AllEditionsItem-price', // ThriftBooks book page
    '.work-price', // ThriftBooks
    '.price-value', // ThriftBooks
    '.item-price', // ThriftBooks
    '.book-price', // ThriftBooks
    '.condition-price', // ThriftBooks by condition
    '.product-price .price', // ThriftBooks product page
    '[data-testid="price"]', // ThriftBooks modern
    '.price-current', // ThriftBooks current price
    
    // Barnes & Noble specific
    '.price-display', // B&N
    '.price-main', // B&N
    '.current-price-value', // B&N
    '.pdp-price .price', // B&N
    
    // Shopify-specific selectors (high priority for Shopify stores)
    '.price--highlight .price-item--regular',
    '.price--highlight .price-item--sale',
    '.price .price-item--regular',
    '.price .price-item',
    '.price__regular .price-item',
    '.price__sale .price-item',
    '.product-form__cart-submit [data-price]',
    '[data-product-price]',
    '.product__price .price',
    '.product-price-value',
    
    // Etsy-specific price selectors
    '[data-testid="price-current"]', // Etsy current
    '.currency-value', // Etsy price
    '.shop2-listing-price .currency-value', // Etsy legacy
    '.listing-page-page .currency-value', // Etsy alternative
    'p.wt-text-title-03', // Etsy price text
    '[class*="listing-page-price"]', // Etsy generic
    
    // Amazon selectors
    '.a-price-whole', // Amazon whole price
    '.a-price .a-offscreen', // Amazon full price
    '#priceblock_dealprice', // Amazon deal price
    '#priceblock_saleprice', // Amazon sale price
    '#price_inside_buybox', // Amazon buybox price
    '.a-price-range', // Amazon price range
    
    // eBay selectors
    '.notranslate', // eBay price
    '.u-flL.condText', // eBay price
    '.price-current .price', // eBay current
    
    // Store-specific selectors
    '.display-price', // Best Buy
    '[data-automation-id="product-price"]', // Target
    '[data-testid="price"]',
    '.price-current',
    '.current-price',
    '.sale-price',
    '.regular-price',
    '.price-now',
    '.final-price',
    '.product-price',
    '.price-value',
    '.price-amount',
    
    // Smallable-specific selectors (French retailer)
    '.ProductPrice-current', // Smallable
    '.Price-current', // Smallable
    '.price__current', // Smallable
    '.formatted-price', // Smallable
    '.price-item', // Smallable
    '.actual-price', // Smallable
    '.product-price .price', // Smallable
    '.sell-price', // Smallable
    '.current-price-value', // Smallable
    '.price-display span', // Smallable
    '.price-wrapper .price', // Smallable
    
    // Generic price selectors
    '[class*="price"]:not([class*="original"]):not([class*="was"]):not([class*="msrp"]):not([class*="list"])',
    '[class*="Price"]:not([class*="Original"]):not([class*="Was"]):not([class*="List"])',
    '[id*="price"]',
    '[data-price]',
    '.money',
    '.cost',
    '.amount'
  ];
  
  for (const selector of selectors) {
    const elements = doc.querySelectorAll(selector);
    console.log(`🔎 Checking selector "${selector}": found ${elements.length} elements`);
    for (const element of elements) {
      const content = element.getAttribute('content') || 
                     element.getAttribute('data-price') || 
                     element.textContent;
      
      if (content && content.trim()) {
        console.log(`Checking price element "${selector}": "${content.trim()}"`);
        
        // Comprehensive regex patterns for international price formats
        const pricePatterns = [
          // Currency symbol first with various formats
          /[\$£€¥₹₽¢]\s*(\d{1,3}(?:[,.\s]\d{3})*(?:[.,]\d{2})?)/gi,
          
          // Currency symbol after price
          /(\d{1,3}(?:[,.\s]\d{3})*(?:[.,]\d{2})?)\s*[\$£€¥₹₽¢]/gi,
          
          // Decimal prices without currency (any reasonable format)
          /\b(\d{1,4}[.,]\d{2})\b/g,
          
          // Integer prices with currency indicators
          /[\$£€¥₹₽¢]\s*(\d{1,4})\b/gi,
          
          // European format (comma as decimal separator)
          /(\d{1,3}(?:\.\d{3})*,\d{2})/g,
          
          // Just numbers that look like prices (broad fallback)
          /\b(\d{1,4}(?:[.,]\d{2})?)\b/g
        ];
        
        for (const pattern of pricePatterns) {
          const matches = [...content.matchAll(pattern)];
          if (matches.length > 0) {
            for (const match of matches) {
              // Get the captured group (the numeric part)
              const rawPrice = match[1] || match[0];
              console.log(`🔍 Raw price match: "${rawPrice}" from pattern: ${pattern}`);
              
              // Handle different decimal formats
              let price = rawPrice.replace(/\s/g, ''); // Remove spaces first
              
              // Handle European format (1.234,56 -> 1234.56)
              if (price.includes(',') && price.includes('.')) {
                // If both comma and dot, assume European format where dot is thousands separator
                price = price.replace(/\./g, '').replace(',', '.');
              } else if (price.includes(',') && !price.includes('.')) {
                // Only comma, could be decimal separator
                const commaIndex = price.lastIndexOf(',');
                const afterComma = price.substring(commaIndex + 1);
                if (afterComma.length === 2) {
                  // Likely decimal separator
                  price = price.replace(',', '.');
                }
              }
              
              // Remove any remaining commas (thousands separators)
              price = price.replace(/,/g, '');
              
              const numPrice = parseFloat(price);
              console.log(`💰 Parsed price: ${numPrice} from "${rawPrice}"`);
              
              // Reasonable price validation with better range
              if (!isNaN(numPrice) && numPrice >= 0.01 && numPrice <= 99999) {
                console.log(`✅ Valid price found: $${numPrice.toFixed(2)} from "${content.trim().substring(0, 60)}"`);
                return numPrice.toFixed(2);
              } else {
                console.log(`❌ Invalid price range: ${numPrice} (must be between 0.01 and 99999)`);
              }
            }
          }
        }
        
        // Fallback: look for any reasonable number that might be a price
        const fallbackMatch = content.match(/\b(\d{1,3}(?:\.\d{2})?)\b/);
        if (fallbackMatch) {
          const numPrice = parseFloat(fallbackMatch[1]);
          if (!isNaN(numPrice) && numPrice >= 1 && numPrice <= 1000) {
            console.log(`⚠️ Fallback price found: $${numPrice.toFixed(2)}`);
            return numPrice.toFixed(2);
          }
        }
      }
    }
  }
  
  // Enhanced fallback: look for JSON-LD structured data (common in Shopify)
  const jsonLdElements = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const element of jsonLdElements) {
    try {
      const jsonData = JSON.parse(element.textContent || '');
      if (jsonData['@type'] === 'Product' && jsonData.offers) {
        const offers = Array.isArray(jsonData.offers) ? jsonData.offers[0] : jsonData.offers;
        if (offers.price) {
          const price = parseFloat(offers.price);
          if (!isNaN(price) && price > 0.50) {
            console.log(`Found price in JSON-LD: ${price}`);
            return price.toFixed(2);
          }
        }
      }
    } catch (e) {
      // Ignore JSON parsing errors
    }
  }
  
  // Shopify-specific: look for product data in script tags
  const scriptElements = doc.querySelectorAll('script');
  for (const script of scriptElements) {
    const content = script.textContent || '';
    
    // Look for Shopify product JSON
    const shopifyProductMatch = content.match(/window\.ShopifyAnalytics\s*=.*?product['"]:.*?price['"]:.*?(\d+)/);
    if (shopifyProductMatch) {
      const price = parseFloat(shopifyProductMatch[1]) / 100; // Shopify prices are in cents
      if (!isNaN(price) && price > 0.50) {
        console.log(`Found Shopify product price: ${price}`);
        return price.toFixed(2);
      }
    }
    
    // Look for product data variable
    const productDataMatch = content.match(/(?:product|item).*?['":].*?(\d+\.\d{2})/i);
    if (productDataMatch) {
      const price = parseFloat(productDataMatch[1]);
      if (!isNaN(price) && price > 0.50 && price < 10000) {
        console.log(`Found product data price: ${price}`);
        return price.toFixed(2);
      }
    }
  }
  
  // Final fallback: look for any number that looks like a price in the visible text
  const bodyText = doc.body?.textContent || '';
  const fallbackPatterns = [
    /[\$£€¥]\s*[\d,]+\.?\d{2}/g, // Currency with decimals
    /[\$£€¥]\s*[\d,]+/g, // Currency without decimals
    /\b[\d,]+\.\d{2}\b/g // Decimal numbers (likely prices)
  ];
  
  for (const pattern of fallbackPatterns) {
    const matches = bodyText.match(pattern);
    if (matches) {
      for (const match of matches) {
        const price = match.replace(/[£€¥\$,\s]/g, '');
        const numPrice = parseFloat(price);
        if (!isNaN(numPrice) && numPrice > 5 && numPrice < 10000) {
          console.log(`Found fallback price: ${numPrice}`);
          return numPrice.toFixed(2);
        }
      }
    }
  }
  
  return undefined;
};

const extractImageUrl = (doc: Document, origin: string): string | undefined => {
  console.log('🖼️ Extracting image from URL:', origin);
  
  // Strategy 1: Meta tags (most reliable)
  const metaSelectors = [
    'meta[property="og:image"]',
    'meta[property="og:image:url"]',
    'meta[name="twitter:image"]',
    'meta[property="product:image"]'
  ];
  
  for (const selector of metaSelectors) {
    const meta = doc.querySelector(selector);
    if (meta) {
      const content = meta.getAttribute('content');
      if (content && content.trim() && content.length > 10 && !content.includes('data:image')) {
        console.log('🖼️ Found image from meta:', content);
        try {
          return content.startsWith('http') ? content : new URL(content, origin).href;
        } catch {
          if (content.startsWith('http')) return content;
        }
      }
    }
  }
  
  // Strategy 2: JSON-LD structured data
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      const items = Array.isArray(data) ? data : [data];
      
      for (const item of items) {
        if (item['@type'] === 'Product') {
          const image = item.image || item.images;
          if (image) {
            const imageUrl = Array.isArray(image) ? image[0] : image;
            const finalUrl = typeof imageUrl === 'object' ? imageUrl.url : imageUrl;
            if (finalUrl && typeof finalUrl === 'string') {
              console.log('🖼️ Found image from JSON-LD:', finalUrl);
              return finalUrl.startsWith('http') ? finalUrl : new URL(finalUrl, origin).href;
            }
          }
        }
      }
    } catch (e) {
      // Ignore JSON parsing errors
    }
  }
  
  // Strategy 3: Store-specific selectors
  const imageSelectors = [
    // Amazon
    '#landingImage',
    '.a-dynamic-image',
    
    // eBay
    '#imgBlkFront',
    '.ux-image-carousel-item img',
    
    // Etsy
    '[data-testid="listing-page-image"] img',
    '.listing-page-image img',
    
    // Shopify
    '.product__main-photos img',
    '.product-single__photo img',
    '.product__photo img',
    
    // Generic e-commerce
    '.product-image img',
    '.main-image img',
    '.hero-image img',
    '.featured-image img',
    '.primary-image img',
    
    // Book retailers
    '.book-cover img',
    '.SearchResultListItem-image img',
    '.AllEditionsItem-image img',
    
    // Modern selectors
    '[data-testid*="product"] img',
    '[data-testid*="image"] img',
    'img[alt*="product" i]',
    'img[src*="product"]'
  ];
  
  for (const selector of imageSelectors) {
    const element = doc.querySelector(selector);
    if (element) {
      const src = element.getAttribute('src') || 
                  element.getAttribute('data-src') || 
                  element.getAttribute('data-lazy-src');
      
      if (src && src.length > 10 && !src.includes('data:image')) {
        // Skip obvious non-product images
        const skipPatterns = ['placeholder', 'icon', 'logo', 'spinner', 'loading'];
        if (skipPatterns.some(pattern => src.toLowerCase().includes(pattern))) {
          continue;
        }
        
        console.log(`🖼️ Found image with selector "${selector}":`, src);
        try {
          return src.startsWith('http') ? src : new URL(src, origin).href;
        } catch {
          if (src.startsWith('http')) return src;
        }
      }
    }
  }
  
  // Strategy 4: Simple fallback - first reasonable image
  const allImages = doc.querySelectorAll('img');
  for (const img of allImages) {
    const src = img.getAttribute('src');
    if (src && src.length > 10 && !src.includes('data:image')) {
      const width = parseInt(img.getAttribute('width') || '0');
      const height = parseInt(img.getAttribute('height') || '0');
      
      // Skip very small images
      if ((width > 0 && width < 100) || (height > 0 && height < 100)) continue;
      
      // Skip obvious non-product images
      const skipPatterns = ['placeholder', 'icon', 'logo', 'spinner', 'loading', 'button', 'nav'];
      if (skipPatterns.some(pattern => src.toLowerCase().includes(pattern))) continue;
      
      console.log('🖼️ Using fallback image:', src);
      try {
        return src.startsWith('http') ? src : new URL(src, origin).href;
      } catch {
        if (src.startsWith('http')) return src;
      }
    }
  }
  
  console.log('🖼️ No image found');
  return undefined;
};
