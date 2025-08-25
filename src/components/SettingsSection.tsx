import React, { useState } from 'react';
import { Settings, User, Moon, Sun, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmailBatchingSettings } from './EmailBatchingSettings';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTheme } from '@/components/ThemeProvider';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useAuth } from '@/contexts/AuthContext';

const SettingsSection = () => {
  // Collapsible state for account section
  const [accountOpen, setAccountOpen] = useState(false);
  // Collapsible state for color theme section
  const [colorThemeOpen, setColorThemeOpen] = useState(false);
  
  const { user } = useAuth();
  const { theme, setTheme, actualTheme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Removed duplicate Settings header and icon */}

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

      {/* Email Batching Settings */}
      <EmailBatchingSettings />
    </div>
  );
};

export default SettingsSection;