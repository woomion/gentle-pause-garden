import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

interface SharedContent {
  url?: string;
  text?: string;
  title?: string;
}

// Helper to detect if a string is a valid URL
const isValidUrl = (text: string): boolean => {
  const trimmed = text.trim();
  if (!trimmed) return false;
  
  // Check for common URL patterns
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      new URL(trimmed);
      return true;
    } catch {
      return false;
    }
  }
  
  // Also allow www. prefixed URLs
  if (/^www\./i.test(trimmed)) {
    try {
      new URL(`https://${trimmed}`);
      return true;
    } catch {
      return false;
    }
  }
  
  return false;
};

export const useSharedContent = () => {
  const [sharedContent, setSharedContent] = useState<SharedContent | null>(null);
  const location = useLocation();
  const hasCheckedClipboard = useRef(false);
  const lastClipboardCheck = useRef<number>(0);

  // Check URL params for shared content (PWA share target)
  useEffect(() => {
    console.log('🔍 useSharedContent - Checking URL params:', location.search);
    const urlParams = new URLSearchParams(location.search);
    
    // Check for both the PWA share target params and our custom params
    const sharedUrl = urlParams.get('url') || urlParams.get('shared_url');
    const sharedText = urlParams.get('text') || urlParams.get('shared_text');
    const sharedTitle = urlParams.get('title') || urlParams.get('shared_title');

    console.log('🔍 useSharedContent - Found params:', { sharedUrl, sharedText, sharedTitle, locationSearch: location.search });

    if (sharedUrl || sharedText || sharedTitle) {
      const content = {
        url: sharedUrl || undefined,
        text: sharedText || undefined,
        title: sharedTitle || undefined,
      };
      console.log('📤 useSharedContent - Setting shared content:', content);
      setSharedContent(content);
      hasCheckedClipboard.current = true; // Don't check clipboard if we got URL params

      // Clean up URL parameters after processing
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('url');
      newUrl.searchParams.delete('text');
      newUrl.searchParams.delete('title');
      newUrl.searchParams.delete('shared_url');
      newUrl.searchParams.delete('shared_text');
      newUrl.searchParams.delete('shared_title');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [location.search]);

  // Auto-check clipboard on app open (only once per session or on focus after being away)
  useEffect(() => {
    const checkClipboardForUrl = async () => {
      // Don't check if we already have shared content from URL params
      if (sharedContent?.url) {
        console.log('📋 Skipping clipboard check - already have shared content');
        return;
      }

      // Rate limit clipboard checks (max once every 30 seconds)
      const now = Date.now();
      if (now - lastClipboardCheck.current < 30000) {
        console.log('📋 Skipping clipboard check - rate limited');
        return;
      }

      // Check if clipboard API is available
      if (!navigator.clipboard?.readText) {
        console.log('📋 Clipboard API not available');
        return;
      }

      try {
        // Only read clipboard if we have focus (required for security)
        if (!document.hasFocus()) {
          console.log('📋 Document not focused, skipping clipboard check');
          return;
        }

        console.log('📋 Checking clipboard for URLs...');
        lastClipboardCheck.current = now;
        
        const clipboardText = await navigator.clipboard.readText();
        
        if (clipboardText && isValidUrl(clipboardText)) {
          console.log('📋 Found URL in clipboard:', clipboardText.substring(0, 50) + '...');
          setSharedContent({
            url: clipboardText.trim(),
          });
        } else {
          console.log('📋 No URL found in clipboard');
        }
      } catch (error) {
        // Clipboard access denied or not available - this is expected in many cases
        console.log('📋 Could not read clipboard (permission denied or not available)');
      }
    };

    // Check on initial mount (small delay to ensure focus)
    const initialTimeout = setTimeout(() => {
      if (!hasCheckedClipboard.current) {
        hasCheckedClipboard.current = true;
        checkClipboardForUrl();
      }
    }, 500);

    // Also check when window regains focus (user coming back to app)
    const handleFocus = () => {
      console.log('📋 Window focused, checking clipboard...');
      checkClipboardForUrl();
    };

    // Check when app becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📋 App became visible, checking clipboard...');
        checkClipboardForUrl();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(initialTimeout);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sharedContent?.url]);

  // Also listen for the custom event from the webcontentshared listener
  useEffect(() => {
    const handleSharedContent = () => {
      console.log('🔄 Custom shared content event triggered, forcing re-check...');
      // Force a re-check by updating location search manually
      const urlParams = new URLSearchParams(window.location.search);
      const sharedUrl = urlParams.get('url') || urlParams.get('shared_url');
      const sharedText = urlParams.get('text') || urlParams.get('shared_text');
      const sharedTitle = urlParams.get('title') || urlParams.get('shared_title');

      if (sharedUrl || sharedText || sharedTitle) {
        const content = {
          url: sharedUrl || undefined,
          text: sharedText || undefined,
          title: sharedTitle || undefined,
        };
        console.log('📤 Custom event - Setting shared content:', content);
        setSharedContent(content);
      }
    };

    window.addEventListener('sharedContentReceived', handleSharedContent);
    return () => window.removeEventListener('sharedContentReceived', handleSharedContent);
  }, []);

  const clearSharedContent = () => {
    setSharedContent(null);
  };

  return {
    sharedContent,
    clearSharedContent
  };
};