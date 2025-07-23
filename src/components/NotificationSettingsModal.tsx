
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Bell, BellOff, Smartphone, Monitor } from 'lucide-react';
import { platformNotificationService } from '../services/platformNotificationService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationsEnabled: boolean;
  onNotificationsToggle: (enabled: boolean) => void;
  onTestNotification: () => void;
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  notificationsEnabled,
  onNotificationsToggle,
  onTestNotification
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const isNative = platformNotificationService.isNativePlatform();
  const platformName = platformNotificationService.getPlatformName();

  const handleToggle = async (enabled: boolean) => {
    console.log('🔔 NotificationSettingsModal: handleToggle called with enabled:', enabled);
    console.log('🔔 NotificationSettingsModal: Current platform enabled status:', platformNotificationService.getEnabled());
    console.log('🔔 NotificationSettingsModal: Is native platform:', isNative);
    
    if (enabled && !platformNotificationService.getEnabled()) {
      setIsRequesting(true);
      try {
        console.log('🔔 NotificationSettingsModal: Requesting permission for platform:', platformName);
        const success = await platformNotificationService.requestPermission();
        console.log('🔔 NotificationSettingsModal: Permission request result:', success);
        
        if (success) {
          onNotificationsToggle(true);
        } else {
          // Show platform-specific error message
          const errorMessage = isNative 
            ? `Please enable notifications for Pocket Pause in your ${platformName} device settings. Go to Settings → Notifications → Pocket Pause and make sure notifications are allowed.`
            : platformNotificationService.isMobileWeb()
              ? 'Tap "Allow" when your browser asks for notification permission. If you don\'t see a prompt, look for a notification icon in your browser\'s address bar.'
              : 'Please allow notifications in your browser settings to enable this feature. Click the notification icon in your browser\'s address bar or check your browser settings.';
          console.log('🔔 NotificationSettingsModal: Showing error message:', errorMessage);
          alert(errorMessage);
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        alert('Failed to enable notifications. Please try again or check your device settings.');
      } finally {
        setIsRequesting(false);
      }
    } else {
      onNotificationsToggle(enabled);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Platform indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isNative ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
            <span>
              Running on {isNative ? `${platformName} device` : 'web browser'}
            </span>
          </div>

          {/* Main toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="notifications" className="text-base font-medium">
                {isNative ? 'Push Notifications' : 'Browser Notifications'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isNative 
                  ? 'Get notified when your paused items are ready for review'
                  : 'Receive notifications in your browser when items are ready'
                }
              </p>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={handleToggle}
              disabled={isRequesting}
            />
          </div>

          {/* Test notification button */}
          {notificationsEnabled && (
            <div className="pt-4 border-t">
              <Button
                onClick={onTestNotification}
                variant="outline"
                className="w-full"
              >
                Send Test Notification
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {isNative 
                  ? 'Test notifications will appear in your device notification center'
                  : 'Test notifications will appear as browser notifications'
                }
              </p>
            </div>
          )}

          {/* Platform-specific help text */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            {isNative ? (
              <div>
                <p className="font-medium mb-1">For {platformName} devices:</p>
                <p>If notifications aren't working, go to your device Settings → Notifications → Pocket Pause and ensure notifications are enabled. You may also need to allow notifications when prompted by the app.</p>
              </div>
            ) : (
              <div>
                <p className="font-medium mb-1">For web browsers:</p>
                <p>If you don't see the permission prompt, look for a notification icon in your browser's address bar, or check your browser's notification settings and allow notifications for this site.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationSettingsModal;
