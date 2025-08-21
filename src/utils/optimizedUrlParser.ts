interface ProductInfo {
  itemName?: string;
  storeName?: string;
  price?: string;
  imageUrl?: string;
}

// Cache for parsed URLs to avoid repeated requests
const parseCache = new Map<string, { data: ProductInfo; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Pre-compiled regex patterns for better performance
const PRICE_REGEX = /[\$€£¥₹]?(\d+(?:,\d{3})*(?:\.\d{2})?)/;
const TRACKING_PARAMS = new Set([
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
  'fbclid', 'gclid', 'ref', 'referrer', 'source', 'campaign',
  '_ga', '_gl', 'mc_cid', 'mc_eid', 'affid', 'clickid'
]);

// Fast URL normalization
const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    
    // Remove tracking parameters in a single pass
    for (const param of TRACKING_PARAMS) {
      urlObj.searchParams.delete(param);
    }
    urlObj.hash = '';
    
    return urlObj.toString();
  } catch {
    return url;
  }
};

// Extract product name from URL path (fast, no external requests)
const extractProductNameFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(part => 
      part && 
      part.length > 3 && 
      !['product', 'item', 'shop', 'store', 'buy', 'cart', 'p', 'dp'].includes(part.toLowerCase()) &&
      !/^\d+$/.test(part)
    );
    
    if (pathParts.length > 0) {
      return pathParts
        .sort((a, b) => b.length - a.length)[0]
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    
    return null;
  } catch {
    return null;
  }
};

// Extract store name from hostname (fast, no external requests)
const extractStoreNameFromUrl = (url: string): string => {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    const parts = hostname.split('.');
    const domain = parts[parts.length - 2] || hostname;
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Unknown Store';
  }
};

// Sites that work well with Firecrawl (fast path)
const FIRECRAWL_PREFERRED_SITES = new Set([
  'amazon.com', 'target.com', 'walmart.com', 'bestbuy.com', 
  'homedepot.com', 'lowes.com', 'wayfair.com', 'overstock.com'
]);

// Sites that need special handling (bypass for speed)
const PROBLEMATIC_SITES = new Set([
  'shopbop.com', 'asics.com', 'nike.com', 'adidas.com', 'zara.com', 
  'hm.com', 'lululemon.com', 'anthropologie.com', 'freepeople.com',
  'nordstrom.com', 'saksfifthavenue.com', 'ssense.com', 'mrporter.com'
]);

// Fast site classification
const getSiteType = (url: string): 'firecrawl' | 'problematic' | 'standard' => {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    
    for (const site of FIRECRAWL_PREFERRED_SITES) {
      if (hostname.includes(site)) return 'firecrawl';
    }
    
    for (const site of PROBLEMATIC_SITES) {
      if (hostname.includes(site)) return 'problematic';
    }
    
    return 'standard';
  } catch {
    return 'standard';
  }
};

// Optimized Firecrawl call with timeout and error handling
const fetchViaFirecrawl = async (url: string, useExtract = false): Promise<ProductInfo> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
  
  try {
    const response = await fetch('https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/firecrawl-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        mode: useExtract ? 'extract' : 'crawl',
        ...(useExtract && {
          schema: {
            type: "object",
            properties: {
              itemName: { type: "string", description: "Product name" },
              price: { type: "string", description: "Price" },
              imageUrl: { type: "string", description: "Main product image URL" }
            }
          }
        })
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (useExtract && data.extracted) {
      return {
        itemName: data.extracted.itemName,
        price: data.extracted.price?.replace(/[^\d.]/g, ''),
        imageUrl: data.extracted.imageUrl,
        storeName: extractStoreNameFromUrl(url)
      };
    } else if (data.content) {
      return parseHtmlContent(data.content, url);
    }
    
    throw new Error('No data extracted');
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Fast HTML parsing for structured data
const parseHtmlContent = (html: string, url: string): ProductInfo => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const result: ProductInfo = {
    storeName: extractStoreNameFromUrl(url)
  };

  // Try JSON-LD first (most reliable)
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      const items = Array.isArray(data) ? data : [data];
      
      for (const item of items) {
        if (item['@type'] === 'Product') {
          if (item.name) result.itemName = item.name;
          if (item.offers?.[0]?.price) {
            result.price = String(item.offers[0].price).replace(/[^\d.]/g, '');
          }
          if (item.image) {
            const imageData = Array.isArray(item.image) ? item.image[0] : item.image;
            result.imageUrl = typeof imageData === 'string' ? imageData : imageData?.url;
          }
          if (result.itemName) break;
        }
      }
    } catch {
      continue;
    }
  }

  // Fallback to meta tags if needed
  if (!result.itemName) {
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
    if (ogTitle) {
      result.itemName = ogTitle.replace(/\s*[|\-–—]\s*[^|\-–—]*$/, '').trim();
    }
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

  return result;
};

// Main optimized parser - maintains exact same functionality but much faster
export const parseProductUrl = async (url: string): Promise<ProductInfo> => {
  console.log('🚀 Optimized parser: Starting for', url);
  
  const normalizedUrl = normalizeUrl(url);
  
  // Check cache first
  const cached = parseCache.get(normalizedUrl);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log('⚡ Cache hit for', url);
    return cached.data;
  }
  
  // Always start with fast URL-based extraction
  const urlBasedResult: ProductInfo = {
    itemName: extractProductNameFromUrl(url),
    storeName: extractStoreNameFromUrl(url)
  };
  
  console.log('🔍 URL-based extraction result:', urlBasedResult);
  
  const siteType = getSiteType(url);
  let finalResult: ProductInfo = urlBasedResult;
  
  try {
    // Optimized strategy based on site type
    switch (siteType) {
      case 'firecrawl':
        console.log('🎯 Using Firecrawl extract for preferred site');
        try {
          const firecrawlResult = await fetchViaFirecrawl(url, true);
          finalResult = {
            itemName: firecrawlResult.itemName || urlBasedResult.itemName || urlBasedResult.storeName,
            storeName: firecrawlResult.storeName || urlBasedResult.storeName,
            price: firecrawlResult.price,
            imageUrl: firecrawlResult.imageUrl
          };
        } catch {
          console.log('📋 Firecrawl extract failed, using crawl');
          const crawlResult = await fetchViaFirecrawl(url, false);
          finalResult = {
            itemName: crawlResult.itemName || urlBasedResult.itemName || urlBasedResult.storeName,
            storeName: crawlResult.storeName || urlBasedResult.storeName,
            price: crawlResult.price,
            imageUrl: crawlResult.imageUrl
          };
        }
        break;
        
      case 'problematic':
        console.log('⚠️ Problematic site detected, using URL extraction only');
        // For problematic sites, stick with URL-based extraction to avoid timeouts
        finalResult = {
          itemName: urlBasedResult.itemName || urlBasedResult.storeName || 'Product',
          storeName: urlBasedResult.storeName
        };
        break;
        
      default:
        console.log('📋 Standard site, trying Firecrawl crawl');
        try {
          const crawlResult = await fetchViaFirecrawl(url, false);
          finalResult = {
            itemName: crawlResult.itemName || urlBasedResult.itemName || urlBasedResult.storeName,
            storeName: crawlResult.storeName || urlBasedResult.storeName,
            price: crawlResult.price,
            imageUrl: crawlResult.imageUrl
          };
        } catch {
          console.log('💨 Firecrawl failed, using URL extraction');
          finalResult = {
            itemName: urlBasedResult.itemName || urlBasedResult.storeName || 'Product',
            storeName: urlBasedResult.storeName
          };
        }
        break;
    }
  } catch (error) {
    console.error('🔍 Parser failed, using URL fallback:', error);
    finalResult = {
      itemName: urlBasedResult.itemName || urlBasedResult.storeName || 'Product',
      storeName: urlBasedResult.storeName
    };
  }
  
  // Cache the result
  parseCache.set(normalizedUrl, { data: finalResult, timestamp: Date.now() });
  
  console.log('🔍 Final optimized result:', finalResult);
  return finalResult;
};