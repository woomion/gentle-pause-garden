
import { useEffect, useCallback, useRef } from 'react';
import { pausedItemsStore } from '../stores/pausedItemsStore';
import { supabasePausedItemsStore } from '../stores/supabasePausedItemsStore';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = (enabled: boolean) => {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationCountRef = useRef<number>(0);

  // Sync notification service with settings when enabled state changes
  useEffect(() => {
    try {
      if (enabled && Notification.permission === 'granted') {
        notificationService.setEnabled(true);
        console.log('Notification service enabled via settings sync');
      } else if (enabled === false) { // Only disable if explicitly false, not undefined/loading
        notificationService.setEnabled(false);
        console.log('Notification service disabled via settings sync');
      }
      // If enabled is undefined/loading, don't change the service state
    } catch (error) {
      console.error('Error syncing notification service:', error);
    }
  }, [enabled]);

  const checkForReadyItems = useCallback(() => {
    try {
      if (!enabled || !notificationService.getEnabled()) {
        console.log('Skipping notification check - enabled:', enabled, 'service enabled:', notificationService.getEnabled());
        return;
      }

      // Use the correct store based on authentication status
      const itemsForReview = user 
        ? supabasePausedItemsStore.getItemsForReview()
        : pausedItemsStore.getItemsForReview();
      
      console.log('Checking for ready items:', itemsForReview.length, 'items found');
      console.log('Last notification count:', lastNotificationCountRef.current);
      
      // Only send notification if there are items AND the count has changed (or it's the first check)
      if (itemsForReview.length > 0 && itemsForReview.length !== lastNotificationCountRef.current) {
        const title = itemsForReview.length === 1 
          ? 'Time to review your paused item!'
          : `Time to review ${itemsForReview.length} paused items!`;
        
        const body = itemsForReview.length === 1
          ? `"${itemsForReview[0].itemName}" is ready for a thoughtful decision.`
          : 'Some of your paused items are ready for thoughtful decisions.';

        console.log('Showing notification:', title, body);

        notificationService.showNotification(title, {
          body,
          tag: `pocket-pause-review-${Date.now()}`, // Unique tag to prevent suppression
          requireInteraction: false
        });

        lastNotificationCountRef.current = itemsForReview.length;
      } else if (itemsForReview.length === 0) {
        lastNotificationCountRef.current = 0;
        console.log('No items ready for review');
      } else {
        console.log('Item count unchanged, skipping notification');
      }
    } catch (error) {
      console.error('Error in checkForReadyItems:', error);
    }
  }, [enabled, user]);

  // Set up notifications and intervals
  useEffect(() => {
    if (!enabled) {
      // Clear interval if notifications are disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    try {
      console.log('Setting up notifications - checking immediately');
      
      // Check immediately, but with a small delay to ensure everything is initialized
      const immediateCheck = setTimeout(() => {
        checkForReadyItems();
      }, 1000);

      // Set up interval to check every 30 minutes
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        console.log('30-minute interval check triggered');
        checkForReadyItems();
      }, 30 * 60 * 1000);

      return () => {
        clearTimeout(immediateCheck);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  }, [enabled, checkForReadyItems]);

  const enableNotifications = async () => {
    try {
      return await notificationService.requestPermission();
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return false;
    }
  };

  // Add a manual test function
  const testNotification = () => {
    try {
      if (notificationService.getEnabled()) {
        notificationService.showNotification('Test Notification', {
          body: 'This is a test to make sure notifications are working!',
          tag: `pocket-pause-test-${Date.now()}`
        });
      } else {
        console.log('Notifications not enabled, would show: Test Notification');
      }
    } catch (error) {
      console.error('Error in test notification:', error);
    }
  };

  return { enableNotifications, testNotification };
};
