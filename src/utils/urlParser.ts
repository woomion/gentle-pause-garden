
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
    'amazon.it': 'Amazon Italy',
    'amazon.es': 'Amazon Spain',
    'amazon.in': 'Amazon India',
    'amazon.co.jp': 'Amazon Japan',
    'ebay.com': 'eBay',
    'ebay.co.uk': 'eBay UK',
    'ebay.de': 'eBay Germany',
    'ebay.fr': 'eBay France',
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
    'gap.com': 'Gap',
    'oldnavy.com': 'Old Navy',
    'forever21.com': 'Forever 21',
    'urbanoutfitters.com': 'Urban Outfitters',
    'anthropologie.com': 'Anthropologie',
    'freepeople.com': 'Free People',
    'victoriassecret.com': "Victoria's Secret",
    'williams-sonoma.com': 'Williams Sonoma',
    'crateandbarrel.com': 'Crate & Barrel',
    'cb2.com': 'CB2',
    'westelm.com': 'West Elm',
    'potterybarn.com': 'Pottery Barn',
    'ikea.com': 'IKEA',
    'shopify.com': 'Shopify Store',
    'bigcommerce.com': 'BigCommerce Store',
    'squarespace.com': 'Squarespace Store',
    'wix.com': 'Wix Store',
    'poshmark.com': 'Poshmark',
    'mercari.com': 'Mercari',
    'depop.com': 'Depop',
    'thredup.com': 'ThredUp',
    'realreal.com': 'The RealReal'
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
    // Meta tags (highest priority)
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    'meta[property="product:title"]',
    'meta[name="title"]',
    
    // Store-specific selectors
    '#productTitle', // Amazon
    '.x-item-title-label', // eBay
    '[data-automation-id="product-title"]', // Target
    '[data-testid="product-title"]',
    '.product-title',
    '#product-title',
    '.pdp-product-name',
    '.product-name',
    '.item-title',
    '.listing-page-title',
    '.product-details-product-title',
    '[class*="ProductTitle"]',
    '[class*="product-title"]',
    '[class*="item-title"]',
    
    // Generic headings
    'h1[class*="title"]',
    'h1[class*="product"]',
    'h1[class*="name"]',
    '.page-title h1',
    'main h1',
    'h1'
  ];
  
  for (const selector of selectors) {
    const element = doc.querySelector(selector);
    if (element) {
      const content = element.getAttribute('content') || element.textContent;
      if (content && content.trim() && content.length > 3 && content.length < 300) {
        // Clean up the title
        let cleanTitle = content.trim()
          .replace(/\s+/g, ' ') // Normalize whitespace
          .replace(/^\||\|$/g, '') // Remove leading/trailing pipes
          .trim();
        
        return cleanTitle.substring(0, 150);
      }
    }
  }
  
  // Try title tag as last resort
  const title = doc.title;
  if (title && title.length > 3) {
    // Remove common e-commerce suffixes and clean up
    const cleanTitle = title
      .replace(/ - (Amazon\.com|Amazon|eBay|Target|Walmart|Best Buy|Shop|Store|Buy Online).*$/i, '')
      .replace(/ \| .*$/i, '') // Remove everything after pipe
      .replace(/ :: .*$/i, '') // Remove everything after double colon
      .trim();
    
    if (cleanTitle.length > 3) {
      return cleanTitle.substring(0, 150);
    }
  }
  
  return undefined;
};

const extractPrice = (doc: Document): string | undefined => {
  // Try various selectors for price in order of preference
  const selectors = [
    // Meta tags (most reliable)
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    'meta[property="product:price"]',
    'meta[name="price"]',
    
    // Store-specific selectors
    '.a-price-whole', // Amazon whole price
    '.a-price .a-offscreen', // Amazon full price
    '#priceblock_dealprice', // Amazon deal price
    '#priceblock_saleprice', // Amazon sale price
    '#price_inside_buybox', // Amazon buybox price
    '.notranslate', // eBay price
    '.u-flL.condText', // eBay price
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
        // Multiple regex patterns to catch different price formats
        const pricePatterns = [
          /[\$£€¥₹₽¢]\s*[\d,]+\.?\d*/g, // Currency symbol first
          /[\d,]+\.?\d*\s*[\$£€¥₹₽¢]/g, // Currency symbol last
          /[\d,]+\.\d{2}/g, // Decimal prices without currency
          /[\d,]{3,}/g // Large numbers (likely prices)
        ];
        
        for (const pattern of pricePatterns) {
          const matches = content.match(pattern);
          if (matches) {
            for (const match of matches) {
              // Clean up the price string
              let price = match
                .replace(/[£€¥₹₽¢\$,\s]/g, '') // Remove currency symbols and formatting
                .trim();
              
              // Ensure it's a valid number and reasonable price range
              const numPrice = parseFloat(price);
              if (!isNaN(numPrice) && numPrice > 0.01 && numPrice < 100000) {
                // Return the cleaned numeric price
                return numPrice.toFixed(2);
              }
            }
          }
        }
      }
    }
  }
  
  // Fallback: look for any number that looks like a price in the page
  const bodyText = doc.body?.textContent || '';
  const fallbackMatch = bodyText.match(/[\$£€¥]\s*[\d,]+\.?\d{2}/);
  if (fallbackMatch) {
    const price = fallbackMatch[0].replace(/[£€¥\$,\s]/g, '');
    const numPrice = parseFloat(price);
    if (!isNaN(numPrice) && numPrice > 0.01 && numPrice < 10000) {
      return numPrice.toFixed(2);
    }
  }
  
  return undefined;
};

const extractImageUrl = (doc: Document, origin: string): string | undefined => {
  // Try various selectors for product images with improved priority
  const selectors = [
    // Meta tags (most reliable)
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    'meta[property="og:image:url"]',
    'meta[property="product:image"]',
    
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
    
    // Alt text based selectors
    'img[alt*="product" i]',
    'img[alt*="item" i]',
    'img[alt*="buy" i]',
    'img[alt*="shop" i]',
    
    // Source-based selectors
    'img[src*="product"]',
    'img[src*="item"]',
    'img[src*="catalog"]',
    'img[class*="product"]',
    
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
