interface ProductInfo {
  itemName?: string;
  storeName?: string;
  price?: string;
  priceCurrency?: string;
  imageUrl?: string;
  brand?: string;
  availability?: string;
  description?: string;
  canonicalUrl?: string;
}

// Enhanced parser using Firecrawl extract mode
export const parseProductUrl = async (url: string): Promise<ProductInfo> => {
  try {
    console.log('🔍 Enhanced parser: Starting Firecrawl extract for', url);
    
    // Use Firecrawl extract mode with enhanced product schema
    const extractSchema = {
      type: "object",
      properties: {
        itemName: {
          type: "string",
          description: "The full product name or title, excluding store name"
        },
        price: {
          type: "string", 
          description: "Current selling price as a number (e.g. '299.99', '45.00') - extract only the numeric value without currency symbols"
        },
        originalPrice: {
          type: "string",
          description: "Original price before discount if different from current price"
        },
        priceCurrency: {
          type: "string",
          description: "Currency code (USD, EUR, GBP, etc.) or currency symbol ($, €, £)"
        },
        imageUrl: {
          type: "string",
          description: "Main high-resolution product image URL - the primary product photo displayed prominently"
        },
        brand: {
          type: "string",
          description: "Brand or manufacturer name of the product"
        },
        description: {
          type: "string",
          description: "Product description or key features"
        },
        availability: {
          type: "string",
          description: "Stock status (In Stock, Out of Stock, Limited, etc.)"
        },
        category: {
          type: "string",
          description: "Product category or type"
        }
      },
      required: ["itemName"]
    };

    const response = await fetch('/functions/v1/firecrawl-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        mode: 'extract',
        schema: extractSchema,
        prompt: 'Extract detailed product information including name, price, image, and other relevant details from this e-commerce page.'
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawl request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('🔍 Enhanced parser: Firecrawl extract result:', data);

    if (data.extracted) {
      const result: ProductInfo = {
        storeName: extractStoreName(url),
        canonicalUrl: url,
        ...data.extracted
      };

      // Clean and validate the results
      cleanAndValidateResult(result);
      
      console.log('🔍 Enhanced parser: Final result:', result);
      return result;
    } else {
      throw new Error('No data extracted');
    }
  } catch (error) {
    console.error('🔍 Enhanced parser failed:', error);
    return {
      storeName: extractStoreName(url),
      itemName: undefined
    };
  }
};

const extractFromJsonLd = async (doc: Document, result: ProductInfo) => {
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  
  for (const script of scripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      const items = Array.isArray(data) ? data : [data];
      
      for (const item of items) {
        if (item['@type'] === 'Product' || (Array.isArray(item['@type']) && item['@type'].includes('Product'))) {
          if (item.name && !result.itemName) result.itemName = item.name;
          if (item.brand?.name && !result.brand) result.brand = item.brand.name;
          
          // Handle offers
          const offers = Array.isArray(item.offers) ? item.offers : [item.offers].filter(Boolean);
          for (const offer of offers) {
            if (offer?.price && !result.price) {
              result.price = String(offer.price);
              result.priceCurrency = offer.priceCurrency || 'USD';
            }
            if (offer?.availability && !result.availability) {
              const availability = offer.availability.replace('https://schema.org/', '');
              result.availability = availability;
            }
          }
          
          // Handle images
          if (item.image && !result.imageUrl) {
            const imageData = Array.isArray(item.image) ? item.image[0] : item.image;
            result.imageUrl = typeof imageData === 'string' ? imageData : imageData?.url;
          }
        }
      }
    } catch (error) {
      continue; // Skip invalid JSON-LD
    }
  }
};

const extractFromOpenGraph = (doc: Document, result: ProductInfo, url: string) => {
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

  if (!result.price) {
    const ogPrice = doc.querySelector('meta[property="product:price:amount"]')?.getAttribute('content');
    const ogCurrency = doc.querySelector('meta[property="product:price:currency"]')?.getAttribute('content');
    if (ogPrice) {
      result.price = ogPrice;
      result.priceCurrency = ogCurrency || 'USD';
    }
  }
};

const extractFromSelectors = (doc: Document, result: ProductInfo, url: string) => {
  // Enhanced title selectors
  if (!result.itemName) {
    const titleSelectors = [
      'h1[itemprop="name"]',
      'h1[class*="product"][class*="title"]',
      'h1[class*="product"][class*="name"]',
      'h1[data-testid*="title"]',
      'h1[data-testid*="name"]',
      '.product-title h1',
      '.product-name h1',
      'h1.product-title',
      'h1.product-name',
      'h1'
    ];
    
    for (const selector of titleSelectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent?.trim() && element.textContent.length > 3) {
        result.itemName = element.textContent.trim();
        break;
      }
    }
  }

  // Enhanced price selectors
  if (!result.price) {
    const priceSelectors = [
      '[itemprop="price"]',
      '[data-testid*="price"]:not([data-testid*="original"])',
      '.price:not(.original-price):not(.was-price)',
      '[class*="current-price"]',
      '[class*="sale-price"]',
      '[id*="price"]:not([id*="original"])',
      '.product-price .current',
      '.price-current'
    ];
    
    for (const selector of priceSelectors) {
      const element = doc.querySelector(selector);
      if (element?.textContent) {
        const priceMatch = element.textContent.match(/[\$€£¥₹]?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (priceMatch) {
          result.price = priceMatch[1].replace(/,/g, '');
          result.priceCurrency = detectCurrency(element.textContent) || 'USD';
          break;
        }
      }
    }
  }

  // Enhanced image selectors
  if (!result.imageUrl) {
    const imageSelectors = [
      'img[itemprop="image"]',
      '.product-image img[src]:not([src*="placeholder"]):not([src*="loading"])',
      '.hero-image img[src]',
      'img[data-testid*="product"]:not([src*="placeholder"])',
      '.main-image img[src]',
      'img[alt*="product" i][src]'
    ];
    
    for (const selector of imageSelectors) {
      const img = doc.querySelector(selector) as HTMLImageElement;
      if (img?.src && !img.src.includes('placeholder') && !img.src.includes('loading')) {
        try {
          result.imageUrl = new URL(img.src, url).toString();
          break;
        } catch {
          result.imageUrl = img.src;
          break;
        }
      }
    }
  }
};

const extractFromMicrodata = (doc: Document, result: ProductInfo) => {
  if (!result.itemName) {
    const nameElement = doc.querySelector('[itemprop="name"]');
    if (nameElement?.textContent?.trim()) {
      result.itemName = nameElement.textContent.trim();
    }
  }

  if (!result.brand) {
    const brandElement = doc.querySelector('[itemprop="brand"]');
    if (brandElement?.textContent?.trim()) {
      result.brand = brandElement.textContent.trim();
    }
  }
};

const detectCurrency = (text: string): string => {
  if (text.includes('$')) return 'USD';
  if (text.includes('€')) return 'EUR';
  if (text.includes('£')) return 'GBP';
  if (text.includes('¥')) return 'JPY';
  if (text.includes('₹')) return 'INR';
  return 'USD';
};

const cleanAndValidateResult = (result: ProductInfo) => {
  // Clean item name
  if (result.itemName) {
    result.itemName = result.itemName
      .replace(/\s+/g, ' ')
      .replace(/[|–—-]\s*[^|–—-]*$/, '')
      .trim();
    
    // Remove store name from title if it appears at the end
    if (result.storeName && result.itemName.toLowerCase().endsWith(result.storeName.toLowerCase())) {
      result.itemName = result.itemName.slice(0, -result.storeName.length).trim();
    }
  }

  // Validate image URL
  if (result.imageUrl) {
    try {
      new URL(result.imageUrl);
    } catch {
      delete result.imageUrl;
    }
  }

  // Clean price
  if (result.price) {
    const cleaned = result.price.replace(/[^\d.]/g, '');
    if (cleaned && !isNaN(parseFloat(cleaned))) {
      result.price = cleaned;
    } else {
      delete result.price;
    }
  }
};

const extractStoreName = (url: string): string => {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    const parts = hostname.split('.');
    const domain = parts[parts.length - 2] || hostname;
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Unknown Store';
  }
};