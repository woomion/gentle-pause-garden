import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Moon, Coffee, Briefcase, Settings, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { notificationSchedulingService, NotificationScheduleSettings } from '@/services/notificationSchedulingService';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notificationsEnabled: boolean;
  onNotificationToggle: (enabled: boolean) => Promise<boolean>;
}

const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  notificationsEnabled,
  onNotificationToggle
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<NotificationScheduleSettings>({
    notification_schedule_type: 'immediate',
    notification_time_preference: '20:00',
    notification_batch_window: 30,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00',
    notification_profile: 'default'
  });

  useEffect(() => {
    if (isOpen && user) {
      loadSettings();
    }
  }, [isOpen, user]);

  const loadSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const userSettings = await notificationSchedulingService.getUserScheduleSettings(user.id);
      if (userSettings) {
        setSettings(userSettings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const success = await notificationSchedulingService.updateScheduleSettings(user.id, settings);
      if (success) {
        toast({
          title: "Settings saved",
          description: "Your notification preferences have been updated."
        });
        onClose();
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (profileKey: string) => {
    const presets = notificationSchedulingService.getPresetProfiles();
    const preset = presets[profileKey];
    if (preset) {
      setSettings(prev => ({
        ...prev,
        ...preset,
        notification_profile: profileKey as any
      }));
    }
  };

  const presetProfiles = [
    {
      key: 'default',
      title: 'Default',
      description: 'Immediate notifications with quiet hours',
      icon: Bell,
      details: 'Notify immediately when items are ready, respecting quiet hours (10pm-8am)'
    },
    {
      key: 'parent_mode',
      title: 'Parent Mode',
      description: 'Batch until after bedtime',
      icon: Moon,
      details: 'All notifications batched until 8pm when kids are asleep'
    },
    {
      key: 'morning_person',
      title: 'Morning Person',
      description: 'Batch until after coffee',
      icon: Coffee,
      details: 'All notifications batched until 9am coffee time'
    },
    {
      key: 'work_focus',
      title: 'Work Focus',
      description: 'Batch during work hours',
      icon: Briefcase,
      details: 'Notifications batched every 2 hours, quiet during 9am-5pm'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Notification Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enable/Disable Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notifications</CardTitle>
              <CardDescription>
                Control when and how you receive notifications about ready items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications-enabled">Enable notifications</Label>
                <Switch
                  id="notifications-enabled"
                  checked={notificationsEnabled}
                  onCheckedChange={onNotificationToggle}
                />
              </div>
            </CardContent>
          </Card>

          {notificationsEnabled && (
            <>
              {/* Preset Profiles */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Presets</CardTitle>
                  <CardDescription>
                    Choose a preset that matches your lifestyle
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {presetProfiles.map((profile) => {
                      const Icon = profile.icon;
                      const isSelected = settings.notification_profile === profile.key;
                      
                      return (
                        <button
                          key={profile.key}
                          onClick={() => applyPreset(profile.key)}
                          className={`p-4 rounded-lg border-2 transition-colors text-left ${
                            isSelected 
                              ? 'border-primary bg-primary/5' 
                              : 'border-muted hover:border-primary/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={`h-5 w-5 mt-1 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                            <div className="flex-1">
                              <h3 className="font-medium">{profile.title}</h3>
                              <p className="text-sm text-muted-foreground mb-2">{profile.description}</p>
                              <p className="text-xs text-muted-foreground">{profile.details}</p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Custom Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Custom Settings</CardTitle>
                  <CardDescription>
                    Fine-tune your notification preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Schedule Type */}
                  <div className="space-y-2">
                    <Label>Notification Schedule</Label>
                    <Select
                      value={settings.notification_schedule_type}
                      onValueChange={(value: any) => 
                        setSettings(prev => ({ ...prev, notification_schedule_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="immediate">Immediate</SelectItem>
                        <SelectItem value="batched">Batched</SelectItem>
                        <SelectItem value="custom_time">Specific Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Time Preference */}
                  {settings.notification_schedule_type === 'custom_time' && (
                    <div className="space-y-2">
                      <Label>Preferred Notification Time</Label>
                      <Input
                        type="time"
                        value={settings.notification_time_preference}
                        onChange={(e) => 
                          setSettings(prev => ({ ...prev, notification_time_preference: e.target.value }))
                        }
                      />
                    </div>
                  )}

                  {/* Batch Window */}
                  {settings.notification_schedule_type === 'batched' && (
                    <div className="space-y-2">
                      <Label>Batch Window (minutes)</Label>
                      <Select
                        value={settings.notification_batch_window.toString()}
                        onValueChange={(value) => 
                          setSettings(prev => ({ ...prev, notification_batch_window: parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="240">4 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Quiet Hours */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quiet Hours Start</Label>
                      <Input
                        type="time"
                        value={settings.quiet_hours_start}
                        onChange={(e) => 
                          setSettings(prev => ({ ...prev, quiet_hours_start: e.target.value }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quiet Hours End</Label>
                      <Input
                        type="time"
                        value={settings.quiet_hours_end}
                        onChange={(e) => 
                          setSettings(prev => ({ ...prev, quiet_hours_end: e.target.value }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={saveSettings} disabled={loading}>
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NotificationSettingsModal;