
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { commentNotificationService } from '@/services/commentNotificationService';
import { notificationService } from '@/services/notificationService';

export const useEnhancedCommentNotifications = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Request notification permission
    const initializeNotifications = async () => {
      const hasPermission = await notificationService.requestPermission();
      if (!hasPermission) {
        console.log('🔔 Notification permission not granted');
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
