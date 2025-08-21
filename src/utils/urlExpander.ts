interface ExpandResult {
  success: boolean;
  finalUrl: string;
  redirectChain: string[];
  error?: string;
}

// Common URL shortener domains that should be expanded
const SHORTENER_DOMAINS = [
  'a.co',           // Amazon
  'amzn.to',        // Amazon
  'bit.ly',         // Bitly
  'tinyurl.com',    // TinyURL
  'short.link',     // Generic
  'ow.ly',          // Hootsuite
  't.co',           // Twitter
  'goo.gl',         // Google (deprecated but still in use)
  'youtu.be',       // YouTube
];

// Amazon-specific patterns that might need expansion
const AMAZON_PATTERNS = [
  /amazon\.com\/gp\/aw\/d\//,     // Mobile Amazon links
  /amazon\.com\/dp\/redirect/,    // Amazon redirects
  /smile\.amazon\.com/,          // Amazon Smile
];

const isShortenerDomain = (url: string): boolean => {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    return SHORTENER_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain));
  } catch {
    return false;
  }
};

const isAmazonRedirect = (url: string): boolean => {
  return AMAZON_PATTERNS.some(pattern => pattern.test(url));
};

/**
 * Expands a shortened URL by following redirects
 * Returns the final destination URL along with the redirect chain
 */
export const expandUrl = async (url: string, maxRedirects = 10): Promise<ExpandResult> => {
  const redirectChain: string[] = [url];
  let currentUrl = url;
  let redirectCount = 0;

  // Check if this URL needs expansion
  if (!isShortenerDomain(url) && !isAmazonRedirect(url)) {
    return {
      success: true,
      finalUrl: url,
      redirectChain,
    };
  }

  try {
    while (redirectCount < maxRedirects) {
      console.log(`🔗 Expanding URL (attempt ${redirectCount + 1}): ${currentUrl}`);

      const response = await fetch(currentUrl, {
        method: 'HEAD', // Use HEAD to avoid downloading content
        redirect: 'manual', // Handle redirects manually
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Check for redirect response codes
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('Location');
        if (!location) {
          console.warn('❌ Redirect response without Location header');
          break;
        }

        // Handle relative redirects
        const nextUrl = location.startsWith('http') 
          ? location 
          : new URL(location, currentUrl).toString();

        redirectChain.push(nextUrl);
        currentUrl = nextUrl;
        redirectCount++;

        console.log(`↪️ Redirected to: ${nextUrl}`);
      } else if (response.status === 200) {
        // Successful response, we've reached the final URL
        console.log(`✅ Final URL reached: ${currentUrl}`);
        break;
      } else {
        console.warn(`❌ Unexpected response status: ${response.status}`);
        return {
          success: false,
          finalUrl: url,
          redirectChain,
          error: `HTTP ${response.status} - ${response.statusText}`
        };
      }
    }

    if (redirectCount >= maxRedirects) {
      console.warn(`❌ Maximum redirects (${maxRedirects}) exceeded`);
      return {
        success: false,
        finalUrl: currentUrl,
        redirectChain,
        error: 'Maximum redirects exceeded'
      };
    }

    console.log(`🎯 URL expansion complete. Final URL: ${currentUrl}`);
    return {
      success: true,
      finalUrl: currentUrl,
      redirectChain,
    };

  } catch (error) {
    console.error('❌ Error expanding URL:', error);
    return {
      success: false,
      finalUrl: url,
      redirectChain,
      error: error instanceof Error ? error.message : 'Network error during URL expansion'
    };
  }
};

/**
 * Utility to check if a URL is likely to be an Amazon product page
 * after expansion
 */
export const isAmazonProductUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace(/^www\./, '').toLowerCase();
    
    // Check for Amazon domains
    if (!hostname.includes('amazon.')) {
      return false;
    }

    // Check for product page patterns
    const pathname = urlObj.pathname.toLowerCase();
    return pathname.includes('/dp/') || 
           pathname.includes('/gp/product/') || 
           pathname.includes('/gp/aw/d/') ||
           pathname.includes('/product/');
  } catch {
    return false;
  }
};