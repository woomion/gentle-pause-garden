import React, { useState } from 'react';
import { Settings, Bell, Tag, Users, User, Moon, Sun, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import NotificationSettingsModal from './NotificationSettingsModal';
import TagManagement from './TagManagement';
import PartnerManagement from './PartnerManagement';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SettingsSection = () => {
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showTagManagement, setShowTagManagement] = useState(false);
  const [showPartnerManagement, setShowPartnerManagement] = useState(false);
  
  const { notificationsEnabled, updateNotificationSetting, loading } = useUserSettings();
  const { enableNotifications, testNotification } = useNotifications(notificationsEnabled);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      // Request browser permission first
      const permissionGranted = await enableNotifications();
      if (!permissionGranted) {
        toast({
          title: "Permission denied",
          description: "Please allow notifications in your browser to enable this feature.",
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
          <h3 className="text-lg font-bold text-black dark:text-[#F9F5EB]">Settings</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-bold text-black dark:text-[#F9F5EB]">Settings</h3>
      </div>

      {/* Notifications */}
      <Card className="bg-white/40 dark:bg-white/5 border-gray-200 dark:border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
          <CardDescription className="text-sm">
            Get notified when your paused items are ready for review
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                onClick={() => setShowNotificationSettings(true)}
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

      {/* Account & Profile */}
      <Card className="bg-white/40 dark:bg-white/5 border-gray-200 dark:border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" />
            Account
          </CardTitle>
          <CardDescription className="text-sm">
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="text-sm">
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-medium text-black dark:text-[#F9F5EB]">{user.email}</p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Theme</Label>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Sun className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Moon className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Palette className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organization */}
      <Card className="bg-white/40 dark:bg-white/5 border-gray-200 dark:border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Organization
          </CardTitle>
          <CardDescription className="text-sm">
            Manage tags and categories for your paused items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTagManagement(true)}
            className="w-full text-xs h-8"
          >
            Manage Tags
          </Button>
        </CardContent>
      </Card>

      {/* Pause Partners */}
      <Card className="bg-white/40 dark:bg-white/5 border-gray-200 dark:border-white/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Pause Partners
          </CardTitle>
          <CardDescription className="text-sm">
            Connect with partners and share your mindful shopping journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPartnerManagement(true)}
            className="w-full text-xs h-8"
          >
            Manage Partners
          </Button>
        </CardContent>
      </Card>

      {/* Modals */}
      <NotificationSettingsModal
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
        notificationsEnabled={notificationsEnabled}
        onNotificationToggle={handleNotificationToggle}
      />

      {showTagManagement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#200E3B] rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-black dark:text-[#F9F5EB]">
                  Tag Management
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowTagManagement(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
              <TagManagement onClose={() => setShowTagManagement(false)} />
            </div>
          </div>
        </div>
      )}

      {showPartnerManagement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#200E3B] rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-black dark:text-[#F9F5EB]">
                  Pause Partners
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPartnerManagement(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
              <PartnerManagement onClose={() => setShowPartnerManagement(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsSection;