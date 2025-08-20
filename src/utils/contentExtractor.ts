interface ContentInfo {
  title?: string;
  description?: string;
  content?: string;
  type: 'product' | 'article' | 'unknown';
  confidence: number;
}

// Enhanced content extraction using readability-like algorithms
export const extractContent = (doc: Document, url: string): ContentInfo => {
  const result: ContentInfo = {
    type: 'unknown',
    confidence: 0
  };

  // Detect content type
  const contentType = detectContentType(doc, url);
  result.type = contentType;

  // Extract title with multiple strategies
  result.title = extractTitle(doc);
  
  // Extract description
  result.description = extractDescription(doc);
  
  // Extract main content if it's an article
  if (contentType === 'article') {
    result.content = extractMainContent(doc);
    result.confidence = 0.8;
  } else if (contentType === 'product') {
    result.confidence = 0.9;
  } else {
    result.confidence = 0.3;
  }

  return result;
};

const detectContentType = (doc: Document, url: string): 'product' | 'article' | 'unknown' => {
  // Check for product indicators
  const productSignals = [
    'add to cart', 'buy now', 'add to bag', 'purchase',
    'price', '$', 'USD', 'EUR', 'GBP', 'product',
    'sku', 'item', 'availability', 'in stock'
  ];
  
  const articleSignals = [
    'article', 'blog', 'news', 'post', 'story',
    'author', 'published', 'read more', 'share'
  ];

  const bodyText = (doc.body?.textContent || '').toLowerCase();
  const urlPath = url.toLowerCase();

  // Check JSON-LD for definitive type
  const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse(script.textContent || '');
      const type = data['@type'] || (Array.isArray(data) ? data[0]?.['@type'] : '');
      
      if (type === 'Product') return 'product';
      if (['Article', 'BlogPosting', 'NewsArticle'].includes(type)) return 'article';
    } catch (e) {
      // Continue checking other signals
    }
  }

  // Check meta tags
  const ogType = doc.querySelector('meta[property="og:type"]')?.getAttribute('content');
  if (ogType === 'product' || ogType === 'product.item') return 'product';
  if (ogType === 'article') return 'article';

  // URL pattern matching
  if (/\/product\/|\/item\/|\/p\/|\/shop\//.test(urlPath)) return 'product';
  if (/\/blog\/|\/article\/|\/news\/|\/post\//.test(urlPath)) return 'article';

  // Content analysis
  const productScore = productSignals.reduce((score, signal) => 
    bodyText.includes(signal) ? score + 1 : score, 0);
  const articleScore = articleSignals.reduce((score, signal) => 
    bodyText.includes(signal) ? score + 1 : score, 0);

  if (productScore > articleScore && productScore > 2) return 'product';
  if (articleScore > productScore && articleScore > 2) return 'article';

  return 'unknown';
};

const extractTitle = (doc: Document): string | undefined => {
  // Priority order for title extraction
  const titleSelectors = [
    'h1[data-testid*="title"]',
    'h1[class*="title"]',
    'h1[class*="name"]',
    'h1[class*="product"]',
    '[data-testid*="product-name"]',
    '[data-testid*="title"]',
    'h1',
    '.product-title',
    '.item-title',
    '.article-title',
    'title'
  ];

  for (const selector of titleSelectors) {
    const element = doc.querySelector(selector);
    if (element?.textContent?.trim()) {
      const text = element.textContent.trim();
      if (text.length > 5 && text.length < 200) {
        return cleanTitle(text);
      }
    }
  }

  // Fallback to meta title
  const metaTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                   doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
                   doc.title;

  return metaTitle ? cleanTitle(metaTitle) : undefined;
};

const extractDescription = (doc: Document): string | undefined => {
  const descSelectors = [
    'meta[name="description"]',
    'meta[property="og:description"]',
    'meta[name="twitter:description"]',
    '[data-testid*="description"]',
    '.product-description',
    '.item-description',
    '.article-summary',
    '.excerpt'
  ];

  for (const selector of descSelectors) {
    const element = doc.querySelector(selector);
    const content = element?.getAttribute('content') || element?.textContent;
    if (content?.trim() && content.length > 20 && content.length < 500) {
      return content.trim();
    }
  }

  return undefined;
};

const extractMainContent = (doc: Document): string | undefined => {
  // Readability-like content extraction for articles
  const contentSelectors = [
    'article',
    '[role="main"]',
    '.content',
    '.article-content',
    '.post-content',
    '.entry-content',
    'main'
  ];

  for (const selector of contentSelectors) {
    const element = doc.querySelector(selector);
    if (element) {
      // Clean up the content
      const clone = element.cloneNode(true) as Element;
      
      // Remove unwanted elements
      const unwantedSelectors = [
        'script', 'style', 'nav', 'header', 'footer',
        '.ad', '.advertisement', '.social-share',
        '.comments', '.sidebar'
      ];
      
      unwantedSelectors.forEach(sel => {
        clone.querySelectorAll(sel).forEach(el => el.remove());
      });

      const text = clone.textContent?.trim();
      if (text && text.length > 100) {
        return text.substring(0, 1000); // Limit content length
      }
    }
  }

  return undefined;
};

const cleanTitle = (title: string): string => {
  // Remove common suffixes and clean up
  return title
    .split(' | ')[0]
    .split(' - ')[0]
    .split(' – ')[0]
    .replace(/\s+/g, ' ')
    .trim();
};

// Currency detection beyond USD
export const detectCurrency = (text: string, countryCode?: string): string => {
  const currencyPatterns = [
    { pattern: /\$/, currency: 'USD' },
    { pattern: /€|EUR/i, currency: 'EUR' },
    { pattern: /£|GBP/i, currency: 'GBP' },
    { pattern: /¥|JPY/i, currency: 'JPY' },
    { pattern: /₹|INR/i, currency: 'INR' },
    { pattern: /CAD|C\$/i, currency: 'CAD' },
    { pattern: /AUD|A\$/i, currency: 'AUD' },
    { pattern: /CHF/i, currency: 'CHF' },
    { pattern: /SEK|kr/i, currency: 'SEK' },
    { pattern: /NOK/i, currency: 'NOK' },
    { pattern: /DKK/i, currency: 'DKK' }
  ];

  for (const { pattern, currency } of currencyPatterns) {
    if (pattern.test(text)) {
      return currency;
    }
  }

  // Fallback based on URL or default
  if (countryCode) {
    const countryToCurrency: Record<string, string> = {
      'uk': 'GBP', 'gb': 'GBP', 'de': 'EUR', 'fr': 'EUR',
      'it': 'EUR', 'es': 'EUR', 'jp': 'JPY', 'in': 'INR',
      'ca': 'CAD', 'au': 'AUD', 'ch': 'CHF', 'se': 'SEK',
      'no': 'NOK', 'dk': 'DKK'
    };
    return countryToCurrency[countryCode.toLowerCase()] || 'USD';
  }

  return 'USD';
};