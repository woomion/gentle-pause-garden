
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.d8f905f096334ebf8ec79330adbb61fe',
  appName: 'gentle-pause-garden',
  webDir: 'dist',
  server: {
    url: "https://d8f905f0-9633-4ebf-8ec7-9330adbb61fe.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
  android: {
    intentFilters: [
      {
        action: 'android.intent.action.SEND',
        category: 'android.intent.category.DEFAULT',
        type: 'text/plain'
      }
    ]
  },
  ios: {
    contentInset: 'always',
    scheme: 'pocketpause',
    limitsNavigationsToAppBoundDomains: true,
    minVersion: '13.0'
  }
};

export default config;
