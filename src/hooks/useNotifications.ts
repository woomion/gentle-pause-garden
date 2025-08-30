
import { useEffect, useCallback, useRef } from 'react';
import { pausedItemsStore } from '../stores/pausedItemsStore';
import { supabasePausedItemsStore } from '../stores/supabasePausedItemsStore';
import { platformNotificationService } from '../services/platformNotificationService';
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
      console.log('🔔 Settings sync - enabled:', enabled, 'platform:', platformNotificationService.getPlatformName());
      platformNotificationService.setEnabled(enabled);
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
      const shouldRemindAfterDelay = itemsForReview.length > 0 && lastNotificationCountRef.current > 0 && timeSinceLastCheck > 2 * 60 * 60 * 1000; // Only remind if we've sent notifications before
      
      console.log('📊 Notification decision factors:', {
        itemsCount: itemsForReview.length,
        lastCount: lastNotificationCountRef.current,
        timeSinceLastCheck: Math.round(timeSinceLastCheck / 1000 / 60), // minutes
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

        console.log('🚀 Sending notification via platform service...');
        
        // Send notification via platform service
        await platformNotificationService.showNotification(title, {
          body,
          tag: 'pocket-pause-review',
          requireInteraction: false
        });

        // Send push notification to user's devices (for authenticated users)
        await sendPushNotification(title, body, {
          action: 'review_items',
          count: itemsForReview.length
        });

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

    try {
      console.log('Setting up notifications - checking immediately');
      
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
        console.log('⏰ 1-minute interval check triggered');
        checkForReadyItems();
      }, 60 * 1000); // Check every minute instead of 5 minutes

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
      return await platformNotificationService.requestPermission();
    } catch (error) {
      console.error('Error enabling notifications:', error);
      return false;
    }
  };

  const testNotification = () => {
    try {
      console.log('🧪 Test notification triggered via platform service');
      
      if (platformNotificationService.getEnabled()) {
        platformNotificationService.showNotification('Test Notification', {
          body: 'This is a test to make sure notifications are working on your device!',
          tag: 'pocket-pause-test',
          requireInteraction: false
        });
        
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
