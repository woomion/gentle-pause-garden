
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
    console.log('🔔 PushNotificationService: Initialize called');
    
    if (this.isInitialized) {
      console.log('🔔 PushNotificationService: Already initialized');
      return true;
    }

    try {
      // Only initialize on native platforms
      if (!Capacitor.isNativePlatform()) {
        console.log('🔔 PushNotificationService: Not a native platform, skipping');
        return false;
      }

      console.log('🔔 PushNotificationService: Native platform detected, proceeding...');

      // Request permission
      console.log('🔔 PushNotificationService: Checking permissions...');
      let permStatus = await PushNotifications.checkPermissions();
      console.log('🔔 PushNotificationService: Current permission status:', permStatus);
      
      if (permStatus.receive === 'prompt') {
        console.log('🔔 PushNotificationService: Requesting permissions...');
        permStatus = await PushNotifications.requestPermissions();
        console.log('🔔 PushNotificationService: Permission request result:', permStatus);
      }
      
      if (permStatus.receive !== 'granted') {
        console.log('🔔 PushNotificationService: Permissions not granted:', permStatus.receive);
        return false;
      }

      // Register with FCM/APNs
      console.log('🔔 PushNotificationService: Registering with FCM/APNs...');
      await PushNotifications.register();

      // Set up listeners
      console.log('🔔 PushNotificationService: Setting up listeners...');
      this.setupListeners();
      
      this.isInitialized = true;
      console.log('🔔 PushNotificationService: Successfully initialized');
      return true;

    } catch (error) {
      console.error('❌ PushNotificationService: Error initializing push notifications:', error);
      return false;
    }
  }

  private setupListeners(): void {
    console.log('🔔 PushNotificationService: Setting up event listeners...');
    
    // Successfully registered
    PushNotifications.addListener('registration', async (token) => {
      console.log('🔔 PushNotificationService: Registration successful, token received');
      // Send token to backend
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('🔔 PushNotificationService: Sending token to backend for user:', user.id);
          await this.sendTokenToBackend(token.value, user.id);
        } else {
          console.log('🔔 PushNotificationService: No user found, skipping token storage');
        }
      } catch (error) {
        console.error('❌ PushNotificationService: Error sending token to backend:', error);
      }
    });

    // Registration failed
    PushNotifications.addListener('registrationError', (error) => {
      console.error('❌ PushNotificationService: Registration error:', JSON.stringify(error));
    });

    // Notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('🔔 PushNotificationService: Notification received in foreground:', notification);
      this.handleForegroundNotification(notification);
    });

    // Notification tapped (app opened from notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('🔔 PushNotificationService: Notification tapped:', notification);
      this.handleNotificationTap(notification);
    });
  }

  private async sendTokenToBackend(token: string, userId: string): Promise<void> {
    try {
      console.log('🔔 PushNotificationService: Calling store-push-token function...');
      // Call your Supabase edge function to store the token
      const { error } = await supabase.functions.invoke('store-push-token', {
        body: { token, userId, platform: Capacitor.getPlatform() }
      });

      if (error) {
        console.error('❌ PushNotificationService: Error storing push token:', error);
      } else {
        console.log('✅ PushNotificationService: Push token stored successfully');
      }
    } catch (error) {
      console.error('❌ PushNotificationService: Error calling store-push-token function:', error);
    }
  }

  private handleForegroundNotification(notification: { title?: string; body?: string }): void {
    console.log('🔔 PushNotificationService: Handling foreground notification');
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
    console.log('🔔 PushNotificationService: Handling notification tap');
    // Navigate to specific screens based on notification data
    const data = notification.notification?.data;
    if (data?.action === 'review_items') {
      console.log('🔔 PushNotificationService: Navigating to review items');
      window.location.href = '/';
    }
  }

  public async getDeliveredNotifications(): Promise<unknown[]> {
    try {
      const result = await PushNotifications.getDeliveredNotifications();
      return result.notifications;
    } catch (error) {
      console.error('❌ PushNotificationService: Error getting delivered notifications:', error);
      return [];
    }
  }

  public async removeDeliveredNotifications(): Promise<void> {
    try {
      await PushNotifications.removeAllDeliveredNotifications();
    } catch (error) {
      console.error('❌ PushNotificationService: Error removing delivered notifications:', error);
    }
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
