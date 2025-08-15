interface ProductInfo {
  itemName?: string;
  storeName?: string;
  price?: string;
  imageUrl?: string;
}

// Simple in-memory cache
const cache = new Map<string, { data: ProductInfo; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

const normalizeUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    // Remove tracking parameters
    ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'].forEach(param => 
      urlObj.searchParams.delete(param)
    );
    return urlObj.toString();
  } catch {
    return url;
  }
};

const extractStoreName = (hostname: string): string => {
  const cleanHostname = hostname.replace(/^www\./, '');
  
  const storeMap: Record<string, string> = {
    'amazon.com': 'Amazon',
    'shopbop.com': 'Shopbop',
    'nordstrom.com': 'Nordstrom',
    'saks.com': 'Saks',
    'zara.com': 'Zara',
    'hm.com': 'H&M',
    'asos.com': 'ASOS'
  };

  return storeMap[cleanHostname] || cleanHostname.split('.')[0];
};

const extractFromDOM = (html: string, baseUrl: string): ProductInfo => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const result: ProductInfo = {};

  // Extract title - try multiple selectors
  const titleSelectors = [
    'h1[data-automation-id="product-title"]',
    'h1.pdp-product-name',
    '.product-title h1',
    '.product-name',
    'h1[class*="product"]',
    'h1'
  ];

  for (const selector of titleSelectors) {
    const element = doc.querySelector(selector);
    if (element?.textContent?.trim()) {
      const text = element.textContent.trim();
      if (text.length > 3 && text.length < 200) {
        result.itemName = text;
        break;
      }
    }
  }

  // Extract price - look for currency symbols
  const priceSelectors = [
    '.price',
    '[class*="price"]',
    '.cost',
    '.amount',
    '[data-testid*="price"]'
  ];

  for (const selector of priceSelectors) {
    const element = doc.querySelector(selector);
    if (element?.textContent) {
      const text = element.textContent.trim();
      const priceMatch = text.match(/\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(/,/g, ''));
        if (price > 0 && price < 50000) {
          result.price = price.toFixed(2);
          break;
        }
      }
    }
  }

  // Extract main image
  const imageSelectors = [
    '.product-image img',
    '.main-image img',
    '.hero-image img',
    'img[alt*="product" i]',
    'img[class*="product"]'
  ];

  for (const selector of imageSelectors) {
    const img = doc.querySelector(selector) as HTMLImageElement;
    if (img?.src || img?.getAttribute('data-src')) {
      const imgSrc = img.src || img.getAttribute('data-src');
      if (imgSrc) {
        try {
          const url = imgSrc.startsWith('http') ? imgSrc : new URL(imgSrc, baseUrl).toString();
          if (url.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i)) {
            result.imageUrl = url;
            break;
          }
        } catch {
          continue;
        }
      }
    }
  }

  return result;
};

export const parseProductUrl = async (url: string): Promise<ProductInfo> => {
  console.log('🔥 Simple URL parser called with:', url);
  
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

    // Try multiple approaches in sequence
    const approaches = [
      () => fetchViaFirecrawl(normalizedUrl),
      () => fetchViaProxy(normalizedUrl),
      () => fetchDirect(normalizedUrl)
    ];

    for (const approach of approaches) {
      try {
        const html = await approach();
        if (html && html.length > 1000) {
          const extracted = extractFromDOM(html, normalizedUrl);
          Object.assign(result, extracted);
          
          if (result.itemName || result.price) {
            console.log('✅ Successfully parsed:', result);
            cache.set(normalizedUrl, { data: result, timestamp: Date.now() });
            return result;
          }
        }
      } catch (error) {
        console.log('⚠️ Approach failed:', error.message);
        continue;
      }
    }

    // Fallback to URL-based extraction
    console.log('🔄 Using URL fallback');
    cache.set(normalizedUrl, { data: result, timestamp: Date.now() });
    return result;

  } catch (error) {
    console.error('❌ Parse failed:', error);
    return {};
  }
};

// Fetch implementations
const fetchViaFirecrawl = async (url: string): Promise<string | null> => {
  const { supabase } = await import('@/integrations/supabase/client');
  
  const { data, error } = await supabase.functions.invoke('firecrawl-proxy', {
    body: { url }
  });
  
  if (error) throw new Error(`Firecrawl error: ${error.message}`);
  
  return data?.html || data?.content || null;
};

const fetchViaProxy = async (url: string): Promise<string | null> => {
  // Try a CORS proxy as backup
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl, { 
    signal: AbortSignal.timeout(8000) 
  });
  
  if (!response.ok) throw new Error('Proxy fetch failed');
  
  const data = await response.json();
  return data.contents;
};

const fetchDirect = async (url: string): Promise<string | null> => {
  // Last resort - direct fetch (may fail due to CORS)
  const response = await fetch(url, {
    signal: AbortSignal.timeout(5000),
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ProductParser/1.0)'
    }
  });
  
  if (!response.ok) throw new Error('Direct fetch failed');
  
  return await response.text();
};