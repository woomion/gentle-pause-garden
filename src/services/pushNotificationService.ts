import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';

export class PushNotificationService {
  private static instance: PushNotificationService;
  private isInitialized = false;

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  public async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      // Only initialize on native platforms
      if (!Capacitor.isNativePlatform()) {
        return false;
      }

      // Request permission
      let permStatus = await PushNotifications.checkPermissions();
      
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      
      if (permStatus.receive !== 'granted') {
        return false;
      }

      // Register with FCM/APNs
      await PushNotifications.register();

      // Set up listeners
      this.setupListeners();
      
      this.isInitialized = true;
      return true;

    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  private setupListeners(): void {
    // Successfully registered
    PushNotifications.addListener('registration', async (token) => {
      // Send token to backend
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await this.sendTokenToBackend(token.value, user.id);
        }
      } catch (error) {
        console.error('Error sending token to backend:', error);
      }
    });

    // Registration failed
    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ', JSON.stringify(error));
    });

    // Notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      this.handleForegroundNotification(notification);
    });

    // Notification tapped (app opened from notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      this.handleNotificationTap(notification);
    });
  }

  private async sendTokenToBackend(token: string, userId: string): Promise<void> {
    try {
      // Call your Supabase edge function to store the token
      const { error } = await supabase.functions.invoke('store-push-token', {
        body: { token, userId, platform: Capacitor.getPlatform() }
      });

      if (error) {
        console.error('Error storing push token:', error);
      }
    } catch (error) {
      console.error('Error calling store-push-token function:', error);
    }
  }

  private handleForegroundNotification(notification: { title?: string; body?: string }): void {
    // Create a browser notification when app is in foreground
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title || 'Pocket Pause', {
        body: notification.body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'pocket-pause-notification'
      });
    }
  }

  private handleNotificationTap(notification: { notification?: { data?: { action?: string } } }): void {
    // Navigate to specific screens based on notification data
    const data = notification.notification?.data;
    if (data?.action === 'review_items') {
      window.location.href = '/';
    }
  }

  public async getDeliveredNotifications(): Promise<unknown[]> {
    try {
      const result = await PushNotifications.getDeliveredNotifications();
      return result.notifications;
    } catch (error) {
      console.error('Error getting delivered notifications:', error);
      return [];
    }
  }

  public async removeDeliveredNotifications(): Promise<void> {
    try {
      await PushNotifications.removeAllDeliveredNotifications();
    } catch (error) {
      console.error('Error removing delivered notifications:', error);
    }
  }
}

export const pushNotificationService = PushNotificationService.getInstance();