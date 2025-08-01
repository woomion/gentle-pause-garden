import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const useShareTarget = (onSharedUrl?: (url: string, title?: string) => void) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleShareTarget = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const sharedUrl = urlParams.get('shared_url') || urlParams.get('url');
      const sharedTitle = urlParams.get('title');
      const sharedText = urlParams.get('text');
      
      console.log('🔗 Share target detected:', { sharedUrl, sharedTitle, sharedText });
      
      if (sharedUrl) {
        // Clean the URL parameters
        window.history.replaceState({}, '', window.location.pathname);
        
        if (onSharedUrl) {
          onSharedUrl(sharedUrl, sharedTitle || sharedText || undefined);
        }
        
        // Add haptic feedback on mobile
        if ('vibrate' in navigator) {
          navigator.vibrate([50, 100, 50]);
        }
      }
    };

    // Check immediately and also listen for navigation events
    handleShareTarget();
    
    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', handleShareTarget);
    
    return () => {
      window.removeEventListener('popstate', handleShareTarget);
    };
  }, [onSharedUrl]);
};