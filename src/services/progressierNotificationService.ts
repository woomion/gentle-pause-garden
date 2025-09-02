// Progressier PWA Push Notification Service
// This service wraps Progressier's API for push notifications

declare global {
  interface Window {
    progressierRegistration?: {
      ready: Promise<any>;
      register: () => Promise<any>;
      unregister: () => Promise<any>;
      isSubscribed: () => Promise<boolean>;
      getSubscription: () => Promise<any>;
      showOptIn: () => void;
      hideOptIn: () => void;
      sendNotification: (options: {
        title: string;
        body: string;
        icon?: string;
        badge?: string;
        tag?: string;
        data?: any;
      }) => Promise<any>;
    };
  }
}

export class ProgressierNotificationService {
  private static instance: ProgressierNotificationService;

  private constructor() {}

  static getInstance(): ProgressierNotificationService {
    if (!ProgressierNotificationService.instance) {
      ProgressierNotificationService.instance = new ProgressierNotificationService();
    }
    return ProgressierNotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('🔔 Progressier: Initializing...');
      
      // Wait for Progressier to be ready
      if (window.progressierRegistration) {
        await window.progressierRegistration.ready;
        console.log('✅ Progressier: Ready');
        return true;
      } else {
        console.log('⚠️ Progressier: Not loaded yet, waiting...');
        // Wait a bit longer for the script to load
        return new Promise((resolve) => {
          let attempts = 0;
          const checkProgressier = () => {
            attempts++;
            if (window.progressierRegistration) {
              window.progressierRegistration.ready.then(() => {
                console.log('✅ Progressier: Ready after retry');
                resolve(true);
              });
            } else if (attempts < 50) { // Try for 5 seconds
              setTimeout(checkProgressier, 100);
            } else {
              console.log('❌ Progressier: Failed to initialize');
              resolve(false);
            }
          };
          setTimeout(checkProgressier, 100);
        });
      }
    } catch (error) {
      console.error('❌ Progressier: Initialization error:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      await this.initialize();
      
      if (!window.progressierRegistration) {
        console.log('❌ Progressier not available');
        return false;
      }

      // Check if already subscribed
      const isSubscribed = await window.progressierRegistration.isSubscribed();
      if (isSubscribed) {
        console.log('✅ Already subscribed to push notifications');
        return true;
      }

      // Show Progressier's opt-in UI
      window.progressierRegistration.showOptIn();
      
      // Register for push notifications
      const subscription = await window.progressierRegistration.register();
      console.log('🔔 Progressier registration result:', subscription);
      
      const nowSubscribed = await window.progressierRegistration.isSubscribed();
      console.log('🔔 Push notification subscription result:', nowSubscribed);
      
      // Store the push token in our database
      if (nowSubscribed && subscription) {
        await this.storePushToken(subscription);
      }
      
      return nowSubscribed;
    } catch (error) {
      console.error('❌ Error requesting push permission:', error);
      return false;
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      await this.initialize();
      
      if (!window.progressierRegistration) {
        return false;
      }

      return await window.progressierRegistration.isSubscribed();
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      return false;
    }
  }

  async unsubscribe(): Promise<boolean> {
    try {
      await this.initialize();
      
      if (!window.progressierRegistration) {
        return false;
      }

      await window.progressierRegistration.unregister();
      console.log('🔔 Unsubscribed from push notifications');
      return true;
    } catch (error) {
      console.error('❌ Error unsubscribing:', error);
      return false;
    }
  }

  async sendNotification(title: string, body: string, options: {
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
  } = {}): Promise<void> {
    try {
      await this.initialize();
      
      if (!window.progressierRegistration) {
        console.log('❌ Progressier not available for sending notification');
        return;
      }

      const isSubscribed = await this.isSubscribed();
      if (!isSubscribed) {
        console.log('❌ User not subscribed to push notifications');
        return;
      }

      const notificationOptions = {
        title,
        body,
        icon: options.icon || '/icons/app-icon-512.png',
        badge: options.badge || '/icons/app-icon-512.png',
        tag: options.tag || 'pocket-pause',
        data: options.data || {}
      };

      await window.progressierRegistration.sendNotification(notificationOptions);
      console.log('✅ Push notification sent via Progressier');
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
    }
  }

  async testNotification(): Promise<void> {
    await this.sendNotification(
      'Test Notification',
      'This is a test from Pocket Pause! Your notifications are working.',
      {
        tag: 'test-notification',
        data: { type: 'test' }
      }
    );
  }

  private async storePushToken(subscription: any): Promise<void> {
    try {
      // Get the current user from auth
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('❌ No user found, cannot store push token');
        return;
      }

      // Extract token from subscription
      let token = '';
      if (subscription.endpoint) {
        token = subscription.endpoint;
      } else if (typeof subscription === 'string') {
        token = subscription;
      } else if (subscription.subscriptionId) {
        token = subscription.subscriptionId;
      }

      if (!token) {
        console.log('❌ No token found in subscription:', subscription);
        return;
      }

      console.log('🔔 Storing push token for user:', user.id);

      // Call our edge function to store the token
      const { error } = await supabase.functions.invoke('store-push-token', {
        body: {
          userId: user.id,
          token: token,
          platform: 'web'
        }
      });

      if (error) {
        console.error('❌ Error storing push token:', error);
      } else {
        console.log('✅ Push token stored successfully');
      }
    } catch (error) {
      console.error('❌ Error in storePushToken:', error);
    }
  }
}

export const progressierNotificationService = ProgressierNotificationService.getInstance();