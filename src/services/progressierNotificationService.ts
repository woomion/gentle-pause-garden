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
      
      // Wait for both DOM and Progressier script to be ready
      return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 100; // Try for 10 seconds
        
        const checkProgressier = () => {
          attempts++;
          console.log(`🔔 Progressier check attempt ${attempts}/${maxAttempts}`);
          
          if (window.progressierRegistration) {
            console.log('🔔 Progressier registration object found, waiting for ready...');
            window.progressierRegistration.ready
              .then(() => {
                console.log('✅ Progressier: Ready and initialized');
                resolve(true);
              })
              .catch((error) => {
                console.error('❌ Progressier ready promise failed:', error);
                resolve(false);
              });
          } else if (attempts < maxAttempts) {
            setTimeout(checkProgressier, 100);
          } else {
            console.log('❌ Progressier: Failed to initialize after', maxAttempts, 'attempts');
            console.log('❌ Window object keys:', Object.keys(window).filter(k => k.includes('progress')));
            resolve(false);
          }
        };
        
        // Start checking immediately, but also wait for DOM ready
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            setTimeout(checkProgressier, 100); // Give script a moment to load
          });
        } else {
          setTimeout(checkProgressier, 100);
        }
      });
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