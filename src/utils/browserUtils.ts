import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

/**
 * Opens a URL in the device's default browser (external to the app)
 * Works correctly both in web and mobile (Capacitor) environments
 */
export const openExternalUrl = async (url: string): Promise<void> => {
  try {
    if (Capacitor.isNativePlatform()) {
      // We're in a Capacitor app, use the Browser plugin
      await Browser.open({ url });
    } else {
      // We're in a web browser, use standard window.open
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.error('Failed to open external URL:', error);
    // Fallback to window.open if Browser plugin fails
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

/**
 * Checks if we're running in a Capacitor mobile app
 */
export const isCapacitorApp = (): boolean => {
  return Capacitor.isNativePlatform();
};