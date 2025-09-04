import React, { useState } from 'react';
import { Settings, User, Moon, Sun, ChevronDown, ChevronRight, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTheme } from '@/components/ThemeProvider';
import { ThemeSelector } from '@/components/ThemeSelector';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useNotifications } from '@/hooks/useNotifications';

const SettingsSection = () => {
  // Collapsible state for account section
  const [accountOpen, setAccountOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [colorThemeOpen, setColorThemeOpen] = useState(false);
  
  const { user } = useAuth();
  const { theme, setTheme, actualTheme } = useTheme();
  const { notificationsEnabled, updateNotificationSetting, loading } = useUserSettings();
  const { enableNotifications, testNotification } = useNotifications(notificationsEnabled);

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
                Configure when and how you receive notifications
              </CardDescription>
            </CardHeader>
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="bg-card border-border border-t-0 rounded-t-none">
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Enable Notifications</Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified when your paused items are ready for review
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={updateNotificationSetting}
                  disabled={loading}
                />
              </div>
              
              {notificationsEnabled && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={testNotification}
                    className="w-full text-xs h-8"
                  >
                    Send Test Notification
                  </Button>
                  
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium mb-2">Background Notifications</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      For notifications when the app is closed:
                    </p>
                    <ul className="text-xs text-muted-foreground space-y-1 mb-3">
                      <li>• Allow browser notifications</li>
                      <li>• Enable background app refresh</li>
                      <li>• Keep device notifications on</li>
                    </ul>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          console.log('🔍 COMPREHENSIVE BACKGROUND NOTIFICATION DEBUGGING...');
                          console.log('━'.repeat(50));
                          
                          // 1. Check browser capabilities
                          console.log('1️⃣ BROWSER CAPABILITIES:');
                          console.log('  • Notification permission:', Notification.permission);
                          console.log('  • Service Worker support:', 'serviceWorker' in navigator);
                          console.log('  • Push Manager support:', 'PushManager' in window);
                          console.log('  • User Agent:', navigator.userAgent);
                          
                          // 2. Check service worker status
                          if ('serviceWorker' in navigator) {
                            const registration = await navigator.serviceWorker.ready;
                            const subscription = await registration.pushManager.getSubscription();
                            console.log('  • SW registration:', !!registration);
                            console.log('  • Push subscription exists:', !!subscription);
                            if (subscription) {
                              console.log('  • Subscription endpoint:', subscription.endpoint.substring(0, 50) + '...');
                            }
                          }
                          
                          // 3. Check Progressier status
                          console.log('2️⃣ PROGRESSIER STATUS:');
                          console.log('  • Progressier available:', !!window.progressier);
                          if (window.progressier) {
                            console.log('  • Available methods:', Object.keys(window.progressier));
                            
                            try {
                              const isSubscribed = await window.progressier.isSubscribed();
                              console.log('  • Progressier subscribed:', isSubscribed);
                            } catch (e) {
                              console.log('  • isSubscribed() error:', e.message);
                            }
                          }
                          
                          // 4. Check authentication
                          console.log('3️⃣ AUTHENTICATION STATUS:');
                          const { supabase } = await import('@/integrations/supabase/client');
                          const { data: { user } } = await supabase.auth.getUser();
                          console.log('  • User logged in:', !!user);
                          if (user) {
                            console.log('  • User ID:', user.id);
                            
                            // Check push tokens in database
                            const { data: tokens } = await supabase
                              .from('push_tokens')
                              .select('*')
                              .eq('user_id', user.id);
                            console.log('  • Push tokens in DB:', tokens?.length || 0);
                            tokens?.forEach((token, i) => {
                              console.log(`    Token ${i + 1}: ${token.platform} - ${token.token.substring(0, 20)}...`);
                            });
                          }
                          
                          // 5. Test Progressier registration and subscription
                          if (window.progressier && user) {
                            console.log('4️⃣ PROGRESSIER SETUP TEST:');
                            
                            // Test user registration
                            try {
                              if (typeof (window.progressier as any).setUserId === 'function') {
                                await (window.progressier as any).setUserId(user.id);
                                console.log('  ✅ User ID set with setUserId()');
                              } else if (typeof window.progressier.add === 'function') {
                                await window.progressier.add({
                                  id: user.id,
                                  tags: ['authenticated', 'debug-test']
                                });
                                console.log('  ✅ User registered with add()');
                              } else {
                                console.log('  ❌ No user registration method available');
                              }
                            } catch (e) {
                              console.log('  ❌ User registration failed:', e.message);
                            }
                            
                            // Test subscription
                            try {
                              const wasSubscribed = await window.progressier.isSubscribed();
                              if (!wasSubscribed) {
                                console.log('  🔄 Attempting subscription...');
                                await window.progressier.subscribe();
                                const nowSubscribed = await window.progressier.isSubscribed();
                                console.log('  • Subscription result:', nowSubscribed);
                              } else {
                                console.log('  ✅ Already subscribed');
                              }
                            } catch (e) {
                              console.log('  ❌ Subscription failed:', e.message);
                            }
                            
                            // Test direct push
                            console.log('5️⃣ PROGRESSIER PUSH TEST:');
                            try {
                              if (typeof window.progressier.push === 'function') {
                                await window.progressier.push({
                                  title: '🧪 Debug Test - Direct Progressier',
                                  body: 'This is a direct Progressier push notification test. You should see this even with the app closed.',
                                  data: { 
                                    test: true, 
                                    service: 'progressier-direct',
                                    timestamp: Date.now()
                                  }
                                });
                                console.log('  ✅ Direct Progressier notification sent');
                              } else {
                                console.log('  ❌ Progressier.push() method not available');
                              }
                            } catch (e) {
                              console.log('  ❌ Direct Progressier push failed:', e.message);
                            }
                          }
                          
                          // 6. Test backend notification
                          console.log('6️⃣ BACKEND NOTIFICATION TEST:');
                          try {
                            await testNotification();
                            console.log('  ✅ Backend notification test triggered');
                          } catch (e) {
                            console.log('  ❌ Backend notification failed:', e.message);
                          }
                          
                          console.log('━'.repeat(50));
                          console.log('🏁 DEBUG COMPLETE - Check console for detailed results');
                          
                          alert(`🧪 Comprehensive debugging complete!\n\nKey findings:\n• Progressier available: ${!!window.progressier}\n• Browser permission: ${Notification.permission}\n• User authenticated: ${!!user}\n\nCheck console for full debug report.\n\nTo test background notifications:\n1. Close this app completely\n2. Wait for notifications to arrive\n3. They should work if Progressier is properly set up`);
                          
                        } catch (error) {
                          console.error('❌ Debug test failed:', error);
                          alert('❌ Debug failed: ' + error.message);
                        }
                      }}
                      className="w-full text-xs h-7"
                    >
                      Test Background Notifications
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    If you don't receive test notifications, check your browser settings and allow notifications for this site.
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