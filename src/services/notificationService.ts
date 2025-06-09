
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
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.isEnabled = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      try {
        const permission = await Notification.requestPermission();
        this.isEnabled = permission === 'granted';
        return this.isEnabled;
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
      }
    }

    return false;
  }

  showNotification(title: string, options: NotificationOptions = {}) {
    if (!this.isEnabled || Notification.permission !== 'granted') {
      console.log('Notifications not enabled or permission not granted');
      return;
    }

    try {
      // Try to use the standard Notification constructor
      return new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      // If the constructor fails (like on some mobile browsers), 
      // we'll just log the notification instead of crashing
      console.log(`Notification would show: ${title}`, options);
      return null;
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  getEnabled(): boolean {
    return this.isEnabled && Notification.permission === 'granted';
  }
}

export const notificationService = NotificationService.getInstance();
