
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

    if (Notification.permission === 'granted') {
      this.isEnabled = true;
      console.log('✅ Notification permission already granted');
      return true;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        this.isEnabled = permission === 'granted';
        console.log('🔔 Notification permission result:', permission);
        return this.isEnabled;
      } catch (error) {
        console.error('❌ Error requesting notification permission:', error);
        return false;
      }
    }

    console.log('❌ Notification permission denied');
    return false;
  }

  showNotification(title: string, options: NotificationOptions = {}) {
    console.log('🔔 showNotification called with:', { title, options });
    console.log('🔔 Service enabled:', this.isEnabled);
    console.log('🔔 Browser permission:', Notification.permission);
    
    if (!this.isEnabled || Notification.permission !== 'granted') {
      console.log('❌ Notifications not enabled or permission not granted');
      return;
    }

    try {
      console.log('🚀 Creating notification...');
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
      
      console.log('✅ Notification created successfully:', notification);
      
      notification.onshow = () => console.log('📱 Notification shown');
      notification.onclick = () => console.log('👆 Notification clicked');
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
    // Only enable if we actually have permission
    if (enabled && Notification.permission === 'granted') {
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
    const result = this.isEnabled && Notification.permission === 'granted';
    console.log('🔔 getEnabled result:', result, '(service:', this.isEnabled, 'permission:', Notification.permission, ')');
    return result;
  }
}

export const notificationService = NotificationService.getInstance();
