// Web-only notification service to replace platform notification service

export class WebNotificationService {
  private static instance: WebNotificationService;

  private constructor() {}

  static getInstance(): WebNotificationService {
    if (!WebNotificationService.instance) {
      WebNotificationService.instance = new WebNotificationService();
    }
    return WebNotificationService.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('🔔 Web notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('🔔 Web notifications denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async scheduleNotification(title: string, body: string, delayMs: number): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      console.log('🔔 No notification permission');
      return;
    }

    setTimeout(() => {
      new Notification(title, {
        body,
        icon: '/icons/app-icon-512.png',
        badge: '/icons/app-icon-512.png',
      });
    }, delayMs);
  }

  showNotification(title: string, options: NotificationOptions = {}): void {
    if (Notification.permission === 'granted') {
      console.log('🔔 Showing notification:', title, options.body);
      
      // Clean options to only include valid Notification constructor properties
      const notificationOptions: NotificationOptions = {
        body: options.body || '',
        icon: options.icon || '/icons/app-icon-512.png',
        badge: options.badge || '/icons/app-icon-512.png',
        tag: options.tag || 'pocket-pause-review',
        requireInteraction: options.requireInteraction || false,
        silent: false
      };
      
      const notification = new Notification(title, notificationOptions);
      
      // Add click handler to open the app
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } else {
      console.log('🔔 Web notification permission not granted, current permission:', Notification.permission);
    }
  }
}

export const webNotificationService = WebNotificationService.getInstance();