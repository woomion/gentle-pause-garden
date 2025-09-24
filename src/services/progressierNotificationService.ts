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
      add: (userData: {
        id?: string;
        email?: string;
        tags?: string | string[];
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
      
      // Let Progressier handle its own prompts
      console.log('🔔 Progressier: Will handle push prompts automatically');
      
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
      // Wait for service worker to be ready first
      await navigator.serviceWorker.ready;
      console.log('✅ Service worker ready');

      const initialized = await this.initialize();
      if (!initialized) {
        console.log('❌ Progressier not available');
        return false;
      }

      if (!window.progressier) {
        console.log('❌ Progressier API not available');
        return false;
      }

      // Request permission and subscribe (user gesture recommended on iOS)
      const isAlreadySubscribed = await window.progressier.isSubscribed();
      if (!isAlreadySubscribed) {
        await window.progressier.subscribe();
      }

      // Identify the user so backend can target pushes
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        if (typeof (window.progressier as any).setUserId === 'function') {
          await (window.progressier as any).setUserId(user.id);
          console.log('✅ User ID set with Progressier:', user.id);
        } else if (typeof (window.progressier as any).add === 'function') {
          await (window.progressier as any).add({ 
            id: user.id, 
            email: user.email, 
            tags: ['authenticated', 'push-enabled'] 
          });
          console.log('✅ User registered with Progressier');
        }

        // Store token using Supabase client (not from SW)
        const nowSubscribed = await window.progressier.isSubscribed();
        if (nowSubscribed) {
          await this.storePushToken({ subscribed: true });
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Error requesting push permission:', error);
      return false;
    }
  }

  // Moved user registration logic to requestPermission method
  // This method is now deprecated and kept for backwards compatibility

  private async verifyProgressierRegistration(userId: string): Promise<void> {
    try {
      console.log('🔍 Verifying Progressier registration for user:', userId);
      
      // Test if backend can target this user by sending a test request
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase.functions.invoke('send-push-notifications', {
        body: {
          userIds: [userId],
          title: 'Registration Test',
          body: 'Testing user registration',
          test: true // Flag to indicate this is a test
        }
      });
      
      if (error) {
        console.log('⚠️ Backend targeting test failed:', error);
      } else {
        console.log('✅ Backend targeting verified for user:', userId);
      }
    } catch (error) {
      console.log('⚠️ Could not verify registration:', error);
    }
  }

  private async storeProgressierRegistration(userId: string): Promise<void> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Store that this user is registered with Progressier for backend targeting
      const { error } = await supabase.functions.invoke('store-push-token', {
        body: {
          userId: userId,
          token: `progressier_user_${userId}`,
          platform: 'progressier'
        }
      });
      
      if (error) {
        console.error('❌ Error storing Progressier registration:', error);
      } else {
        console.log('✅ Progressier registration stored for backend targeting');
      }
    } catch (error) {
      console.error('❌ Error in storeProgressierRegistration:', error);
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      if (typeof window !== 'undefined' && window.progressier) {
        // Prefer Progressier's own API when available
        const api: any = window.progressier as any;
        if (typeof api.isSubscribed === 'function') {
          const subscribed = await api.isSubscribed();
          console.log('🔔 Progressier.isSubscribed():', subscribed);
          return !!subscribed;
        }

        // Fallback: check generic PushManager subscription
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          const hasSubscription = subscription !== null;
          console.log('🔔 PushManager subscription status:', hasSubscription);
          return hasSubscription;
        }
      }
      console.log('❌ Progressier API or SW/Push not available');
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

      if (typeof (window.progressier as any)?.unsubscribe === 'function') {
        await (window.progressier as any).unsubscribe();
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

      if (typeof (window.progressier as any)?.push === 'function') {
        await (window.progressier as any).push(notificationOptions);
        console.log('✅ Push notification sent via Progressier');
      } else {
        console.log('❌ Progressier.push method not available');
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

      console.log('🔔 Storing push token for user:', user.id);

      // Call our edge function to store the token using Supabase client (not from SW)
      const { error } = await supabase.functions.invoke('store-push-token', {
        body: {
          userId: user.id,
          token: 'progressier-managed',
          endpoint: 'progressier-managed',
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