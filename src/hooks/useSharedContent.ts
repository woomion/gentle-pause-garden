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
    const urlParams = new URLSearchParams(location.search);
    const sharedUrl = urlParams.get('shared_url');
    const sharedText = urlParams.get('shared_text');
    const sharedTitle = urlParams.get('shared_title') || urlParams.get('title');

    if (sharedUrl || sharedText || sharedTitle) {
      setSharedContent({
        url: sharedUrl || undefined,
        text: sharedText || undefined,
        title: sharedTitle || undefined,
      });

      // Clean up URL parameters after processing
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('shared_url');
      newUrl.searchParams.delete('shared_text');
      newUrl.searchParams.delete('shared_title');
      newUrl.searchParams.delete('title');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [location.search]);

  const clearSharedContent = () => {
    setSharedContent(null);
  };

  return {
    sharedContent,
    clearSharedContent
  };
};