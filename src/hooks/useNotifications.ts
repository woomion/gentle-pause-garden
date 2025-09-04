
import { useEffect, useCallback, useRef } from 'react';
import { pausedItemsStore } from '../stores/pausedItemsStore';
import { supabasePausedItemsStore } from '../stores/supabasePausedItemsStore';
import { platformNotificationService } from '../services/platformNotificationService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useUserSettings } from './useUserSettings';

export const useNotifications = (enabled: boolean) => {
  const { user } = useAuth();
  const { notificationSettings } = useUserSettings();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationCountRef = useRef<number>(0);
  const lastCheckTimeRef = useRef<number>(0);

  // Sync notification service with settings when enabled state changes
  useEffect(() => {
    try {
      console.log('🔔 Settings sync - enabled:', enabled, 'platform:', platformNotificationService.getPlatformName());
      platformNotificationService.setEnabled(enabled);
      
      // If enabling notifications and user is logged in, ensure proper registration
      if (enabled && user) {
        console.log('🔄 Re-initializing notification service for user:', user.id);
        // Trigger re-registration to ensure backend targeting works
        platformNotificationService.requestPermission().catch(error => {
          console.log('Permission request failed:', error);
        });
      }
    } catch (error) {
      console.error('Error syncing notification service:', error);
    }
  }, [enabled, user]);

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
      console.log('🔔 enabled:', enabled, 'platform enabled:', platformNotificationService.getEnabled());
      console.log('🔔 user authenticated:', !!user);
      console.log('🔔 platform:', platformNotificationService.getPlatformName());
      
      if (!enabled) {
        console.log('⏭️ Skipping notification check - notifications disabled in settings');
        return;
      }
      
      if (!platformNotificationService.getEnabled()) {
        console.log('⏭️ Skipping notification check - platform service not enabled');
        return;
      }

      // Use the correct store based on authentication status
      const itemsForReview = user 
        ? supabasePausedItemsStore.getItemsForReview()
        : pausedItemsStore.getItemsForReview();
      
      console.log('📋 Items for review found:', itemsForReview.length);
      
      const timeSinceLastCheck = now - lastCheckTimeRef.current;
      const shouldNotifyForNewItems = itemsForReview.length > 0 && itemsForReview.length !== lastNotificationCountRef.current;
      
      // Check if any items will become ready later today
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);
      
      const allItems = user 
        ? supabasePausedItemsStore.getItems()
        : pausedItemsStore.getItems();
      
      const itemsReadyLaterToday = allItems.filter(item => {
        const reviewDate = new Date(item.checkInDate);
        return reviewDate > new Date() && reviewDate <= endOfToday;
      });
      
      // Only send reminder if: 
      // 1. Items are ready for review
      // 2. We've sent notifications before (not first time)
      // 3. It's been more than 4 hours since last check
      // 4. No more items will be ready today (so this is the final batch)
      const shouldRemindAfterDelay = itemsForReview.length > 0 
        && lastNotificationCountRef.current > 0 
        && timeSinceLastCheck > 4 * 60 * 60 * 1000 // 4 hours instead of 2
        && itemsReadyLaterToday.length === 0; // No more items coming today
      
      console.log('📊 Notification decision factors:', {
        itemsCount: itemsForReview.length,
        lastCount: lastNotificationCountRef.current,
        timeSinceLastCheck: Math.round(timeSinceLastCheck / 1000 / 60), // minutes
        shouldNotifyForNewItems,
        shouldRemindAfterDelay
      });
      
      if (shouldNotifyForNewItems || shouldRemindAfterDelay) {
        let title: string;
        let body: string;
        
        if (shouldNotifyForNewItems && itemsForReview.length > lastNotificationCountRef.current) {
          // New item(s) became ready - show specific details for the newest item
          const newestItem = itemsForReview[0]; // Assuming items are sorted by readiness
          const storeName = newestItem.storeName?.trim();
          const itemName = newestItem.itemName || 'Item';
          
          title = storeName ? `${storeName}: ${itemName}` : itemName;
          body = itemsForReview.length === 1 
            ? 'Ready for your thoughtful decision'
            : `Ready for review • ${itemsForReview.length} total items waiting`;
        } else {
          // Reminder for existing items
          title = itemsForReview.length === 1 
            ? 'Time to review your paused item'
            : `${itemsForReview.length} items ready for review`;
          body = 'Your paused items are waiting for thoughtful decisions';
        }

        // For authenticated users with individual notifications, backend handles everything
        if (user && notificationSettings?.deliveryStyle === 'item_by_item') {
          console.log('✅ Individual notification user - backend handles notifications, frontend skipping');
        } else {
          console.log('🚀 Sending notification via platform service...');
          
          // Send notification via platform service for guest users or batch users
          await platformNotificationService.showNotification(title, {
            body,
            tag: 'pocket-pause-review',
            requireInteraction: false
          });
        }

        // For authenticated users, only send push notifications for batch delivery or fallback
        if (user && notificationSettings?.deliveryStyle !== 'item_by_item') {
          await sendPushNotification(title, body, {
            action: 'review_items',
            count: itemsForReview.length
          });
        }

        lastNotificationCountRef.current = itemsForReview.length;
        lastCheckTimeRef.current = now;
      } else if (itemsForReview.length === 0) {
        lastNotificationCountRef.current = 0;
        console.log('📭 No items ready for review');
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

    // For authenticated users with individual notifications, reduce frontend polling frequency significantly
    // The backend cron job handles push notifications, so frontend just provides backup
    const isIndividualUser = user && notificationSettings?.deliveryStyle === 'item_by_item';
    const checkInterval = isIndividualUser ? 30 * 60 * 1000 : 15 * 60 * 1000; // 30 minutes vs 15 minutes
    
    if (isIndividualUser) {
      console.log('✅ Individual notifications mode - backend handles push, frontend provides backup checks');
    }

    try {
      console.log('Setting up frontend notifications for batch/guest users - checking immediately');
      
      // Check immediately, but with a small delay to ensure everything is initialized
      const immediateCheck = setTimeout(() => {
        console.log('🕐 Immediate check triggered after enabling notifications');
        checkForReadyItems();
      }, 1000);

      // Set up interval to check every minute for more frequent updates
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        console.log(`⏰ ${checkInterval / 1000 / 60}-minute interval check triggered`);
        checkForReadyItems();
      }, checkInterval);

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
  }, [enabled, user, notificationSettings, checkForReadyItems]);

  const enableNotifications = async () => {
    try {
      return await platformNotificationService.requestPermission();
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return false;
    }
  };

  const testNotification = async () => {
    try {
      console.log('🧪 Test notification triggered');
      
      // For authenticated users, send both platform and push notifications
      if (user) {
        console.log('📱 Sending test push notification for authenticated user');
        await sendPushNotification(
          'Test Notification', 
          'Your notifications are working perfectly!',
          { test: true }
        );
      }
      
      // Also send platform notification
      if (platformNotificationService.getEnabled()) {
        await platformNotificationService.testNotification();
        
        // Also trigger a check for real items
        setTimeout(checkForReadyItems, 1000);
      } else {
        console.log('Platform notification service not enabled');
      }
    } catch (error) {
      console.error('Error in test notification:', error);
    }
  };

  return { enableNotifications, testNotification };
};
