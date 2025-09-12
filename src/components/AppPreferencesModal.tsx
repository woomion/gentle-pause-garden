import React from 'react';
import { X, Palette, Monitor, Sun, Moon, Laptop, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from '@/components/ThemeProvider';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useAuth } from '@/contexts/AuthContext';
import { ensureProgressierSubscribed } from '@/utils/autoTokenSetup';
import { TestNotificationButton } from './TestNotificationButton';
import { useToast } from '@/hooks/use-toast';


interface AppPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppPreferencesModal: React.FC<AppPreferencesModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, actualTheme } = useTheme();
  const { notificationSettings, notificationsEnabled, updateNotificationSettings, updateNotificationSetting, loading } = useUserSettings();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleNotificationToggle = async (checked: boolean) => {
    if (checked && user) {
      try {
        // Use the enhanced subscription method
        const success = await ensureProgressierSubscribed(user);
        
        if (success) {
          console.log('✅ Progressier subscription successful');
          updateNotificationSetting(true);
          toast({
            title: "Push notifications enabled",
            description: "You'll receive notifications when items are ready for review.",
          });
        } else {
          console.log('❌ Progressier subscription failed');
          toast({
            title: "Setup incomplete",
            description: "Please allow notifications in your browser and try again.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('❌ Error enabling push notifications:', error);
        toast({
          title: "Error",
          description: "Failed to enable push notifications. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      updateNotificationSetting(checked);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-start justify-center px-6 pt-16">
      <div className="bg-card rounded-2xl max-w-sm w-full max-h-[90vh] p-6 relative flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            App Preferences
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="space-y-6 pr-3">
            {/* Notifications Section (moved to top for visibility) */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Bell size={16} />
                Notifications
              </Label>
              
              {/* Explicit enable/repair button in case the toggle UI doesn't appear */}
              {user && !notificationsEnabled && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleNotificationToggle(true)}
                  className="w-full"
                >
                  Enable Push Notifications
                </Button>
              )}
              {user && notificationsEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleNotificationToggle(true)}
                  className="w-full"
                >
                  Repair/Resubscribe Push
                </Button>
              )}
              
              {/* Main notification toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="text-sm font-medium">Enable Notifications</div>
                  <div className="text-xs text-muted-foreground">
                    Get notified when paused items are ready for review
                  </div>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={handleNotificationToggle}
                  disabled={loading}
                />
              </div>

              {/* Show delivery options only when notifications are enabled */}
              {notificationsEnabled && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Delivery Style</Label>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        id="item-by-item"
                        name="delivery-style"
                        value="item_by_item"
                        checked={notificationSettings?.deliveryStyle === 'item_by_item'}
                        onChange={(e) => updateNotificationSettings({ deliveryStyle: e.target.value as any })}
                        className="mt-1"
                      />
                      <div>
                        <Label htmlFor="item-by-item" className="text-sm font-medium cursor-pointer">
                          Item-by-item
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Get a notification each time a paused item is ready.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        id="daily-batch"
                        name="delivery-style"
                        value="daily_batch"
                        checked={notificationSettings?.deliveryStyle === 'daily_batch'}
                        onChange={(e) => updateNotificationSettings({ deliveryStyle: e.target.value as any })}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <Label htmlFor="daily-batch" className="text-sm font-medium cursor-pointer">
                          Daily batch
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          One notification per day with all items that are ready.
                        </p>
                        
                        {/* Timing options nested under daily batch */}
                        {notificationSettings?.deliveryStyle === 'daily_batch' && (
                          <div className="mt-3 ml-4 pl-3 border-l-2 border-muted space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground">Timing</Label>
                            <div className="space-y-2">
                              <div className="flex items-start gap-2">
                                <input
                                  type="radio"
                                  id="morning"
                                  name="timing"
                                  value="morning"
                                  checked={notificationSettings?.timing === 'morning'}
                                  onChange={(e) => updateNotificationSettings({ timing: e.target.value as any, timingHour: 8 })}
                                  className="mt-1"
                                />
                                <div>
                                  <Label htmlFor="morning" className="text-xs font-medium cursor-pointer">
                                    Morning (8 AM)
                                  </Label>
                                  <p className="text-xs text-muted-foreground">
                                    Start the day with clarity.
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-2">
                                <input
                                  type="radio"
                                  id="afternoon"
                                  name="timing"
                                  value="afternoon"
                                  checked={notificationSettings?.timing === 'afternoon'}
                                  onChange={(e) => updateNotificationSettings({ timing: e.target.value as any, timingHour: 12 })}
                                  className="mt-1"
                                />
                                <div>
                                  <Label htmlFor="afternoon" className="text-xs font-medium cursor-pointer">
                                    Afternoon (12 PM)
                                  </Label>
                                  <p className="text-xs text-muted-foreground">
                                    Check in at midday.
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-2">
                                <input
                                  type="radio"
                                  id="evening"
                                  name="timing"
                                  value="evening"
                                  checked={notificationSettings?.timing === 'evening'}
                                  onChange={(e) => updateNotificationSettings({ timing: e.target.value as any, timingHour: 18 })}
                                  className="mt-1"
                                />
                                <div>
                                  <Label htmlFor="evening" className="text-xs font-medium cursor-pointer">
                                    Evening (6 PM)
                                  </Label>
                                  <p className="text-xs text-muted-foreground">
                                    Pause and review before the day ends.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        id="muted"
                        name="delivery-style"
                        value="muted"
                        checked={notificationSettings?.deliveryStyle === 'muted'}
                        onChange={(e) => updateNotificationSettings({ deliveryStyle: e.target.value as any })}
                        className="mt-1"
                      />
                      <div>
                        <Label htmlFor="muted" className="text-sm font-medium cursor-pointer">
                          Mute All
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Silence notifications, but keep your Pause List updated.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Test buttons when notifications are enabled */}
              {notificationsEnabled && user && (
                <div className="space-y-3 p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Test Notifications</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mb-2">
                    Use this button to test push notifications (close the app tab first)
                  </div>
                  <TestNotificationButton />
                </div>
              )}
            </div>

            {/* Light/Dark Theme Toggle */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Monitor size={16} />
                Theme Mode
              </Label>
              <div className="flex gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="flex-1 flex items-center gap-2"
                >
                  <Sun size={16} />
                  Light
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="flex-1 flex items-center gap-2"
                >
                  <Moon size={16} />
                  Dark
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                  className="flex-1 flex items-center gap-2"
                >
                  <Laptop size={16} />
                  Auto
                </Button>
              </div>
            </div>

            {/* Color Theme Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Palette size={16} />
                Color Theme
              </Label>
              <ThemeSelector />
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default AppPreferencesModal;