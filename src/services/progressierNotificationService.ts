// Progressier PWA Push Notification Service
// This service wraps Progressier's API for push notifications

declare global {
  interface Window {
    progressier?: {
      subscribe: () => Promise<any>;
      unsubscribe: () => Promise<any>;
      isSubscribed: () => Promise<boolean>;
      showOptIn: () => void;
      hideOptIn: () => void;
      push: (options: {
        title: string;
        body: string;
        icon?: string;
        badge?: string;
        tag?: string;
        data?: any;
      }) => Promise<any>;
    };
    progressierRegistration?: any;
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
      
      // Wait for DOM to be ready first
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }
      
      // Give Progressier script time to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if Progressier API is available through the global object
      if (typeof window.progressier !== 'undefined' && window.progressier) {
        console.log('✅ Progressier: Ready and initialized via global object');
        console.log('🔔 Available Progressier methods:', Object.keys(window.progressier));
        return true;
      }
      
      console.log('❌ Progressier: Not available');
      console.log('❌ Available Progressier objects:', Object.keys(window).filter(k => k.includes('progress')));
      return false;
    } catch (error) {
      console.error('❌ Progressier: Initialization error:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      const initialized = await this.initialize();
      if (!initialized) {
        console.log('❌ Progressier not available, falling back to browser notifications');
        
        // Fallback to standard browser notifications
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          console.log('🔔 Browser notification permission:', permission);
          return permission === 'granted';
        }
        return false;
      }

      if (!window.progressier) {
        console.log('❌ Progressier API not available');
        return false;
      }

      // Check if already subscribed
      if (typeof window.progressier.isSubscribed === 'function') {
        const isSubscribed = await window.progressier.isSubscribed();
        if (isSubscribed) {
          console.log('✅ Already subscribed to push notifications');
          return true;
        }
      }

      // Show Progressier's opt-in UI and subscribe if methods exist
      if (typeof window.progressier.showOptIn === 'function') {
        window.progressier.showOptIn();
      }
      
      // Subscribe for push notifications
      if (typeof window.progressier.subscribe === 'function') {
        const subscription = await window.progressier.subscribe();
        console.log('🔔 Progressier subscription result:', subscription);
        
        // Check subscription status again if possible
        const nowSubscribed = typeof window.progressier.isSubscribed === 'function' 
          ? await window.progressier.isSubscribed()
          : true; // Assume success if we can't check
          
        console.log('🔔 Push notification subscription result:', nowSubscribed);
        
        // Store the push token in our database
        if (nowSubscribed && subscription) {
          await this.storePushToken(subscription);
        }
        
        return nowSubscribed;
      } else {
        console.log('❌ Progressier.subscribe method not available');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting push permission:', error);
      return false;
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && window.progressier) {
        // Since isSubscribed method isn't available, check if we have a service worker push subscription
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          const hasSubscription = subscription !== null;
          console.log('🔔 Push subscription status:', hasSubscription);
          return hasSubscription;
        }
      }
      console.log('❌ Service worker or PushManager not available');
      return false;
    } catch (error) {
      console.error('❌ Error checking subscription status:', error);
      return false;
    }
  }

  async unsubscribe(): Promise<boolean> {
    try {
      const initialized = await this.initialize();
      if (!initialized || !window.progressier) {
        return false;
      }

      if (typeof window.progressier.unsubscribe === 'function') {
        await window.progressier.unsubscribe();
        console.log('🔔 Unsubscribed from push notifications');
        return true;
      } else {
        console.log('❌ Progressier.unsubscribe method not available');
        return false;
      }
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
      const initialized = await this.initialize();
      if (!initialized || !window.progressier) {
        console.log('❌ Progressier not available for sending notification, using browser fallback');
        
        // Fallback to browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: options.icon || '/icons/app-icon-512.png',
            badge: options.badge || '/icons/app-icon-512.png',
            tag: options.tag || 'pocket-pause',
            data: options.data || {}
          });
          console.log('✅ Browser notification sent');
        }
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

      if (typeof window.progressier.push === 'function') {
        await window.progressier.push(notificationOptions);
        console.log('✅ Push notification sent via Progressier');
      } else {
        console.log('❌ Progressier.push method not available, using browser notification');
        // Fallback to browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: options.icon || '/icons/app-icon-512.png',
            badge: options.badge || '/icons/app-icon-512.png',
            tag: options.tag || 'pocket-pause',
            data: options.data || {}
          });
          console.log('✅ Browser notification sent');
        }
      }
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