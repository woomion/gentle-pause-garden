interface ProductInfo {
  itemName?: string;
  storeName?: string;
  price?: string;
  priceCurrency?: string;
  imageUrl?: string;
  brand?: string;
}

// Simple fallback parser for when everything else fails
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
      storeName: extractStoreName(url)
    };

    // Basic title extraction
    const title = doc.querySelector('title')?.textContent?.trim();
    if (title) {
      result.itemName = title.split(' | ')[0].split(' - ')[0].trim();
    }

    // Basic meta description fallback
    if (!result.itemName) {
      const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content');
      if (metaDesc && metaDesc.length > 10) {
        result.itemName = metaDesc.split('.')[0].trim();
      }
    }

    // Basic price extraction
    const priceText = doc.body.textContent || '';
    const priceMatch = priceText.match(/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (priceMatch) {
      result.price = priceMatch[1].replace(/,/g, '');
      result.priceCurrency = 'USD';
    }

    return result;
  } catch (error) {
    console.error('Simple parser failed:', error);
    return {
      storeName: extractStoreName(url),
      itemName: new URL(url).pathname.split('/').pop()?.replace(/-/g, ' ') || 'Product'
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