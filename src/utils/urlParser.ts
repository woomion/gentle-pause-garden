
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
    
    // Try to extract info from URL structure first (for Amazon, etc.)
    const urlBasedInfo = extractFromUrlStructure(url, hostname);
    
    // Try to fetch the page content
    const productInfo: ProductInfo = { 
      storeName,
      ...urlBasedInfo 
    };
    
    try {
      // Use a CORS proxy to fetch the page content
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      console.log('Fetching product info from:', url);
      
      const response = await fetch(proxyUrl);
      const data = await response.json();
      
      if (data.contents) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(data.contents, 'text/html');
        
        // Extract item name from various meta tags and title
        const scrapedName = extractItemName(doc);
        if (scrapedName && !productInfo.itemName) {
          productInfo.itemName = scrapedName;
          console.log('Extracted item name:', scrapedName);
        }
        
        // Extract price from various sources
        const scrapedPrice = extractPrice(doc);
        if (scrapedPrice && !productInfo.price) {
          productInfo.price = scrapedPrice;
          console.log('Extracted price:', scrapedPrice);
        }
        
        // Extract image URL with improved selectors
        const scrapedImage = extractImageUrl(doc, urlObj.origin);
        if (scrapedImage && !productInfo.imageUrl) {
          productInfo.imageUrl = scrapedImage;
          console.log('Extracted image URL:', scrapedImage);
        }
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

const extractFromUrlStructure = (url: string, hostname: string): Partial<ProductInfo> => {
  const info: Partial<ProductInfo> = {};
  
  // Amazon specific URL parsing
  if (hostname.includes('amazon')) {
    const match = url.match(/\/([^\/]+)\/dp\/([A-Z0-9]{10})/);
    if (match) {
      const titlePart = match[1];
      // Convert URL-encoded title to readable format
      const decodedTitle = decodeURIComponent(titlePart.replace(/-/g, ' '));
      info.itemName = decodedTitle.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    }
  }
  
  // eBay specific URL parsing
  if (hostname.includes('ebay')) {
    const match = url.match(/\/itm\/([^\/]+)/);
    if (match) {
      const titlePart = match[1];
      const decodedTitle = decodeURIComponent(titlePart.replace(/-/g, ' '));
      info.itemName = decodedTitle.split(' ').slice(0, 8).join(' '); // Limit length
    }
  }
  
  return info;
};

const extractStoreName = (hostname: string): string => {
  // Remove www. and common TLD extensions
  let storeName = hostname.replace(/^www\./, '');
  
  // Known store mappings
  const storeMap: { [key: string]: string } = {
    'amazon.com': 'Amazon',
    'amazon.co.uk': 'Amazon UK',
    'amazon.ca': 'Amazon Canada',
    'amazon.de': 'Amazon Germany',
    'amazon.fr': 'Amazon France',
    'ebay.com': 'eBay',
    'ebay.co.uk': 'eBay UK',
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
    'ulta.com': 'Ulta Beauty',
    'nike.com': 'Nike',
    'adidas.com': 'Adidas',
    'zara.com': 'Zara',
    'hm.com': 'H&M',
    'uniqlo.com': 'Uniqlo',
    'shopify.com': 'Shopify Store',
    'bigcommerce.com': 'BigCommerce Store'
  };
  
  for (const [domain, name] of Object.entries(storeMap)) {
    if (hostname.includes(domain)) {
      return name;
    }
  }
  
  // Fallback: capitalize first letter and remove .com
  storeName = storeName.replace(/\.(com|co\.uk|ca|org|net|de|fr|shop)$/, '');
  return storeName.charAt(0).toUpperCase() + storeName.slice(1);
};

const extractItemName = (doc: Document): string | undefined => {
  // Try various selectors for product titles in order of preference
  const selectors = [
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'meta[name="title"]',
    '[data-automation-id="product-title"]',
    '[data-testid="product-title"]',
    '.product-title',
    '#product-title',
    '.pdp-product-name',
    'h1[class*="title"]',
    'h1[class*="product"]',
    'h1[class*="name"]',
    '.product-name',
    '.item-title',
    '[class*="ProductTitle"]',
    '[class*="product-title"]',
    'h1'
  ];
  
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element) {
      const content = element.getAttribute('content') || element.textContent;
      if (content && content.trim() && content.length > 5 && content.length < 200) {
        return content.trim().substring(0, 100); // Limit length
      }
    }
  }
  
  // Try title tag as last resort
  const title = doc.title;
  if (title && title.length > 5) {
    // Remove common e-commerce suffixes
    const cleanTitle = title.replace(/ - (Amazon|eBay|Target|Walmart|Best Buy|Shop|Store).*$/i, '').trim();
    return cleanTitle.substring(0, 100);
  }
  
  return undefined;
};

const extractPrice = (doc: Document): string | undefined => {
  // Try various selectors for price
  const selectors = [
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    'meta[name="price"]',
    '[data-automation-id="product-price"]',
    '[data-testid="price"]',
    '[class*="price"]:not([class*="original"]):not([class*="was"]):not([class*="msrp"])',
    '.current-price',
    '.sale-price',
    '.regular-price',
    '.price-current',
    '.price-now',
    '[class*="current"]',
    '.a-price-whole', // Amazon specific
    '.display-price', // Best Buy specific
    '[class*="Price"]',
    '[id*="price"]'
  ];
  
  for (const selector of selectors) {
    const elements = doc.querySelectorAll(selector);
    for (const element of elements) {
      const content = element.getAttribute('content') || element.textContent;
      if (content && content.trim()) {
        // Extract numeric price from text
        const priceMatch = content.match(/[\$£€¥]?[\d,]+\.?\d*/);
        if (priceMatch) {
          let price = priceMatch[0].replace(/[£€¥\$,]/g, '');
          // Ensure it's a valid number and reasonable price range
          const numPrice = parseFloat(price);
          if (!isNaN(numPrice) && numPrice > 0 && numPrice < 100000) {
            return price;
          }
        }
      }
    }
  }
  
  return undefined;
};

const extractImageUrl = (doc: Document, origin: string): string | undefined => {
  // Try various selectors for product images with improved priority
  const selectors = [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[property="og:image:url"]',
    '[data-automation-id="product-image"] img',
    '[data-testid="product-image"] img',
    '.product-image img',
    '#product-image img',
    '.hero-image img',
    '.main-image img',
    '[class*="ProductImage"] img',
    '[class*="product-image"] img',
    '[class*="hero"] img',
    '[class*="main"] img',
    'img[alt*="product" i]',
    'img[alt*="item" i]',
    'img[src*="product"]',
    'img[class*="product"]'
  ];
  
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element) {
      const src = element.getAttribute('content') || element.getAttribute('src');
      if (src && src.trim() && !src.includes('data:image') && src.length > 10) {
        // Skip obvious placeholder or icon images
        if (src.includes('placeholder') || src.includes('icon') || src.includes('logo') || 
            src.includes('spinner') || src.includes('loading') || src.width < 100 || src.height < 100) {
          continue;
        }
        
        // Convert relative URLs to absolute
        try {
          const imageUrl = new URL(src, origin).href;
          // Basic validation that it's likely a product image
          if (imageUrl.match(/\.(jpg|jpeg|png|webp|gif)($|\?)/i) || 
              imageUrl.includes('images') || imageUrl.includes('media')) {
            return imageUrl;
          }
        } catch {
          // If URL construction fails, try returning the src as-is if it looks like a URL
          if (src.startsWith('http')) {
            return src;
          }
        }
      }
    }
  }
  
  return undefined;
};
