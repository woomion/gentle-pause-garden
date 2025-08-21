import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d8f905f096334ebf8ec79330adbb61fe',
  appName: 'gentle-pause-garden',
  webDir: 'dist',
  server: {
    url: 'https://d8f905f0-9633-4ebf-8ec7-9330adbb61fe.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    Browser: {
      // Always open external URLs in the device's default browser
      allowMultipleWindows: false,
      androidBrowserType: 'customTabs', // Use Chrome Custom Tabs on Android
      windowName: '_blank'
    }
  }
};

export default config;