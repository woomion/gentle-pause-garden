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
    
    console.log('🔔 PlatformNotificationService: Scheduling web notification:', {
      title,
      body,
      delayMs
    });

    await webNotificationService.scheduleNotification(title, body, delayMs);
  }

  async requestPermission(): Promise<boolean> {
    console.log('🔔 Platform service: Requesting Progressier push notification permission');
    return await progressierNotificationService.requestPermission();
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.getEnabled()) {
      console.log('🔔 Platform notification service disabled, skipping notification');
      return;
    }

    console.log('🔔 Showing notification via Progressier:', { title, options });
    
    // Use Progressier for push notifications
    await progressierNotificationService.sendNotification(title, options.body || '', {
      icon: options.icon,
      badge: options.badge,
      tag: options.tag
    });
  }

  async isSubscribed(): Promise<boolean> {
    return await progressierNotificationService.isSubscribed();
  }

  async unsubscribe(): Promise<boolean> {
    return await progressierNotificationService.unsubscribe();
  }

  async testNotification(): Promise<void> {
    await progressierNotificationService.testNotification();
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