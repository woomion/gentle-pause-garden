import React from 'react';
import { X, Palette, Monitor, Sun, Moon, Laptop, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTheme } from '@/components/ThemeProvider';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useAuth } from '@/contexts/AuthContext';

interface AppPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppPreferencesModal: React.FC<AppPreferencesModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useTheme();
  const { notificationsEnabled, updateNotificationSetting, loading } = useUserSettings();
  const { user } = useAuth();

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
            {/* Email Notifications Section */}
            <div className="space-y-4">
              <Label className="flex items-center gap-2">
                <Mail size={16} />
                Email Notifications
              </Label>
              
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="text-sm font-medium">Enable Email Notifications</div>
                  <div className="text-xs text-muted-foreground">
                    Receive an email when items are ready for review
                  </div>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={updateNotificationSetting}
                  disabled={loading}
                />
              </div>

              {notificationsEnabled && user && (
                <div className="p-3 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Emails will be sent to {user.email}
                  </p>
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
