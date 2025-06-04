
import { useEffect, useCallback } from 'react';
import { pausedItemsStore } from '../stores/pausedItemsStore';
import { notificationService } from '../services/notificationService';

export const useNotifications = (enabled: boolean) => {
  const checkForReadyItems = useCallback(() => {
    if (!enabled || !notificationService.getEnabled()) return;

    const itemsForReview = pausedItemsStore.getItemsForReview();
    
    if (itemsForReview.length > 0) {
      const title = itemsForReview.length === 1 
        ? 'Time to review your paused item!'
        : `Time to review ${itemsForReview.length} paused items!`;
      
      const body = itemsForReview.length === 1
        ? `"${itemsForReview[0].itemName}" is ready for a thoughtful decision.`
        : 'Some of your paused items are ready for thoughtful decisions.';

      notificationService.showNotification(title, {
        body,
        tag: 'pocket-pause-review',
        renotify: true,
        requireInteraction: false
      });
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Check immediately
    checkForReadyItems();

    // Set up interval to check every 30 minutes
    const interval = setInterval(checkForReadyItems, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled, checkForReadyItems]);

  const enableNotifications = async () => {
    return await notificationService.requestPermission();
  };

  return { enableNotifications };
};
