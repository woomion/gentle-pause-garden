import { useEffect, useState } from 'react';

export const useInstalledApp = () => {
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = typeof window !== 'undefined' && (
        (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        // iOS Safari PWA
        (navigator as any).standalone === true ||
        // Android Trusted Web Activity / referrer hint
        document.referrer.startsWith('android-app://')
      );
      setInstalled(isStandalone);
    };

    checkInstalled();

    // Listen for display-mode changes
    const media = window.matchMedia ? window.matchMedia('(display-mode: standalone)') : null;
    media?.addEventListener?.('change', checkInstalled as any);

    return () => {
      media?.removeEventListener?.('change', checkInstalled as any);
    };
  }, []);

  return installed;
};
