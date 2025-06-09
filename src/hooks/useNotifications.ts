
import { useEffect, useCallback } from 'react';
import { pausedItemsStore } from '../stores/pausedItemsStore';
import { supabasePausedItemsStore } from '../stores/supabasePausedItemsStore';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';

export const useNotifications = (enabled: boolean) => {
  const { user } = useAuth();

  // Sync notification service with settings when enabled state changes
  useEffect(() => {
    if (enabled && Notification.permission === 'granted') {
      notificationService.setEnabled(true);
      console.log('Notification service enabled via settings sync');
    } else if (!enabled) {
      notificationService.setEnabled(false);
      console.log('Notification service disabled via settings sync');
    }
  }, [enabled]);

  const checkForReadyItems = useCallback(() => {
    if (!enabled || !notificationService.getEnabled()) {
      console.log('Skipping notification check - enabled:', enabled, 'service enabled:', notificationService.getEnabled());
      return;
    }

    // Use the correct store based on authentication status
    const itemsForReview = user 
      ? supabasePausedItemsStore.getItemsForReview()
      : pausedItemsStore.getItemsForReview();
    
    console.log('Checking for ready items:', itemsForReview.length, 'items found');
    
    if (itemsForReview.length > 0) {
      const title = itemsForReview.length === 1 
        ? 'Time to review your paused item!'
        : `Time to review ${itemsForReview.length} paused items!`;
      
      const body = itemsForReview.length === 1
        ? `"${itemsForReview[0].itemName}" is ready for a thoughtful decision.`
        : 'Some of your paused items are ready for thoughtful decisions.';

      console.log('Showing notification:', title, body);

      notificationService.showNotification(title, {
        body,
        tag: 'pocket-pause-review',
        requireInteraction: false
      });
    } else {
      console.log('No items ready for review');
    }
  }, [enabled, user]);

  useEffect(() => {
    if (!enabled) return;

    // Check immediately when enabled
    console.log('Setting up notifications - checking immediately');
    checkForReadyItems();

    // Set up interval to check every 30 minutes
    const interval = setInterval(() => {
      console.log('30-minute interval check triggered');
      checkForReadyItems();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [enabled, checkForReadyItems]);

  const enableNotifications = async () => {
    return await notificationService.requestPermission();
  };

  // Add a manual test function
  const testNotification = () => {
    if (notificationService.getEnabled()) {
      notificationService.showNotification('Test Notification', {
        body: 'This is a test to make sure notifications are working!',
        tag: 'pocket-pause-test'
      });
    }
  };

  return { enableNotifications, testNotification };
};
