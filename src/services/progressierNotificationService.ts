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
      
      // Add pusheligible event listener for Progressier
      window.addEventListener('pusheligible', () => {
        console.log('🔔 Progressier: Push eligible event triggered');
        this.showPushPrompt();
      });
      
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

  private showPushPrompt(): void {
    // Show a custom UI prompt for push notifications
    const prompt = document.createElement('div');
    prompt.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 10000;
        max-width: 300px;
        font-family: system-ui, -apple-system, sans-serif;
      ">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
          🔔 Get notified when items are ready
        </h3>
        <p style="margin: 0 0 12px 0; font-size: 12px; color: #666;">
          We'll send you a notification when your paused items are ready for review.
        </p>
        <div style="display: flex; gap: 8px;">
          <button id="progressier-allow" style="
            background: #007bff;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
          ">Allow</button>
          <button id="progressier-deny" style="
            background: #f8f9fa;
            color: #666;
            border: 1px solid #ddd;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
          ">Not now</button>
        </div>
      </div>
    `;

    document.body.appendChild(prompt);

    // Handle allow button
    const allowBtn = prompt.querySelector('#progressier-allow');
    allowBtn?.addEventListener('click', async () => {
      try {
        await this.requestPermission();
        document.body.removeChild(prompt);
      } catch (error) {
        console.error('Error requesting permission:', error);
      }
    });

    // Handle deny button
    const denyBtn = prompt.querySelector('#progressier-deny');
    denyBtn?.addEventListener('click', () => {
      document.body.removeChild(prompt);
    });

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (document.body.contains(prompt)) {
        document.body.removeChild(prompt);
      }
    }, 10000);
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

      // First register the user with Progressier - this is critical for backend targeting
      await this.registerUserWithProgressier();

      // For browsers that support browser notifications, request permission first
      if ('Notification' in window) {
        const browserPermission = await Notification.requestPermission();
        console.log('🔔 Browser notification permission:', browserPermission);
        if (browserPermission !== 'granted') {
          console.log('❌ Browser notification permission denied');
          return false;
        }
      }

      // Check if already subscribed
      if (typeof (window.progressier as any)?.isSubscribed === 'function') {
        const isSubscribed = await (window.progressier as any).isSubscribed();
        if (isSubscribed) {
          console.log('✅ Already subscribed to push notifications');
          await this.storePushToken({ subscribed: true });
          // Re-register user to ensure backend targeting works
          await this.registerUserWithProgressier();
          return true;
        }
      }

      // Subscribe for push notifications
      if (typeof (window.progressier as any)?.subscribe === 'function') {
        const subscription = await (window.progressier as any).subscribe();
        console.log('🔔 Progressier subscription result:', subscription);
        
        // Always re-register after subscription to ensure user ID is properly linked
        await this.registerUserWithProgressier();
        
        // Check subscription status again if possible
        const nowSubscribed = typeof (window.progressier as any)?.isSubscribed === 'function' 
          ? await (window.progressier as any).isSubscribed()
          : true; // Assume success if we can't check
          
        console.log('🔔 Push notification subscription result:', nowSubscribed);
        
        // Store the push token in our database
        if (nowSubscribed) {
          await this.storePushToken(subscription || { subscribed: true });
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

  async registerUserWithProgressier(): Promise<void> {
    try {
      // Get the current user
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('❌ No authenticated user to register with Progressier');
        return;
      }

      if (!window.progressier) {
        console.log('❌ Progressier not available');
        return;
      }

      // Try multiple registration methods for better backend targeting
      let registered = false;
      
      // Method 1: setUserId (most direct for backend targeting)
      if (typeof (window.progressier as any)?.setUserId === 'function') {
        try {
          await (window.progressier as any).setUserId(user.id);
          console.log('✅ User ID set with Progressier (setUserId):', user.id);
          registered = true;
        } catch (error) {
          console.log('⚠️ setUserId failed, trying add method:', error);
        }
      }
      
      // Method 2: add with user data (fallback)
      if (!registered && typeof (window.progressier as any)?.add === 'function') {
        try {
          await (window.progressier as any).add({
            id: user.id,
            tags: ['authenticated']
          });
          console.log('✅ User registered with Progressier (add):', user.id);
          registered = true;
        } catch (error) {
          console.log('❌ Progressier.add method failed:', error);
        }
      }
      
      if (!registered) {
        console.log('❌ No working Progressier registration method found');
      }
    } catch (error) {
      console.error('❌ Error registering user with Progressier:', error);
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

      if (typeof (window.progressier as any)?.push === 'function') {
        await (window.progressier as any).push(notificationOptions);
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