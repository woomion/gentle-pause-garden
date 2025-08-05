// UrlData interface for URL parsing results
export interface UrlData {
  url: string;
  title?: string;
  price?: string;
  imageUrl?: string;
  description?: string;
  itemName?: string;
  storeName?: string;
}

// Enhanced price extraction with multiple strategies and extensive debugging
const extractPriceFromText = (text: string): string | undefined => {
  if (!text || typeof text !== 'string') {
    console.log('💰 No text provided for price extraction');
    return undefined;
  }
  
  console.log('💰 Extracting price from text:', text.substring(0, 200));
  
  // Clean the text first
  const cleanText = text.replace(/\s+/g, ' ').trim();
  
  // Multiple comprehensive price pattern strategies
  const pricePatterns = [
    // Currency symbol before number (USD, EUR, etc.)
    /(?:[\$£€¥₹₩¢₽₴₪₦₨₡₵₸₻₼₯₰₱₲₳₵₶₷₸₹₺₻₼₽₾₿])\s*(\d{1,4}(?:[,.\s]\d{3})*(?:[.,]\d{2})?)/gi,
    // Currency symbol after number
    /(\d{1,4}(?:[,.\s]\d{3})*(?:[.,]\d{2})?)\s*(?:[\$£€¥₹₩¢₽₴₪₦₨₡₵₸₻₼₯₰₱₲₳₵₶₷₸₹₺₻₼₽₾₿])/gi,
    // European format (comma as decimal separator)
    /(\d{1,4}(?:\.\d{3})*,\d{2})/g,
    // Standard decimal format
    /\b(\d{1,4}[.,]\d{2})\b/g,
    // Currency codes after numbers
    /(\d{1,4}(?:[,.\s]\d{3})*(?:[.,]\d{2})?)\s*(?:USD|EUR|GBP|CAD|AUD|JPY|CHF|SEK|NOK|DKK|PLN|CZK|HUF|BGN|RON|HRK|RSD|BAM|MKD|ALL|ISK|RUB|UAH|BYN|MDL|GEL|AMD|AZN|KZT|UZS|KGS|TJS|TMT|AFN|PKR|INR|LKR|NPR|BTN|BDT|MVR|MMK|LAK|KHR|VND|THB|MYR|BND|SGD|IDR|PHP|CNY|HKD|MOP|TWD|KRW|JPY|MNT)/gi,
    // Currency codes before numbers
    /(?:USD|EUR|GBP|CAD|AUD|JPY|CHF|SEK|NOK|DKK|PLN|CZK|HUF|BGN|RON|HRK|RSD|BAM|MKD|ALL|ISK|RUB|UAH|BYN|MDL|GEL|AMD|AZN|KZT|UZS|KGS|TJS|TMT|AFN|PKR|INR|LKR|NPR|BTN|BDT|MVR|MMK|LAK|KHR|VND|THB|MYR|BND|SGD|IDR|PHP|CNY|HKD|MOP|TWD|KRW|JPY|MNT)\s*(\d{1,4}(?:[,.\s]\d{3})*(?:[.,]\d{2})?)/gi,
    // Just numbers that look like prices (more permissive)
    /\b(\d{1,5}\.\d{2})\b/g,
    // Even more permissive number patterns
    /\b(\d{1,4})\.\d{2}\b/g
  ];
  
  for (let i = 0; i < pricePatterns.length; i++) {
    const pattern = pricePatterns[i];
    const matches = [...cleanText.matchAll(pattern)];
    
    console.log(`💰 Pattern ${i + 1}: Found ${matches.length} matches`);
    
    for (const match of matches) {
      const rawPrice = match[1] || match[0];
      let price = rawPrice.replace(/\s/g, '');
      
      console.log('💰 Raw price match:', rawPrice, '→ cleaned:', price);
      
      // Handle different number formats
      if (price.includes(',') && price.includes('.')) {
        const lastComma = price.lastIndexOf(',');
        const lastDot = price.lastIndexOf('.');
        if (lastComma > lastDot) {
          // Comma is decimal separator (European style)
          price = price.replace(/\./g, '').replace(',', '.');
        } else {
          // Dot is decimal separator (US style)
          price = price.replace(/,/g, '');
        }
      } else if (price.includes(',') && !price.includes('.')) {
        const commaIndex = price.lastIndexOf(',');
        const afterComma = price.substring(commaIndex + 1);
        if (afterComma.length === 2) {
          // Comma as decimal separator
          price = price.replace(',', '.');
        } else {
          // Comma as thousands separator
          price = price.replace(/,/g, '');
        }
      }
      
      // Remove any remaining non-numeric characters except decimal point
      price = price.replace(/[^\d.]/g, '');
      const numPrice = parseFloat(price);
      
      console.log('💰 Final numeric value:', numPrice);
      
      if (!isNaN(numPrice) && numPrice >= 0.01 && numPrice <= 999999) {
        const finalPrice = numPrice.toFixed(2);
        console.log('✅ Valid price found:', finalPrice);
        return finalPrice;
      }
    }
  }
  
  console.log('❌ No valid price found in text');
  return undefined;
};

// Comprehensive price extraction with multiple strategies
const extractPrice = (doc: Document): string | undefined => {
  console.log('💰 🚀 Starting COMPREHENSIVE price extraction...');
  
  const currentUrl = doc.location?.href || window.location.href || '';
  const hostname = currentUrl ? new URL(currentUrl).hostname.toLowerCase() : '';
  
  console.log('🔍 URL:', currentUrl);
  console.log('🏠 Hostname:', hostname);
  
  // Strategy 1: Meta tags (most reliable)
  console.log('💰 📋 Strategy 1: Meta tags...');
  const metaSelectors = [
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    'meta[property="product:price"]',
    'meta[name="price"]',
    'meta[property="price"]',
    'meta[itemprop="price"]',
    'meta[property="product:price:currency"]',
    'meta[name="twitter:data1"]'
  ];
  
  for (const selector of metaSelectors) {
    const meta = doc.querySelector(selector);
    if (meta) {
      const content = meta.getAttribute('content');
      console.log(`💰 Meta "${selector}":`, content);
      if (content) {
        const price = extractPriceFromText(content);
        if (price) {
          console.log('✅ Price from meta tag:', price);
          return price;
        }
      }
    }
  }
  
  // Strategy 2: JSON-LD structured data
  console.log('💰 📊 Strategy 2: JSON-LD...');
  const jsonScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  console.log(`💰 Found ${jsonScripts.length} JSON-LD scripts`);
  
  for (let i = 0; i < jsonScripts.length; i++) {
    const script = jsonScripts[i];
    try {
      const data = JSON.parse(script.textContent || '');
      console.log(`💰 JSON-LD ${i + 1}:`, typeof data, Object.keys(data).slice(0, 5));
      
      // Recursive price finder
      const findPrice = (obj: any, path = ''): string | undefined => {
        if (typeof obj !== 'object' || obj === null) return undefined;
        
        // Direct price fields
        const priceFields = ['price', 'lowPrice', 'highPrice', 'priceRange', 'amount', 'value'];
        for (const field of priceFields) {
          if (obj[field] !== undefined) {
            console.log(`💰 Found ${path}.${field}:`, obj[field]);
            const priceStr = obj[field].toString();
            const price = extractPriceFromText(priceStr);
            if (price) return price;
          }
        }
        
        // Check offers
        if (obj.offers) {
          if (Array.isArray(obj.offers)) {
            for (let j = 0; j < obj.offers.length; j++) {
              const price = findPrice(obj.offers[j], `${path}.offers[${j}]`);
              if (price) return price;
            }
          } else {
            const price = findPrice(obj.offers, `${path}.offers`);
            if (price) return price;
          }
        }
        
        // Recursively search other objects
        for (const key in obj) {
          if (typeof obj[key] === 'object' && key !== 'offers') {
            const price = findPrice(obj[key], `${path}.${key}`);
            if (price) return price;
          }
        }
        
        return undefined;
      };
      
      const jsonPrice = findPrice(data);
      if (jsonPrice) {
        console.log('✅ Price from JSON-LD:', jsonPrice);
        return jsonPrice;
      }
    } catch (e) {
      console.log(`💰 Failed to parse JSON-LD ${i + 1}:`, e);
    }
  }
  
  // Strategy 3: Site-specific optimized extraction
  console.log('💰 🎯 Strategy 3: Site-specific...');
  
  let siteSpecificSelectors: string[] = [];
  
  if (hostname.includes('smallable')) {
    console.log('🎯 Smallable detected!');
    siteSpecificSelectors = [
      '.ProductPrice',
      '.ProductPrice-current',
      '.product-price',
      '.product__price',
      '.price-current',
      '.price__current',
      '.current-price',
      '.formatted-price',
      '.final-price',
      '.sell-price',
      '.price-value',
      '.current-price-value',
      '.price',
      '.price-amount',
      '.money',
      '.amount',
      '[data-testid*="price"]',
      '[data-price]',
      '[class*="price"]:not([class*="was"]):not([class*="original"]):not([class*="old"])'
    ];
  } else if (hostname.includes('amazon')) {
    siteSpecificSelectors = [
      '.a-price-whole',
      '.a-price .a-offscreen',
      '#priceblock_dealprice',
      '#priceblock_saleprice',
      '#price_inside_buybox',
      '.a-price-range'
    ];
  } else if (hostname.includes('etsy')) {
    siteSpecificSelectors = [
      '[data-testid="price-current"]',
      '.currency-value',
      '.shop2-listing-price .currency-value',
      '.listing-page-price .currency-value',
      'p.wt-text-title-03'
    ];
  } else if (hostname.includes('shopify') || doc.querySelector('meta[name="generator"][content*="Shopify"]')) {
    siteSpecificSelectors = [
      '.price--highlight .price-item--regular',
      '.price--highlight .price-item--sale',
      '.price .price-item',
      '.product__price .price',
      '.product-price-value',
      '[data-product-price]'
    ];
  } else {
    // Generic comprehensive selectors
    siteSpecificSelectors = [
      '[data-testid*="price"]',
      '[data-testid*="Price"]',
      '.price-current',
      '.current-price',
      '.price',
      '.product-price',
      '.price-value',
      '.final-price',
      '.sale-price',
      '.regular-price',
      '.price-now',
      '.amount',
      '.money',
      '.cost'
    ];
  }
  
  console.log(`💰 Using ${siteSpecificSelectors.length} site-specific selectors`);
  
  for (const selector of siteSpecificSelectors) {
    const elements = doc.querySelectorAll(selector);
    console.log(`💰 "${selector}": ${elements.length} elements`);
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      let text = '';
      
      if (element.tagName === 'META') {
        text = element.getAttribute('content') || '';
      } else if (element.hasAttribute('data-price')) {
        text = element.getAttribute('data-price') || '';
      } else {
        text = element.textContent?.trim() || '';
      }
      
      console.log(`💰 Element ${i + 1} text:`, text.substring(0, 100));
      
      if (text) {
        const price = extractPriceFromText(text);
        if (price) {
          console.log('✅ Site-specific price found:', price);
          return price;
        }
      }
    }
  }
  
  // Strategy 4: Generic comprehensive DOM search
  console.log('💰 🔍 Strategy 4: Comprehensive DOM...');
  
  // Find all elements that might contain prices
  const priceElements = doc.querySelectorAll('*');
  const potentialPriceElements: Element[] = [];
  
  for (const element of priceElements) {
    const className = element.className?.toString().toLowerCase() || '';
    const id = element.id?.toLowerCase() || '';
    const dataAttrs = Array.from(element.attributes)
      .filter(attr => attr.name.startsWith('data-'))
      .map(attr => attr.name.toLowerCase())
      .join(' ');
    
    const combinedText = `${className} ${id} ${dataAttrs}`;
    
    if (combinedText.includes('price') || 
        combinedText.includes('cost') || 
        combinedText.includes('amount') || 
        combinedText.includes('money') ||
        combinedText.includes('total') ||
        combinedText.includes('value')) {
      potentialPriceElements.push(element);
    }
  }
  
  console.log(`💰 Found ${potentialPriceElements.length} potential price elements`);
  
  for (let i = 0; i < Math.min(potentialPriceElements.length, 50); i++) {
    const element = potentialPriceElements[i];
    const text = element.textContent?.trim() || '';
    
    if (text && text.length < 100) { // Avoid large text blocks
      const price = extractPriceFromText(text);
      if (price) {
        console.log(`✅ Generic DOM price found in element ${i + 1}:`, price);
        return price;
      }
    }
  }
  
  // Strategy 5: Full page text analysis (last resort)
  console.log('💰 📄 Strategy 5: Full page text...');
  const pageText = doc.body?.textContent || '';
  
  // Look for various currency patterns in the entire page
  const currencyPatterns = [
    /\d{1,4}[.,]\d{2}\s*€/g,
    /€\s*\d{1,4}[.,]\d{2}/g,
    /\$\s*\d{1,4}[.,]\d{2}/g,
    /£\s*\d{1,4}[.,]\d{2}/g,
    /¥\s*\d{1,4}[.,]\d{2}/g,
    /\d{1,4}[.,]\d{2}\s*USD/gi,
    /\d{1,4}[.,]\d{2}\s*EUR/gi,
    /\d{1,4}[.,]\d{2}\s*GBP/gi
  ];
  
  for (const pattern of currencyPatterns) {
    const matches = pageText.match(pattern);
    if (matches && matches.length > 0) {
      console.log(`💰 Currency pattern matches:`, matches.slice(0, 5));
      
      for (const match of matches.slice(0, 10)) {
        const price = extractPriceFromText(match);
        if (price) {
          console.log('✅ Full page text price found:', price);
          return price;
        }
      }
    }
  }
  
  console.log('❌ No price found with any strategy');
  return undefined;
};

// Enhanced image extraction with comprehensive strategies
const extractImageUrl = (doc: Document, origin: string): string | undefined => {
  console.log('🖼️ 🚀 Starting COMPREHENSIVE image extraction...');
  
  const currentUrl = doc.location?.href || window.location.href || '';
  const hostname = currentUrl ? new URL(currentUrl).hostname.toLowerCase() : '';
  
  console.log('🔍 URL:', currentUrl);
  console.log('🏠 Hostname:', hostname);
  console.log('📸 Total images on page:', doc.querySelectorAll('img').length);
  
  // Strategy 1: Meta tags (most reliable)
  console.log('🖼️ 📋 Strategy 1: Meta tags...');
  const metaSelectors = [
    'meta[property="og:image"]',
    'meta[property="og:image:url"]',
    'meta[name="twitter:image"]',
    'meta[property="product:image"]',
    'meta[itemprop="image"]',
    'meta[name="thumbnail"]'
  ];
  
  for (const selector of metaSelectors) {
    const meta = doc.querySelector(selector);
    if (meta) {
      const content = meta.getAttribute('content');
      console.log(`🖼️ Meta "${selector}":`, content);
      if (content && content.trim() && !content.includes('data:image') && content.length > 10) {
        try {
          const imageUrl = new URL(content, origin).href;
          console.log('✅ Image from meta tag:', imageUrl);
          return imageUrl;
        } catch {
          if (content.startsWith('http')) {
            console.log('✅ Direct image URL from meta:', content);
            return content;
          }
        }
      }
    }
  }
  
  // Strategy 2: JSON-LD structured data
  console.log('🖼️ 📊 Strategy 2: JSON-LD...');
  const jsonScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  
  for (let i = 0; i < jsonScripts.length; i++) {
    try {
      const data = JSON.parse(jsonScripts[i].textContent || '');
      
      const findImage = (obj: any): string | undefined => {
        if (typeof obj !== 'object' || obj === null) return undefined;
        
        // Direct image fields
        if (obj.image) {
          const img = Array.isArray(obj.image) ? obj.image[0] : obj.image;
          const imgUrl = typeof img === 'string' ? img : img?.url;
          if (imgUrl) {
            console.log('🖼️ JSON-LD image found:', imgUrl);
            return imgUrl;
          }
        }
        
        // Search nested objects
        for (const key in obj) {
          if (typeof obj[key] === 'object') {
            const nestedImg = findImage(obj[key]);
            if (nestedImg) return nestedImg;
          }
        }
        
        return undefined;
      };
      
      const jsonImage = findImage(data);
      if (jsonImage) {
        console.log('✅ Image from JSON-LD:', jsonImage);
        return jsonImage;
      }
    } catch (e) {
      console.log(`🖼️ Failed to parse JSON-LD ${i + 1}:`, e);
    }
  }
  
  // Strategy 3: Site-specific image extraction
  console.log('🖼️ 🎯 Strategy 3: Site-specific...');
  
  let siteSpecificSelectors: string[] = [];
  
  if (hostname.includes('smallable')) {
    console.log('🎯 Smallable image extraction!');
    siteSpecificSelectors = [
      '.ProductGallery img',
      '.product-gallery img',
      '.product-image img',
      '.product__image img',
      '.main-image img',
      '.hero-image img',
      '.featured-image img',
      '.ProductImage img',
      '.media-wrapper img',
      '.picture img',
      '.photo img',
      '.image-container img',
      '.gallery img',
      '.product-photos img',
      '.product-media img',
      '[data-role="product-image"] img',
      '[data-testid*="image"] img',
      '[data-testid*="photo"] img',
      '.carousel img:first-child',
      '.swiper-slide img:first-child'
    ];
  } else if (hostname.includes('amazon')) {
    siteSpecificSelectors = [
      '#landingImage',
      '.a-dynamic-image',
      '#imgTagWrapperId img',
      '.imageBlockContainer img'
    ];
  } else if (hostname.includes('etsy')) {
    siteSpecificSelectors = [
      '[data-testid="listing-page-image"]',
      '.listing-page-image img',
      '.shop2-listing-image img'
    ];
  } else {
    // Generic comprehensive selectors
    siteSpecificSelectors = [
      '.product-image img',
      '.product__image img',
      '.main-image img',
      '.hero-image img',
      '.featured-image img',
      '.gallery img:first-child',
      '.product-gallery img:first-child',
      '.carousel img:first-child',
      '[data-testid*="image"] img',
      '[data-testid*="photo"] img'
    ];
  }
  
  console.log(`🖼️ Using ${siteSpecificSelectors.length} site-specific selectors`);
  
  for (const selector of siteSpecificSelectors) {
    const elements = doc.querySelectorAll(selector);
    console.log(`🖼️ "${selector}": ${elements.length} elements`);
    
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const src = element.getAttribute('src') || 
                  element.getAttribute('data-src') || 
                  element.getAttribute('data-lazy-src') ||
                  element.getAttribute('data-original') ||
                  element.getAttribute('data-srcset')?.split(' ')[0];
      
      console.log(`🖼️ Element ${i + 1} src:`, src);
      
      if (src && src.trim() && !src.includes('data:image') && src.length > 10) {
        // Skip obvious non-product images
        const srcLower = src.toLowerCase();
        if (srcLower.includes('logo') || 
            srcLower.includes('icon') || 
            srcLower.includes('banner') ||
            srcLower.includes('avatar') ||
            srcLower.includes('placeholder')) {
          console.log('🖼️ Skipping non-product image:', src);
          continue;
        }
        
        try {
          const imageUrl = new URL(src, origin).href;
          console.log('✅ Site-specific image found:', imageUrl);
          return imageUrl;
        } catch {
          if (src.startsWith('http')) {
            console.log('✅ Direct site-specific image URL:', src);
            return src;
          }
        }
      }
    }
  }
  
  // Strategy 4: Generic comprehensive image search
  console.log('🖼️ 🔍 Strategy 4: Comprehensive image search...');
  
  const allImages = doc.querySelectorAll('img');
  console.log(`🖼️ Analyzing ${allImages.length} images`);
  
  // Score images based on various factors
  const scoredImages: Array<{element: HTMLImageElement, score: number, src: string}> = [];
  
  for (const img of allImages) {
    const src = img.getAttribute('src') || 
                img.getAttribute('data-src') || 
                img.getAttribute('data-lazy-src') ||
                img.getAttribute('data-original');
    
    if (!src || src.includes('data:image') || src.length < 10) continue;
    
    let score = 0;
    const className = img.className?.toLowerCase() || '';
    const id = img.id?.toLowerCase() || '';
    const alt = img.getAttribute('alt')?.toLowerCase() || '';
    const srcLower = src.toLowerCase();
    
    // Positive scoring
    if (className.includes('product') || id.includes('product')) score += 10;
    if (className.includes('main') || id.includes('main')) score += 8;
    if (className.includes('hero') || id.includes('hero')) score += 8;
    if (className.includes('featured') || id.includes('featured')) score += 7;
    if (className.includes('image') || id.includes('image')) score += 5;
    if (alt.includes('product')) score += 5;
    
    // Size-based scoring
    const width = parseInt(img.getAttribute('width') || '0');
    const height = parseInt(img.getAttribute('height') || '0');
    if (width > 200 && height > 200) score += 5;
    if (width > 400 && height > 400) score += 3;
    
    // Negative scoring
    if (srcLower.includes('logo') || className.includes('logo')) score -= 10;
    if (srcLower.includes('icon') || className.includes('icon')) score -= 8;
    if (srcLower.includes('banner') || className.includes('banner')) score -= 8;
    if (srcLower.includes('avatar') || className.includes('avatar')) score -= 5;
    if (srcLower.includes('placeholder')) score -= 5;
    if (width < 100 || height < 100) score -= 3;
    
    scoredImages.push({element: img, score, src});
  }
  
  // Sort by score and try the best candidates
  scoredImages.sort((a, b) => b.score - a.score);
  
  console.log(`🖼️ Top 5 scored images:`, scoredImages.slice(0, 5).map(img => ({
    src: img.src.substring(0, 100),
    score: img.score
  })));
  
  for (let i = 0; i < Math.min(scoredImages.length, 10); i++) {
    const {src} = scoredImages[i];
    
    try {
      const imageUrl = new URL(src, origin).href;
      console.log(`✅ Scored image ${i + 1} selected:`, imageUrl);
      return imageUrl;
    } catch {
      if (src.startsWith('http')) {
        console.log(`✅ Direct scored image ${i + 1} URL:`, src);
        return src;
      }
    }
  }
  
  console.log('❌ No suitable image found');
  return undefined;
};

// Enhanced metadata extraction
const extractMetadata = (doc: Document): { title?: string; description?: string } => {
  console.log('📄 Extracting metadata...');
  
  // Title extraction with multiple strategies
  let title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
              doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
              doc.querySelector('title')?.textContent ||
              doc.querySelector('h1')?.textContent ||
              '';
  
  // Description extraction
  let description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                    doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
                    doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') ||
                    '';
  
  // Clean up title and description
  title = title.trim().substring(0, 200);
  description = description.trim().substring(0, 500);
  
  console.log('📄 Extracted title:', title);
  console.log('📄 Extracted description:', description.substring(0, 100));
  
  return { title: title || undefined, description: description || undefined };
};

// Main URL parsing function with enhanced error handling and retry logic
export const parseUrl = async (url: string): Promise<UrlData | null> => {
  console.log('🚀 Starting enhanced URL parsing for:', url);
  
  if (!url || typeof url !== 'string') {
    console.log('❌ Invalid URL provided');
    return null;
  }
  
  let finalUrl = url.trim();
  
  // Ensure URL has protocol
  if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = 'https://' + finalUrl;
  }
  
  console.log('🔗 Final URL to parse:', finalUrl);
  
  // Array of proxy services for robust fetching
  const proxyServices = [
    'https://api.allorigins.win/get?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://proxy.cors.sh/'
  ];
  
  let lastError: Error | null = null;
  
  // Try multiple proxy services
  for (let i = 0; i < proxyServices.length; i++) {
    const proxyUrl = proxyServices[i] + encodeURIComponent(finalUrl);
    
    try {
      console.log(`🌐 Attempt ${i + 1}: Fetching via ${proxyServices[i]}`);
      
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      let html: string;
      
      if (proxyServices[i].includes('allorigins')) {
        const data = await response.json();
        html = data.contents;
      } else {
        html = await response.text();
      }
      
      if (!html || html.trim().length < 100) {
        throw new Error('Empty or invalid HTML response');
      }
      
      console.log(`✅ Successfully fetched HTML (${html.length} chars)`);
      
      // Parse HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      if (!doc || !doc.body) {
        throw new Error('Failed to parse HTML document');
      }
      
      console.log('📄 HTML parsed successfully');
      
      // Extract data with comprehensive strategies
      const urlOrigin = new URL(finalUrl).origin;
      
      const price = extractPrice(doc);
      const imageUrl = extractImageUrl(doc, urlOrigin);
      const metadata = extractMetadata(doc);
      
      const result: UrlData = {
        url: finalUrl,
        title: metadata.title,
        price,
        imageUrl,
        description: metadata.description,
        itemName: metadata.title, // Use title as itemName for compatibility
        storeName: extractDomainName(finalUrl) // Use domain as storeName
      };
      
      console.log('🎉 Final extraction result:', {
        url: result.url,
        title: result.title,
        price: result.price,
        imageUrl: result.imageUrl ? result.imageUrl.substring(0, 100) + '...' : undefined,
        description: result.description ? result.description.substring(0, 100) + '...' : undefined
      });
      
      return result;
      
    } catch (error) {
      lastError = error as Error;
      console.log(`❌ Attempt ${i + 1} failed:`, error);
      
      // If this isn't the last attempt, continue to next proxy
      if (i < proxyServices.length - 1) {
        console.log(`🔄 Trying next proxy service...`);
        continue;
      }
    }
  }
  
  // If all proxy attempts failed, try direct fetch as last resort
  try {
    console.log('🎯 Final attempt: Direct fetch...');
    
    const response = await fetch(finalUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      
      const urlOrigin = new URL(finalUrl).origin;
      const price = extractPrice(doc);
      const imageUrl = extractImageUrl(doc, urlOrigin);
      const metadata = extractMetadata(doc);
      
      const result: UrlData = {
        url: finalUrl,
        title: metadata.title,
        price,
        imageUrl,
        description: metadata.description,
        itemName: metadata.title,
        storeName: extractDomainName(finalUrl)
      };
      
      console.log('🎉 Direct fetch success:', result);
      return result;
    }
  } catch (error) {
    console.log('❌ Direct fetch also failed:', error);
  }
  
  // Return partial data even if extraction failed
  console.log('⚠️ All attempts failed, returning minimal data');
  
  return {
    url: finalUrl,
    title: extractDomainName(finalUrl),
    price: undefined,
    imageUrl: undefined,
    description: undefined,
    itemName: extractDomainName(finalUrl),
    storeName: extractDomainName(finalUrl)
  };
};

// Helper function to extract domain name for fallback title
const extractDomainName = (url: string): string => {
  try {
    const domain = new URL(url).hostname;
    return domain.replace('www.', '').split('.')[0];
  } catch {
    return 'Unknown Site';
  }
};

// Backward compatibility export
export const parseProductUrl = parseUrl;