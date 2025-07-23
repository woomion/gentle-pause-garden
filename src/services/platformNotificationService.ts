
import { Capacitor } from '@capacitor/core';
import { notificationService } from './notificationService';
import { pushNotificationService } from './pushNotificationService';

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
    return Capacitor.isNativePlatform();
  }

  async requestPermission(): Promise<boolean> {
    if (this.isNativePlatform()) {
      // On native platforms, use push notifications
      console.log('🔔 Platform service: Requesting push notification permission');
      return await pushNotificationService.initialize();
    } else {
      // On web, use browser notifications
      console.log('🔔 Platform service: Requesting browser notification permission');
      return await notificationService.requestPermission();
    }
  }

  async showNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    if (this.isNativePlatform()) {
      // For native platforms, notifications are handled by the push service
      // which sends to the device through FCM/APNs
      console.log('🔔 Native platform - notifications handled by push service');
      return;
    } else {
      // On web, show browser notification
      notificationService.showNotification(title, options);
    }
  }

  setEnabled(enabled: boolean): void {
    if (this.isNativePlatform()) {
      // Push notifications are managed differently - they're enabled/disabled
      // through the native system settings
      console.log('🔔 Native platform - push notifications managed by system');
    } else {
      notificationService.setEnabled(enabled);
    }
  }

  getEnabled(): boolean {
    if (this.isNativePlatform()) {
      // Check if push notification service is initialized and has permission
      const isInitialized = pushNotificationService.isServiceInitialized();
      const hasPermission = pushNotificationService.getPermissionStatus();
      console.log('🔔 Platform service: Push service initialized:', isInitialized, 'has permission:', hasPermission);
      return isInitialized && hasPermission;
    } else {
      return notificationService.getEnabled();
    }
  }

  getPlatformName(): string {
    if (this.isNativePlatform()) {
      return Capacitor.getPlatform();
    }
    return 'web';
  }
}

export const platformNotificationService = PlatformNotificationService.getInstance();
