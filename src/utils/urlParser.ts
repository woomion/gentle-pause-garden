
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
      // Try multiple approaches for better reliability
      let htmlContent = null;
      
      // First, try Shopify product API if it's a Shopify store
      if (hostname.includes('shopify') || url.includes('/products/')) {
        try {
          // Try Shopify's product JSON API
          const productApiUrl = url.replace(/\?.*$/, '') + '.json';
          console.log('Trying Shopify product API:', productApiUrl);
          
          const apiResponse = await fetch(productApiUrl);
          if (apiResponse.ok) {
            const productData = await apiResponse.json();
            if (productData.product) {
              console.log('Got Shopify product data:', productData.product.title);
              
              // Extract product info from API response
              if (productData.product.title && !productInfo.itemName) {
                productInfo.itemName = productData.product.title;
                console.log('Extracted item name from API:', productData.product.title);
              }
              
              // Get price from variants
              if (productData.product.variants && productData.product.variants.length > 0) {
                const variant = productData.product.variants[0];
                if (variant.price) {
                  productInfo.price = parseFloat(variant.price).toFixed(2);
                  console.log('Extracted price from API:', productInfo.price);
                }
              }
              
              // Get image from API
              if (productData.product.images && productData.product.images.length > 0) {
                productInfo.imageUrl = productData.product.images[0].src;
                console.log('Extracted image from API:', productInfo.imageUrl);
              }
              
              return productInfo; // Return early if API worked
            }
          }
        } catch (apiError) {
          console.log('Shopify API failed, trying proxy services:', apiError.message);
        }
      }
      
      // Fallback to proxy services
      const proxyServices = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
      ];
      
      // Try each proxy service
      for (const proxyUrl of proxyServices) {
        try {
          console.log('Trying proxy:', proxyUrl.split('?')[0]);
          const response = await fetch(proxyUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.contents) {
              htmlContent = data.contents;
              console.log('Successfully fetched content via proxy');
              break;
            } else if (typeof data === 'string' && data.includes('<html')) {
              htmlContent = data;
              console.log('Successfully fetched content via proxy (direct HTML)');
              break;
            }
          }
        } catch (proxyError) {
          console.log('Proxy failed, trying next:', proxyError.message);
          continue;
        }
      }
      
      if (htmlContent) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
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
        } else {
          console.log('Price extraction failed - no price found');
          // Debug: log some elements to see what we're working with
          const priceElements = doc.querySelectorAll('[class*="price"], [class*="Price"], .money, [data-price]');
          console.log(`Found ${priceElements.length} potential price elements:`, 
            Array.from(priceElements).slice(0, 5).map(el => ({
              tagName: el.tagName,
              className: el.className,
              textContent: el.textContent?.trim().substring(0, 50),
              innerHTML: el.innerHTML?.substring(0, 100)
            }))
          );
        }
        
        // Extract image URL with improved selectors
        const scrapedImage = extractImageUrl(doc, urlObj.origin);
        if (scrapedImage && !productInfo.imageUrl) {
          productInfo.imageUrl = scrapedImage;
          console.log('Extracted image URL:', scrapedImage);
        }
      } else {
        console.log('All proxy services failed, using URL-based extraction only');
      }
    } catch (fetchError) {
      console.log('Could not fetch page content, using URL-based extraction only:', fetchError.message);
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
  
  // Shopify store URL parsing (like sculpd.com)
  if (url.includes('/products/')) {
    const match = url.match(/\/products\/([^\/\?]+)/);
    if (match) {
      const productSlug = decodeURIComponent(match[1]);
      // Convert slug to readable title
      const readableTitle = productSlug
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      info.itemName = readableTitle;
      console.log('Extracted Shopify product name from URL:', readableTitle);
    }
  }
  
  // Etsy specific URL parsing
  if (hostname.includes('etsy')) {
    const match = url.match(/\/listing\/\d+\/([^\/\?]+)/);
    if (match) {
      const titlePart = decodeURIComponent(match[1]);
      const readableTitle = titlePart
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      info.itemName = readableTitle;
    }
  }
  
  // Generic product URL parsing for other e-commerce sites
  if (!info.itemName) {
    // Try to extract from common patterns like /product/, /item/, /p/
    const patterns = [
      /\/product\/([^\/\?]+)/i,
      /\/item\/([^\/\?]+)/i,
      /\/p\/([^\/\?]+)/i,
      /\/shop\/([^\/\?]+)/i
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const productSlug = decodeURIComponent(match[1]);
        const readableTitle = productSlug
          .replace(/[-_]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
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
        console.log(`Checking price element "${selector}": "${content.trim()}"`);
        
        // Multiple regex patterns to catch different price formats
        const pricePatterns = [
          /[\$£€¥₹₽¢]\s*[\d,]+\.?\d*/g, // Currency symbol first
          /[\d,]+\.?\d*\s*[\$£€¥₹₽¢]/g, // Currency symbol last
          /[\d,]+\.\d{2}/g, // Decimal prices without currency
          /\b[\d,]{2,}\b/g // Numbers (likely prices) - more flexible
        ];
        
        for (const pattern of pricePatterns) {
          const matches = content.match(pattern);
          if (matches) {
            for (const match of matches) {
              // Clean up the price string
              let price = match
                .replace(/[£€¥₹₽¢\$,\s]/g, '') // Remove currency symbols and formatting
                .replace(/[^\d.]/g, '') // Keep only digits and decimal points
                .trim();
              
              // Ensure it's a valid number and reasonable price range
              const numPrice = parseFloat(price);
              if (!isNaN(numPrice) && numPrice > 0.50 && numPrice < 100000) {
                console.log(`Found valid price: ${numPrice}`);
                // Return the cleaned numeric price
                return numPrice.toFixed(2);
              }
            }
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
