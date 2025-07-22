
import React from 'react';
import { WifiOff, Wifi, Sync } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { offlineQueueStore } from '../stores/offlineQueueStore';
import { offlineSyncService } from '../services/offlineSyncService';

const OfflineIndicator = () => {
  const { isOnline, wasOffline, clearWasOfflineFlag } = useNetworkStatus();
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    const updatePendingCount = () => {
      setPendingCount(offlineQueueStore.getQueue().length);
    };

    updatePendingCount();
    const unsubscribe = offlineQueueStore.subscribe(updatePendingCount);

    return unsubscribe;
  }, []);

  React.useEffect(() => {
    // Auto-sync when coming back online
    if (isOnline && wasOffline && pendingCount > 0) {
      console.log('🔄 Auto-syncing after coming back online');
      offlineSyncService.syncPendingOperations();
      clearWasOfflineFlag();
    }
  }, [isOnline, wasOffline, pendingCount, clearWasOfflineFlag]);

  const handleManualSync = async () => {
    if (isOnline) {
      await offlineSyncService.syncPendingOperations();
    }
  };

  if (isOnline && pendingCount === 0) {
    return null; // Hide when online and nothing to sync
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div 
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shadow-lg transition-all ${
          isOnline 
            ? 'bg-blue-500 text-white' 
            : 'bg-red-500 text-white'
        }`}
      >
        {isOnline ? (
          <>
            <Wifi size={16} />
            {pendingCount > 0 && (
              <>
                <span>{pendingCount} pending sync</span>
                <button
                  onClick={handleManualSync}
                  className="ml-2 p-1 hover:bg-white/20 rounded"
                  aria-label="Manual sync"
                >
                  <Sync size={14} />
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <WifiOff size={16} />
            <span>Offline mode</span>
            {pendingCount > 0 && (
              <span className="bg-white/20 px-2 py-1 rounded-full text-xs">
                {pendingCount}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
