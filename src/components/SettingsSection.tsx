import React, { useState } from 'react';
import { Settings, Bell, User, Moon, Sun, Palette, ChevronDown, ChevronRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTheme } from '@/components/ThemeProvider';
import NotificationSettingsModal from './NotificationSettingsModal';

import { useUserSettings } from '@/hooks/useUserSettings';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { platformNotificationService } from '@/services/platformNotificationService';


const SettingsSection = () => {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  
  
  // Collapsible state for each section
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  
  
  const { notificationsEnabled, updateNotificationSetting, loading } = useUserSettings();
  const { enableNotifications, testNotification } = useNotifications(notificationsEnabled);
  const { user } = useAuth();
  
  const { toast } = useToast();
  const { theme, setTheme, actualTheme } = useTheme();

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      // Request permission using platform service
      const permissionGranted = await enableNotifications();
      if (!permissionGranted) {
        const isNative = platformNotificationService.isNativePlatform();
        const platformName = platformNotificationService.getPlatformName();
        
        const errorMessage = isNative 
          ? `Please enable notifications for Pocket Pause in your ${platformName} device settings. Go to Settings → Notifications → Pocket Pause and make sure notifications are allowed.`
          : platformNotificationService.isMobileWeb()
            ? 'Tap "Allow" when your browser asks for notification permission. If you don\'t see a prompt, look for a notification icon in your browser\'s address bar.'
            : 'Please allow notifications in your browser settings to enable this feature. Click the notification icon in your browser\'s address bar or check your browser settings.';
            
        toast({
          title: "Permission denied",
          description: errorMessage,
          variant: "destructive"
        });
        return false;
      }
    }
    
    return await updateNotificationSetting(enabled);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-bold text-foreground">Settings</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-bold text-foreground">Settings</h3>
      </div>

      {/* Notifications */}
      <Collapsible open={notificationsOpen} onOpenChange={setNotificationsOpen}>
        <CollapsibleTrigger className="w-full">
          <Card className="bg-card border-border cursor-pointer hover:bg-card/80 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Notifications
                </div>
                {notificationsOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </CardTitle>
              <CardDescription className="text-sm text-left">
                Get notified when your paused items are ready for review
              </CardDescription>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="bg-card border-border border-t-0 rounded-t-none">
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications-enabled" className="text-sm font-medium">
                  Enable notifications
                </Label>
                <Switch
                  id="notifications-enabled"
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>
              
              {notificationsEnabled && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      console.log('🔔 Opening notification settings modal');
                      console.log('🔔 Platform:', navigator.userAgent);
                      setShowNotificationSettings(true);
                    }}
                    className="flex-1 text-xs h-8"
                  >
                    Notification Schedule
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testNotification}
                    className="text-xs h-8"
                  >
                    Test
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Account & Profile */}
      <Collapsible open={accountOpen} onOpenChange={setAccountOpen}>
        <CollapsibleTrigger className="w-full">
          <Card className="bg-card border-border cursor-pointer hover:bg-card/80 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Account
                </div>
                {accountOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </CardTitle>
              <CardDescription className="text-sm text-left">
                Manage your account settings and preferences
              </CardDescription>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="bg-card border-border border-t-0 rounded-t-none">
            <CardContent className="space-y-4 pt-4">
              {user && (
                <div className="text-sm">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium text-foreground">{user.email}</p>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Theme</Label>
                <div className="flex items-center gap-1">
                  <Button 
                    variant={actualTheme === 'light' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setTheme('light')}
                  >
                    <Sun className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={actualTheme === 'dark' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setTheme('dark')}
                  >
                    <Moon className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={theme === 'system' ? 'default' : 'ghost'} 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => setTheme('system')}
                  >
                    <Palette className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs h-8"
                >
                  Change Password
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full text-xs h-8"
                >
                   Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>


      {/* Modals */}
      <NotificationSettingsModal
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
        notificationsEnabled={notificationsEnabled}
        onNotificationsToggle={handleNotificationToggle}
        onTestNotification={() => {}}
      />

    </div>
  );
};

export default SettingsSection;