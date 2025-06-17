
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
    // Only load Eruda on mobile devices or when specifically needed
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isDev = window.location.hostname === 'localhost' || window.location.hostname.includes('lovableproject.com');
    
    if ((isMobile || isDev) && !window.eruda) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/eruda@3.0.1/eruda.min.js';
      script.onload = () => {
        if (window.eruda) {
          window.eruda.init();
          console.log('📱 Mobile debugger loaded! Tap the Eruda button to see console logs.');
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  return null;
};

export default MobileDebugger;
