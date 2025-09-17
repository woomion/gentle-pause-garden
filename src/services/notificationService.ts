export class NotificationService {
  private static instance: NotificationService;
  private isEnabled = false;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('❌ This browser does not support notifications');
      return false;
    }

    // Check if permission is actually granted (including dev override)
    const { ensureNotificationPermission } = await import('../utils/ensureNotificationPermission');
    const permission = await ensureNotificationPermission();
    
    this.isEnabled = permission === 'granted';
    console.log('🔔 Final notification permission result:', permission, 'enabled:', this.isEnabled);
    return this.isEnabled;
  }

  showNotification(title: string, options: NotificationOptions = {}) {
    console.log('🔔 showNotification called with:', { title, options });
    console.log('🔔 Service enabled:', this.isEnabled);
    console.log('🔔 Browser permission:', Notification.permission);
    console.log('🔔 Page visibility:', document.visibilityState);
    console.log('🔔 User agent:', navigator.userAgent);
    
    // Check permission with dev override
    let permissionGranted = Notification.permission === 'granted';
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      permissionGranted = true; // Override for dev mode
    }
    
    if (!this.isEnabled || !permissionGranted) {
      console.log('❌ Notifications not enabled or permission not granted', { enabled: this.isEnabled, permissionGranted });
      return;
    }

    try {
      console.log('🚀 Creating notification...');
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        requireInteraction: false,
        silent: false,
        ...options
      });
      
      console.log('✅ Notification created successfully:', notification);
      
      notification.onshow = () => {
        console.log('📱 Notification shown');
        // Auto-close after 10 seconds to prevent notification spam
        setTimeout(() => {
          if (notification) {
            notification.close();
          }
        }, 10000);
      };
      notification.onclick = () => {
        console.log('👆 Notification clicked');
        window.focus();
        notification.close();
      };
      notification.onclose = () => console.log('❌ Notification closed');
      notification.onerror = (error) => console.log('❌ Notification error:', error);
      
      return notification;
    } catch (error) {
      console.error('❌ Error creating notification:', error);
      console.log(`📱 Notification would show: ${title}`, options);
      return null;
    }
  }

  setEnabled(enabled: boolean) {
    console.log('🔔 Setting notification service enabled to:', enabled);
    
    // Check permission with dev override
    let permissionGranted = Notification.permission === 'granted';
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      permissionGranted = true; // Override for dev mode
    }
    
    if (enabled && permissionGranted) {
      this.isEnabled = true;
      console.log('✅ Notification service enabled');
    } else if (!enabled) {
      this.isEnabled = false;
      console.log('❌ Notification service disabled');
    } else {
      console.log('⚠️ Cannot enable notifications - permission not granted');
      this.isEnabled = false;
    }
  }

  getEnabled(): boolean {
    // Check if we're in dev mode and override permission check
    let permissionGranted = Notification.permission === 'granted';
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      permissionGranted = true; // Override for dev mode
    }
    
    const result = this.isEnabled && permissionGranted;
    console.log('🔔 getEnabled result:', result, '(service:', this.isEnabled, 'permission:', Notification.permission, 'dev-override:', window.location.hostname === 'localhost', ')');
    return result;
  }
}

export const notificationService = NotificationService.getInstance();
