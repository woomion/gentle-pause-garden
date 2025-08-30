import { notificationService } from './notificationService';
import { webNotificationService } from './webNotificationService';

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
    console.log('🔔 PlatformNotificationService: Initializing web notifications...');
    return await webNotificationService.requestPermission();
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
    console.log('🔔 Platform service: Requesting browser notification permission');
    return await webNotificationService.requestPermission();
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (!this.getEnabled()) {
      console.log('🔔 Platform notification service disabled, skipping notification');
      return;
    }

    console.log('🔔 Showing notification via web service:', { title, options });
    
    // Use web notification service directly
    webNotificationService.showNotification(title, options);
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