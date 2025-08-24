interface ProductInfo {
  itemName?: string;
  storeName?: string;
  price?: string;
  priceCurrency?: string;
  imageUrl?: string;
  brand?: string;
  description?: string;
  canonicalUrl?: string;
}

export const parseProductUrl = async (url: string): Promise<ProductInfo> => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const result: ProductInfo = {
      storeName: extractStoreName(url),
      canonicalUrl: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || url
    };

    // Enhanced title extraction - try multiple strategies
    let itemName = '';
    
    // 1. Try h1 tag (most likely product name)
    const h1 = doc.querySelector('h1')?.textContent?.trim();
    if (h1 && h1.length < 200) {
      itemName = h1;
    }
    
    // 2. Try page title if h1 not found
    if (!itemName) {
      const title = doc.querySelector('title')?.textContent?.trim();
      if (title) {
        itemName = title.split(' | ')[0].split(' - ')[0].split(' – ')[0].trim();
      }
    }
    
    // 3. Try meta property og:title
    if (!itemName) {
      const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content');
      if (ogTitle) {
        itemName = ogTitle.trim();
      }
    }
    
    // 4. Try URL-based extraction as fallback
    if (!itemName) {
      const urlPath = new URL(url).pathname;
      const pathParts = urlPath.split('/').filter(part => part);
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart) {
        itemName = lastPart.replace(/-/g, ' ').replace(/_/g, ' ')
          .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      }
    }
    
    if (itemName) {
      result.itemName = itemName;
    }

    // Enhanced price extraction
    const priceSelectors = [
      '[data-price]',
      '.price',
      '.product-price', 
      '.cost',
      '.amount',
      '[class*="price"]',
      '[id*="price"]'
    ];
    
    let price = '';
    
    // Try specific selectors first
    for (const selector of priceSelectors) {
      const priceElement = doc.querySelector(selector);
      if (priceElement) {
        const priceText = priceElement.textContent?.trim();
        const priceMatch = priceText?.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (priceMatch) {
          price = priceMatch[1].replace(/,/g, '');
          break;
        }
      }
    }
    
    // Fallback to body text search
    if (!price) {
      const bodyText = doc.body.textContent || '';
      const priceMatch = bodyText.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
      if (priceMatch) {
        price = priceMatch[1].replace(/,/g, '');
      }
    }
    
    if (price) {
      result.price = price;
      result.priceCurrency = 'USD';
    }

    // Enhanced image extraction
    const imageSelectors = [
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      '.product-image img',
      '.product-photo img',
      '[class*="product"] img',
      '[class*="main"] img',
      'img[src*="product"]',
      'img[alt*="product"]'
    ];
    
    for (const selector of imageSelectors) {
      const imgElement = doc.querySelector(selector);
      if (imgElement) {
        const imgSrc = imgElement.getAttribute('content') || imgElement.getAttribute('src');
        if (imgSrc && imgSrc.startsWith('http')) {
          result.imageUrl = imgSrc;
          break;
        }
      }
    }

    return result;
  } catch (error) {
    console.error('Simple parser failed:', error);
    
    // URL-based fallback
    const urlPath = new URL(url).pathname;
    const pathParts = urlPath.split('/').filter(part => part);
    const lastPart = pathParts[pathParts.length - 1];
    const fallbackName = lastPart ? 
      lastPart.replace(/-/g, ' ').replace(/_/g, ' ')
        .split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') 
      : 'Product';
      
    return {
      storeName: extractStoreName(url),
      itemName: fallbackName
    };
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