
import { useEffect } from 'react';

// Extend the Window interface to include eruda
declare global {
  interface Window {
    eruda?: {
      init: () => void;
    };
  }
}

const MobileDebugger = () => {
  useEffect(() => {
    console.log('📱 MobileDebugger: Starting initialization...');
    
    // Only load Eruda on mobile devices or when specifically needed
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('lovableproject.com');
    
    console.log('📱 MobileDebugger: isMobile =', isMobile, 'isDev =', isDev);
    
    if ((isMobile || isDev) && !window.eruda) {
      console.log('📱 MobileDebugger: Loading Eruda script...');
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/eruda@3.0.1/eruda.min.js';
      script.onload = () => {
        if (window.eruda) {
          console.log('📱 MobileDebugger: Eruda loaded, initializing...');
          window.eruda.init();
          console.log('📱 Mobile debugger loaded! Tap the Eruda button to see console logs.');
        }
      };
      script.onerror = (error) => {
        console.error('📱 MobileDebugger: Failed to load Eruda:', error);
      };
      document.head.appendChild(script);
    } else {
      console.log('📱 MobileDebugger: Skipping Eruda (not mobile/dev or already loaded)');
    }
  }, []);

  return null;
};

export default MobileDebugger;
