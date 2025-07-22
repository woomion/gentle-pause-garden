
import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 Network: Back online');
      if (!isOnline) {
        setWasOffline(true);
      }
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('📵 Network: Gone offline');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOnline]);

  const clearWasOfflineFlag = () => {
    setWasOffline(false);
  };

  return {
    isOnline,
    wasOffline,
    clearWasOfflineFlag
  };
};
