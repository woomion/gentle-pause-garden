
import { useEffect, useCallback, useRef } from 'react';
import { pausedItemsStore } from '../stores/pausedItemsStore';
import { supabasePausedItemsStore } from '../stores/supabasePausedItemsStore';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useNotifications = (enabled: boolean) => {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationCountRef = useRef<number>(0);
  const lastCheckTimeRef = useRef<number>(0);

  // Sync notification service with settings when enabled state changes
  useEffect(() => {
    try {
      console.log('🔔 Settings sync - enabled:', enabled, 'permission:', Notification.permission);
      if (enabled && Notification.permission === 'granted') {
        notificationService.setEnabled(true);
        console.log('✅ Notification service enabled via settings sync');
      } else if (enabled === false) {
        notificationService.setEnabled(false);
        console.log('❌ Notification service disabled via settings sync');
      }
    } catch (error) {
      console.error('Error syncing notification service:', error);
    }
  }, [enabled]);

  const sendPushNotification = useCallback(async (title: string, body: string, data?: Record<string, any>) => {
    if (!user) return; // Only send push notifications to authenticated users
    
    try {
      const { error } = await supabase.functions.invoke('send-push-notifications', {
        body: { 
          userIds: [user.id], 
          title, 
          body, 
          data 
        }
      });

      if (error) {
        console.error('Error sending push notification:', error);
      } else {
        console.log('Push notification sent successfully');
      }
    } catch (error) {
      console.error('Error calling send-push-notifications function:', error);
    }
  }, [user]);

  const checkForReadyItems = useCallback(async () => {
    try {
      const now = Date.now();
      console.log('🔍 Starting notification check at:', new Date(now).toISOString());
      console.log('🔔 enabled:', enabled, 'service enabled:', notificationService.getEnabled());
      console.log('🔔 user authenticated:', !!user);
      console.log('🔔 time since last check:', now - lastCheckTimeRef.current, 'ms');
      
      if (!enabled || !notificationService.getEnabled()) {
        console.log('⏭️ Skipping notification check - enabled:', enabled, 'service enabled:', notificationService.getEnabled());
        return;
      }

      // Use the correct store based on authentication status
      const itemsForReview = user 
        ? supabasePausedItemsStore.getItemsForReview()
        : pausedItemsStore.getItemsForReview();
      
      console.log('📋 Items for review found:', itemsForReview.length);
      console.log('📋 Items details:', itemsForReview.map(item => ({ 
        name: item.itemName, 
        id: item.id, 
        checkInDate: item.checkInDate,
        checkInTime: item.checkInTime,
        isPastDue: item.checkInDate <= new Date()
      })));
      console.log('📋 Last notification count:', lastNotificationCountRef.current);
      
      // Only send notification if there are items AND (the count has changed OR it's been more than 2 hours since last notification)
      const timeSinceLastCheck = now - lastCheckTimeRef.current;
      const shouldNotifyForNewItems = itemsForReview.length > 0 && itemsForReview.length !== lastNotificationCountRef.current;
      const shouldRemindAfterDelay = itemsForReview.length > 0 && timeSinceLastCheck > 2 * 60 * 60 * 1000; // 2 hours
      
      console.log('🔔 Notification decision:', {
        itemCount: itemsForReview.length,
        lastCount: lastNotificationCountRef.current,
        timeSinceLastCheck: Math.round(timeSinceLastCheck / (1000 * 60)), // minutes
        shouldNotifyForNewItems,
        shouldRemindAfterDelay
      });
      
      if (shouldNotifyForNewItems || shouldRemindAfterDelay) {
        const title = itemsForReview.length === 1 
          ? 'Time to review your paused item!'
          : `Time to review ${itemsForReview.length} paused items!`;
        
        const body = itemsForReview.length === 1
          ? `"${itemsForReview[0].itemName}" is ready for a thoughtful decision.`
          : 'Some of your paused items are ready for thoughtful decisions.';

        console.log('🚀 Attempting to show notification...');
        console.log('📧 Title:', title);
        console.log('📧 Body:', body);
        console.log('🔔 Reason:', shouldNotifyForNewItems ? 'new items' : 'reminder after delay');

        // Send browser notification
        const notification = notificationService.showNotification(title, {
          body,
          tag: 'pocket-pause-review',
          requireInteraction: false
        });

        // Send push notification to user's devices (for authenticated users)
        await sendPushNotification(title, body, {
          action: 'review_items',
          count: itemsForReview.length
        });

        console.log('📱 Notification object created:', notification);

        lastNotificationCountRef.current = itemsForReview.length;
        lastCheckTimeRef.current = now;
      } else if (itemsForReview.length === 0) {
        lastNotificationCountRef.current = 0;
        console.log('📭 No items ready for review');
      } else {
        console.log('🔄 Item count unchanged and not time for reminder, skipping notification');
      }
    } catch (error) {
      console.error('❌ Error in checkForReadyItems:', error);
    }
  }, [enabled, user, sendPushNotification]);

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
        console.log('🕐 Immediate check triggered after enabling notifications');
        checkForReadyItems();
      }, 1000);

      // Set up interval to check every 5 minutes for better responsiveness on mobile
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        console.log('⏰ 5-minute interval check triggered');
        checkForReadyItems();
      }, 5 * 60 * 1000);

      // Also check when page becomes visible again (helps with mobile)
      const handleVisibilityChange = () => {
        if (!document.hidden && enabled) {
          console.log('👁️ Page became visible, checking for notifications');
          setTimeout(checkForReadyItems, 500);
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        clearTimeout(immediateCheck);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
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

  const testNotification = () => {
    try {
      console.log('🧪 Test notification triggered');
      console.log('🧪 Service enabled:', notificationService.getEnabled());
      console.log('🧪 Permission:', Notification.permission);
      console.log('🧪 Page visibility:', document.visibilityState);
      
      if (notificationService.getEnabled()) {
        console.log('🧪 Showing test notification...');
        const notification = notificationService.showNotification('Test Notification', {
          body: 'This is a test to make sure notifications are working on your device!',
          tag: 'pocket-pause-test',
          requireInteraction: false
        });
        console.log('🧪 Test notification created:', notification);
        
        // Also trigger a check for real items
        console.log('🧪 Also checking for real items...');
        setTimeout(checkForReadyItems, 1000);
      } else {
        console.log('Notifications not enabled, would show: Test Notification');
      }
    } catch (error) {
      console.error('Error in test notification:', error);
    }
  };

  return { enableNotifications, testNotification };
};
