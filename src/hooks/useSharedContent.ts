import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface SharedContent {
  url?: string;
  text?: string;
  title?: string;
}

export const useSharedContent = () => {
  const [sharedContent, setSharedContent] = useState<SharedContent | null>(null);
  const location = useLocation();

  useEffect(() => {
    console.log('🔍 useSharedContent - Checking URL params:', location.search);
    const urlParams = new URLSearchParams(location.search);
    
    // Check for both the PWA share target params and our custom params
    const sharedUrl = urlParams.get('url') || urlParams.get('shared_url');
    const sharedText = urlParams.get('text') || urlParams.get('shared_text');
    const sharedTitle = urlParams.get('title') || urlParams.get('shared_title');

    console.log('🔍 useSharedContent - Found params:', { sharedUrl, sharedText, sharedTitle });

    if (sharedUrl || sharedText || sharedTitle) {
      const content = {
        url: sharedUrl || undefined,
        text: sharedText || undefined,
        title: sharedTitle || undefined,
      };
      console.log('📤 useSharedContent - Setting shared content:', content);
      setSharedContent(content);

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