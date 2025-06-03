
interface ProductInfo {
  itemName?: string;
  storeName?: string;
  price?: string;
  imageUrl?: string;
}

export const parseProductUrl = async (url: string): Promise<ProductInfo> => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Extract store name from hostname
    const storeName = extractStoreName(hostname);
    
    // Try to fetch the page content
    const productInfo: ProductInfo = { storeName };
    
    try {
      // Use a CORS proxy to fetch the page content
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.contents) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        // Extract item name from various meta tags and title
        productInfo.itemName = extractItemName(doc);
        
        // Extract price from various sources
        productInfo.price = extractPrice(doc);
        
        // Extract image URL
        productInfo.imageUrl = extractImageUrl(doc, urlObj.origin);
      }
    } catch (fetchError) {
      console.log('Could not fetch page content, using URL-based extraction only');
    }
    
    return productInfo;
  } catch (error) {
    console.error('Error parsing URL:', error);
    return {};
  }
};

const extractStoreName = (hostname: string): string => {
  // Remove www. and common TLD extensions
  let storeName = hostname.replace(/^www\./, '');
  
  // Known store mappings
  const storeMap: { [key: string]: string } = {
    'amazon.com': 'Amazon',
    'amazon.co.uk': 'Amazon UK',
    'amazon.ca': 'Amazon Canada',
    'ebay.com': 'eBay',
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
    'sephora.com': 'Sephora',
    'ulta.com': 'Ulta Beauty'
  };
  
  for (const [domain, name] of Object.entries(storeMap)) {
    if (hostname.includes(domain)) {
      return name;
    }
  }
  
  // Fallback: capitalize first letter and remove .com
  storeName = storeName.replace(/\.(com|co\.uk|ca|org|net)$/, '');
  return storeName.charAt(0).toUpperCase() + storeName.slice(1);
};

const extractItemName = (doc: Document): string | undefined => {
  // Try various selectors for product titles
  const selectors = [
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'title',
    'h1',
    '[data-testid="product-title"]',
    '.product-title',
    '#product-title',
    '.pdp-product-name'
  ];
  
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element) {
      const content = element.getAttribute('content') || element.textContent;
      if (content && content.trim()) {
        return content.trim();
      }
    }
  }
  
  return undefined;
};

const extractPrice = (doc: Document): string | undefined => {
  // Try various selectors for price
  const selectors = [
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    '[data-testid="price"]',
    '.price',
    '.product-price',
    '.current-price',
    '.sale-price',
    '.regular-price'
  ];
  
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element) {
      const content = element.getAttribute('content') || element.textContent;
      if (content && content.trim()) {
        // Extract numeric price from text
        const priceMatch = content.match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          return priceMatch[0].replace(/,/g, '');
        }
      }
    }
  }
  
  return undefined;
};

const extractImageUrl = (doc: Document, origin: string): string | undefined => {
  // Try various selectors for product images
  const selectors = [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    '[data-testid="product-image"] img',
    '.product-image img',
    '#product-image img',
    '.hero-image img'
  ];
  
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element) {
      const src = element.getAttribute('content') || element.getAttribute('src');
      if (src && src.trim()) {
        // Convert relative URLs to absolute
        try {
          return new URL(src, origin).href;
        } catch {
          return src;
        }
      }
    }
  }
  
  return undefined;
};
