import React, { useState } from 'react';
import { User, Moon, Sun, ChevronDown, ChevronRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTheme } from '@/components/ThemeProvider';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';

const SettingsSection = () => {
  // Collapsible state for account section
  const [accountOpen, setAccountOpen] = useState(false);
  const [emailNotificationsOpen, setEmailNotificationsOpen] = useState(false);
  const [colorThemeOpen, setColorThemeOpen] = useState(false);
  
  const { user } = useAuth();
  const { theme, setTheme, actualTheme } = useTheme();
  const { notificationsEnabled, updateNotificationSetting, loading } = useUserSettings();

  return (
    <div className="space-y-6">
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
                </div>
              </div>
              
              <Collapsible open={colorThemeOpen} onOpenChange={setColorThemeOpen}>
                <CollapsibleTrigger className="w-full pt-2 border-t border-border">
                  <div className="flex items-center justify-between py-2">
                    <Label className="text-sm font-medium">Color Theme</Label>
                    {colorThemeOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="pt-2">
                    <ThemeSelector />
                  </div>
                </CollapsibleContent>
              </Collapsible>
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

      {/* Email Notifications */}
      <Collapsible open={emailNotificationsOpen} onOpenChange={setEmailNotificationsOpen}>
        <CollapsibleTrigger className="w-full">
          <Card className="bg-card border-border cursor-pointer hover:bg-card/80 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Notifications
                </div>
                {emailNotificationsOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </CardTitle>
              <CardDescription className="text-sm text-left">
                Get notified by email when items are ready for review
              </CardDescription>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="bg-card border-border border-t-0 rounded-t-none">
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Enable Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive an email when your paused items are ready for review
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={updateNotificationSetting}
                  disabled={loading}
                />
              </div>
              
              {notificationsEnabled && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    You'll receive emails at {user?.email} when items become ready for review.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

    </div>
  );
};

export default SettingsSection;
