import { notificationService } from './notificationService';
import { webNotificationService } from './webNotificationService';
import { progressierNotificationService } from './progressierNotificationService';

export class PlatformNotificationService {
  private static instance: PlatformNotificationService;

  private constructor() {}

  static getInstance(): PlatformNotificationService {
    if (!PlatformNotificationService.instance) {
      PlatformNotificationService.instance = new PlatformNotificationService();
    }
    return PlatformNotificationService.instance;
  }

  isNativePlatform(): boolean {
    // Always return false since we removed Capacitor
    return false;
  }

  async initialize(): Promise<boolean> {
    console.log('🔔 PlatformNotificationService: Initializing Progressier push notifications...');
    return await progressierNotificationService.initialize();
  }

  async scheduleNotification(
    title: string,
    body: string,
    options: {
      delayMs?: number;
      userId?: string;
    } = {}
  ): Promise<void> {
    const { delayMs = 0 } = options;
    
    console.log('🔔 PlatformNotificationService: Scheduling notification:', {
      title,
      body,
      delayMs,
      isProgressierSubscribed: await progressierNotificationService.isSubscribed()
    });

    // Use showNotification which properly routes through Progressier first
    if (delayMs > 0) {
      setTimeout(() => {
        this.showNotification(title, { body });
      }, delayMs);
    } else {
      await this.showNotification(title, { body });
    }
  }

  async requestPermission(): Promise<boolean> {
    console.log('🔔 Platform service: Requesting push notification permission...');
    
    // Try Progressier first
    const progressierResult = await progressierNotificationService.requestPermission();
    if (progressierResult) {
      console.log('✅ Progressier permission granted');
      return true;
    }
    
    // Fallback to regular browser notifications
    console.log('⚠️ Progressier failed, falling back to browser notifications');
    const browserResult = await notificationService.requestPermission();
    console.log('🔔 Browser notification permission result:', browserResult);
    
    return browserResult;
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.getEnabled()) {
      console.log('🔔 Platform notification service disabled, skipping notification');
      return;
    }

    console.log('🔔 Showing notification:', { title, options });
    
    // Try Progressier first
    const isProgressierSubscribed = await progressierNotificationService.isSubscribed();
    if (isProgressierSubscribed) {
      console.log('🔔 Using Progressier for notification');
      await progressierNotificationService.sendNotification(title, options.body || '', {
        icon: options.icon,
        badge: options.badge,
        tag: options.tag
      });
    } else {
      // Fallback to browser notifications
      console.log('🔔 Using browser notifications as fallback');
      notificationService.showNotification(title, options);
    }
  }

  async isSubscribed(): Promise<boolean> {
    return await progressierNotificationService.isSubscribed();
  }

  async unsubscribe(): Promise<boolean> {
    return await progressierNotificationService.unsubscribe();
  }

  async testNotification(): Promise<void> {
    console.log('🔔 Testing notifications...');
    
    // Log full notification status for debugging
    const progressierSubscribed = await progressierNotificationService.isSubscribed();
    const browserPermission = Notification.permission;
    const serviceEnabled = this.getEnabled();
    
    console.log('🔔 Full notification status:', {
      permission: browserPermission,
      serviceEnabled,
      settingsEnabled: notificationService.getEnabled(),
      progressierSubscribed,
      user: !!document.querySelector('meta[name="user-authenticated"]')
    });
    
    // Try Progressier test first
    if (progressierSubscribed) {
      console.log('🔔 Sending test via Progressier');
      await progressierNotificationService.testNotification();
    } else {
      // Fallback to browser notification
      console.log('🔔 Sending test via browser notifications');
      notificationService.showNotification('Test Notification', {
        body: 'This is a test from Pocket Pause! Your notifications are working.',
        icon: '/icons/app-icon-512.png'
      });
    }
  }

  setEnabled(enabled: boolean): void {
    notificationService.setEnabled(enabled);
  }

  getEnabled(): boolean {
    return notificationService.getEnabled();
  }

  isMobileWeb(): boolean {
    const userAgent = navigator.userAgent;
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  }

  getPlatformName(): string {
    return 'web';
  }
}

export const platformNotificationService = PlatformNotificationService.getInstance();