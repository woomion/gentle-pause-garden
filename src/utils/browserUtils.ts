/**
 * Opens a URL in the device's default browser (external to the app)
 * Works in web and PWA environments
 */
export const openExternalUrl = async (url: string): Promise<void> => {
  try {
    window.open(url, '_blank', 'noopener,noreferrer');
  } catch (error) {
    console.error('Failed to open external URL:', error);
  }
};

/**
 * Checks if we're running in a PWA or mobile browser
 */
export const isCapacitorApp = (): boolean => {
  return false; // No longer using Capacitor
};