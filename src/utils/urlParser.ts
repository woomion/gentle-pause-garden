
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

// Fast proxy services ordered by reliability and speed
const PROXY_SERVICES = [
  { url: 'https://api.allorigins.win/get?url=', timeout: 3000, priority: 1 },
  { url: 'https://corsproxy.io/?', timeout: 4000, priority: 2 },
  { url: 'https://cors-anywhere.herokuapp.com/', timeout: 5000, priority: 3 },
];

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
    console.log('🚀 Fast parsing URL:', url);
    
    // Clean the URL first
    let cleanUrl = url.trim();
    if (!cleanUrl) {
      throw new Error('Empty URL provided');
    }

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

    // Add parallel proxy fetching with race condition
    extractionPromises.push(
      (async () => {
        const fetchPromises = PROXY_SERVICES.map(async (service, index) => {
          try {
            const proxyUrl = service.url + encodeURIComponent(resolvedUrl);
            const response = await fetch(proxyUrl, {
              signal: AbortSignal.timeout(service.timeout),
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
              }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            let htmlContent: string;
            const contentType = response.headers.get('content-type') || '';
            
            if (contentType.includes('application/json')) {
              const data = await response.json();
              htmlContent = data.contents || data.response || '';
            } else {
              htmlContent = await response.text();
            }

            if (!htmlContent || !htmlContent.includes('<html')) {
              throw new Error('Invalid HTML content');
            }

            return { htmlContent, service: service.url, priority: service.priority };
          } catch (error) {
            throw new Error(`Proxy ${index + 1} failed: ${error.message}`);
          }
        });

        // Use Promise.any to get the fastest successful response
        try {
          // Use Promise.race for faster response (first one wins)
          const result = await Promise.race(fetchPromises.map(async (promise, index) => {
            try {
              return await promise;
            } catch (error) {
              // Throw with index to track which proxy failed
              throw new Error(`Proxy ${index + 1} failed: ${error.message}`);
            }
          }));
          console.log(`✅ Fast fetch success via ${result.service} in`, performance.now() - startTime, 'ms');
          
          // Parse HTML and extract all data in parallel
          const parser = new DOMParser();
          const doc = parser.parseFromString(result.htmlContent, 'text/html');
          
          const [itemName, price, imageUrl] = await Promise.all([
            Promise.resolve(extractItemName(doc)),
            Promise.resolve(extractPrice(doc)),
            Promise.resolve(extractImageUrl(doc, urlObj.origin))
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
    console.error('Error parsing URL:', error);
    return {};
  }
};

// Enhanced redirect resolution with multiple fallback services
const resolveRedirects = async (url: string): Promise<string> => {
  const shortUrlPatterns = [
    'amzn.to', 'amazon.com/dp', 'amazon.com/gp',
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'short.link',
    'rb.gy', 'is.gd', 'v.gd', 'rebrand.ly', 'tiny.cc'
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

    // Multiple redirect resolution services with timeout
    const redirectServices = [
      async () => {
        const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://httpbin.org/redirect-to?url=${encodeURIComponent(url)}`)}`, {
          signal: AbortSignal.timeout(5000)
        });
        return response.url;
      },
      async () => {
        // Direct HEAD request to the short URL
        const response = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow',
          signal: AbortSignal.timeout(5000)
        });
        return response.url;
      },
      async () => {
        // Use a different redirect resolver
        const response = await fetch(`https://unshorten.me/json/${encodeURIComponent(url)}`, {
          signal: AbortSignal.timeout(5000)
        });
        const data = await response.json();
        return data.resolved_url || data.url;
      }
    ];

    // Try each service with timeout
    for (const service of redirectServices) {
      try {
        const resolvedUrl = await service();
        if (resolvedUrl && resolvedUrl !== url && resolvedUrl.length > url.length) {
          console.log('Successfully resolved redirect:', resolvedUrl);
          return resolvedUrl;
        }
      } catch (serviceError) {
        console.log('Redirect service failed, trying next:', serviceError.message);
        continue;
      }
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
    
    // Specialty stores
    'chewy.com': 'Chewy',
    'petco.com': 'Petco',
    'petsmart.com': 'PetSmart',
    'rei.com': 'REI',
    'dickssportinggoods.com': "Dick's Sporting Goods",
    'academy.com': 'Academy Sports'
  };
  
  for (const [domain, name] of Object.entries(storeMap)) {
    if (hostname.includes(domain)) {
      return name;
    }
  }
  
  // Enhanced fallback: handle more TLD extensions and special cases
  storeName = storeName.replace(/\.(com|co\.uk|ca|org|net|de|fr|shop|store|io|ly|me|us|biz|info)$/, '');
  
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

const extractPrice = (doc: Document): string | undefined => {
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
    '.listing-page-price .currency-value', // Etsy alternative
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
  // Enhanced selectors for product images with better store coverage
  const selectors = [
    // Meta tags (most reliable)
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[property="og:image:url"]',
    'meta[property="product:image"]',
    
    // ThriftBooks specific image selectors (high priority)
    '.SearchResultListItem-image img', // ThriftBooks search results
    '.AllEditionsItem-image img', // ThriftBooks book page
    '.work-image img', // ThriftBooks
    '.book-image img', // ThriftBooks
    '.product-image img', // ThriftBooks product page
    '.item-image img', // ThriftBooks
    '.book-cover img', // ThriftBooks cover
    '.cover-image img', // ThriftBooks cover
    '[data-testid="book-cover"] img', // ThriftBooks modern
    '.main-book-image img', // ThriftBooks main
    
    // Barnes & Noble specific
    '.pdp-product-image img', // B&N
    '.product-image-main img', // B&N
    '.book-jacket img', // B&N
    
    // Store-specific high-quality image selectors
    '#landingImage', // Amazon main product image
    '.a-dynamic-image', // Amazon dynamic image
    '#imgBlkFront', // eBay main image
    '.ux-image-carousel-item img', // eBay carousel
    '[data-automation-id="product-image"] img', // Target
    '[data-testid="product-image"] img',
    '.product-hero-image img',
    '.product-media img',
    '.pdp-image img',
    '.main-product-image img',
    
    // Etsy specific
    '[data-testid="listing-page-image"] img', // Etsy
    '.listing-page-image img', // Etsy
    '.shop2-listing-page-image img', // Etsy legacy
    
    // Shopify specific
    '.product__main-photos img', // Shopify
    '.product-single__photo img', // Shopify
    '.featured-image img', // Shopify
    
    // Generic product image selectors
    '.product-image img',
    '#product-image img',
    '.hero-image img',
    '.main-image img',
    '.primary-image img',
    '.featured-image img',
    '[class*="ProductImage"] img',
    '[class*="product-image"] img',
    '[class*="hero"] img',
    '[class*="main"] img',
    '[class*="primary"] img',
    '[class*="book"] img',
    '[class*="cover"] img',
    
    // Alt text based selectors (enhanced for books)
    'img[alt*="product" i]',
    'img[alt*="item" i]',
    'img[alt*="book" i]',
    'img[alt*="cover" i]',
    'img[alt*="buy" i]',
    'img[alt*="shop" i]',
    
    // Source-based selectors
    'img[src*="product"]',
    'img[src*="item"]',
    'img[src*="catalog"]',
    'img[src*="book"]',
    'img[src*="cover"]',
    'img[class*="product"]',
    'img[class*="book"]',
    
    // Fallback: any reasonably sized image
    'img[width]:not([width="1"]):not([width="0"])',
    'main img',
    '.content img'
  ];
  
  for (const selector of selectors) {
    const elements = doc.querySelectorAll(selector);
    
    for (const element of elements) {
      const src = element.getAttribute('content') || 
                  element.getAttribute('src') || 
                  element.getAttribute('data-src') || 
                  element.getAttribute('data-lazy-src');
      
      if (src && src.trim() && !src.includes('data:image') && src.length > 10) {
        // Skip obvious non-product images
        const skipPatterns = [
          'placeholder', 'icon', 'logo', 'spinner', 'loading', 'pixel',
          'blank', 'spacer', 'arrow', 'button', 'social', 'banner',
          'nav', 'menu', 'footer', 'header', 'ad', 'promo'
        ];
        
        if (skipPatterns.some(pattern => src.toLowerCase().includes(pattern))) {
          continue;
        }
        
        // Check image dimensions if available
        if (element.tagName === 'IMG') {
          const imgElement = element as HTMLImageElement;
          const width = imgElement.naturalWidth || parseInt(element.getAttribute('width') || '0');
          const height = imgElement.naturalHeight || parseInt(element.getAttribute('height') || '0');
          
          // Skip very small images (likely icons) or very thin images (likely decorative)
          if ((width > 0 && width < 100) || (height > 0 && height < 100)) continue;
          if ((width > 0 && height > 0) && (width / height > 10 || height / width > 10)) continue;
        }
        
        // Convert relative URLs to absolute
        try {
          const imageUrl = new URL(src, origin).href;
          
          // Validate that it's likely a product image
          const validImageExtensions = /\.(jpg|jpeg|png|webp|gif|avif)($|\?)/i;
          const hasImagePath = /\/(images?|media|photos?|pics?|assets|cdn|static)/i.test(imageUrl);
          const hasProductPath = /\/(product|item|catalog|listing)/i.test(imageUrl);
          
          if (validImageExtensions.test(imageUrl) || hasImagePath || hasProductPath) {
            console.log('Found product image candidate:', imageUrl);
            return imageUrl;
          }
        } catch {
          // If URL construction fails, try returning the src as-is if it looks like a URL
          if (src.startsWith('http') && src.includes('.')) {
            console.log('Using fallback image URL:', src);
            return src;
          }
        }
      }
    }
  }
  
  return undefined;
};
