import { useState, useCallback } from 'react';

// Enhanced URL shortener detection and expansion
const SHORTENER_DOMAINS = [
  'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'short.link',
  'ow.ly', 'buff.ly', 'rebrand.ly', 'is.gd', 'v.gd',
  'amzn.to', 'etsy.me', 'ebay.to', 'target.com/p'
];

export const useUrlShortener = () => {
  const [isExpanding, setIsExpanding] = useState(false);

  const isShortUrl = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return SHORTENER_DOMAINS.some(domain => 
        urlObj.hostname.includes(domain) || 
        urlObj.hostname === domain
      );
    } catch {
      return false;
    }
  }, []);

  const expandUrl = useCallback(async (shortUrl: string): Promise<string> => {
    if (!isShortUrl(shortUrl)) {
      return shortUrl;
    }

    setIsExpanding(true);
    try {
      // Use a simple fetch with redirect to get the final URL
      const response = await fetch(shortUrl, {
        method: 'HEAD',
        redirect: 'follow'
      });
      
      const expandedUrl = response.url;
      console.log('🔗 Expanded URL:', shortUrl, '→', expandedUrl);
      return expandedUrl;
    } catch (error) {
      console.warn('Failed to expand URL:', shortUrl, error);
      return shortUrl;
    } finally {
      setIsExpanding(false);
    }
  }, [isShortUrl]);

  return {
    isShortUrl,
    expandUrl,
    isExpanding
  };
};