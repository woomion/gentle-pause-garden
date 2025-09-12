
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { commentNotificationService } from '@/services/commentNotificationService';
import { notificationService } from '@/services/notificationService';

export const useEnhancedCommentNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Only proceed if permission already granted (avoid auto-prompting)
    const initializeNotifications = async () => {
      if (!('Notification' in window) || Notification.permission !== 'granted') {
        console.log('🔔 Skipping comment notifications setup until user enables notifications');
        return;
      }

      // Setup comment notifications
      const cleanup = await commentNotificationService.setupCommentNotifications(user.id);
      
      return cleanup;
    };

    let cleanup: (() => void) | undefined;
    
    initializeNotifications().then((cleanupFn) => {
      cleanup = cleanupFn;
    });

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [user]);
};
