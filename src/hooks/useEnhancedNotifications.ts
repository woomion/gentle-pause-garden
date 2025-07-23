import { useEffect, useCallback, useRef } from 'react';
import { pausedItemsStore } from '../stores/pausedItemsStore';
import { supabasePausedItemsStore } from '../stores/supabasePausedItemsStore';
import { platformNotificationService } from '../services/platformNotificationService';
import { notificationSchedulingService } from '../services/notificationSchedulingService';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useEnhancedNotifications = (enabled: boolean) => {
  const { user } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastNotificationCountRef = useRef<number>(0);
  const lastCheckTimeRef = useRef<number>(0);

  // Sync notification service with settings when enabled state changes
  useEffect(() => {
    try {
      console.log('🔔 Enhanced notifications sync - enabled:', enabled, 'platform:', platformNotificationService.getPlatformName());
      platformNotificationService.setEnabled(enabled);
    } catch (error) {
      console.error('Error syncing enhanced notification service:', error);
    }
  }, [enabled]);

  const sendPushNotification = useCallback(async (title: string, body: string, data?: Record<string, any>) => {
    if (!user) return;
    
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
      }
    } catch (error) {
      console.error('Error calling send-push-notifications function:', error);
    }
  }, [user]);

  const processScheduledNotifications = useCallback(async () => {
    if (!user || !enabled) return;

    try {
      // Get pending notifications
      const pendingNotifications = await notificationSchedulingService.getPendingNotifications(user.id);
      
      if (pendingNotifications.length === 0) return;

      console.log('📋 Processing', pendingNotifications.length, 'scheduled notifications');

      // Group notifications by time window for batching
      const now = new Date();
      const batchedNotifications = [];
      
      for (const notification of pendingNotifications) {
        const scheduledTime = new Date(notification.scheduled_for);
        if (scheduledTime <= now) {
          batchedNotifications.push(notification);
        }
      }

      if (batchedNotifications.length === 0) return;

      // Create batched notification content
      const batchedContent = await notificationSchedulingService.createBatchedNotification(batchedNotifications);

      // Send the notification using platform service
      console.log('🚀 Sending batched notification:', batchedContent.title);
      
      await platformNotificationService.showNotification(batchedContent.title, {
        body: batchedContent.body,
        tag: 'pocket-pause-scheduled',
        requireInteraction: false
      });

      // Send push notification
      await sendPushNotification(batchedContent.title, batchedContent.body, batchedContent.data);

      // Mark all processed notifications as sent
      for (const processedNotification of batchedNotifications) {
        if (processedNotification.id) {
          await notificationSchedulingService.markNotificationAsSent(processedNotification.id);
        }
      }

      // Record in notification history
      await supabase.from('notification_history').insert({
        user_id: user.id,
        notification_type: 'batched_review',
        items_count: batchedNotifications.length
      });

    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
    }
  }, [user, enabled, sendPushNotification]);

  const checkAndScheduleNotifications = useCallback(async () => {
    if (!user || !enabled) return;

    try {
      console.log('🔍 Checking for items to schedule notifications');

      // Get user's notification settings
      const settings = await notificationSchedulingService.getUserScheduleSettings(user.id);
      if (!settings) {
        console.log('No notification settings found, using defaults');
        return;
      }

      // Get items for review
      const itemsForReview = supabasePausedItemsStore.getItemsForReview();
      
      if (itemsForReview.length === 0) {
        lastNotificationCountRef.current = 0;
        return;
      }

      // Check if we need to schedule new notifications
      const now = Date.now();
      const timeSinceLastCheck = now - lastCheckTimeRef.current;
      const shouldScheduleForNewItems = itemsForReview.length > lastNotificationCountRef.current;
      const shouldScheduleReminder = itemsForReview.length > 0 && timeSinceLastCheck > 2 * 60 * 60 * 1000; // 2 hours

      if (shouldScheduleForNewItems || shouldScheduleReminder) {
        console.log('📅 Scheduling notifications for', itemsForReview.length, 'items');

        for (const item of itemsForReview) {
          const itemReadyTime = new Date(item.checkInDate);
          itemReadyTime.setHours(
            parseInt(item.checkInTime.split(':')[0]),
            parseInt(item.checkInTime.split(':')[1])
          );

          const scheduledTime = notificationSchedulingService.calculateScheduledTime(settings, itemReadyTime);

          const title = 'Time to review your paused item!';
          const body = `"${item.itemName}" is ready for a thoughtful decision.`;

          // Queue the notification
          await notificationSchedulingService.queueNotification({
            user_id: user.id,
            item_id: item.id,
            notification_type: 'review_ready',
            title,
            body,
            data: { 
              action: 'review_item',
              item_id: item.id,
              item_name: item.itemName
            },
            scheduled_for: scheduledTime.toISOString()
          });
        }

        lastNotificationCountRef.current = itemsForReview.length;
        lastCheckTimeRef.current = now;
      }

    } catch (error) {
      console.error('Error checking and scheduling notifications:', error);
    }
  }, [user, enabled]);

  // Set up enhanced notifications
  useEffect(() => {
    if (!enabled || !user) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Check immediately
    const immediateCheck = setTimeout(() => {
      checkAndScheduleNotifications();
      processScheduledNotifications();
    }, 1000);

    // Set up interval for both checking new items and processing scheduled notifications
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(() => {
      checkAndScheduleNotifications();
      processScheduledNotifications();
    }, 2 * 60 * 1000); // Check every 2 minutes

    // Process scheduled notifications when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && enabled) {
        setTimeout(() => {
          processScheduledNotifications();
        }, 500);
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
  }, [enabled, user, checkAndScheduleNotifications, processScheduledNotifications]);

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
      if (platformNotificationService.getEnabled()) {
        platformNotificationService.showNotification('Test Notification', {
          body: 'Enhanced notifications are working! 🎉',
          tag: 'pocket-pause-test',
          requireInteraction: false
        });
        console.log('🧪 Test notification sent via platform service');
      }
    } catch (error) {
      console.error('Error in test notification:', error);
    }
  };

  return { enableNotifications, testNotification };
};
