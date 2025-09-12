import { useEffect, useState } from 'react';
import { Bell, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { platformNotificationService } from '@/services/platformNotificationService';
import { ensureNotificationPermission } from '@/utils/ensureNotificationPermission';
import { autoSetupPushToken, ensureProgressierSubscribed } from '@/utils/autoTokenSetup';

const NotificationFixBanner = () => {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        if (!user) {
          if (mounted) setShow(false);
          return;
        }
        const permission = 'Notification' in window ? Notification.permission : 'default';
        const subscribed = await platformNotificationService.isSubscribed();
        const needsFix = permission !== 'granted' || !subscribed;
        if (mounted) setShow(needsFix);
      } finally {
        if (mounted) setChecking(false);
      }
    };
    check();
    const id = setInterval(check, 5000);
    return () => { mounted = false; clearInterval(id); };
  }, [user]);

  if (!show || checking) return null;

  const handleEnable = async () => {
    try {
      // If permission is denied, we cannot prompt programmatically
      if ('Notification' in window && Notification.permission === 'denied') {
        alert('Notifications are blocked in your browser. Please enable them in Site Settings for this site, then try again.');
        return;
        }
      // Ensure browser permission first
      const perm = await ensureNotificationPermission();
      if (perm !== 'granted') return;

      // Ensure subscription and register user with Progressier
      if (user) {
        await ensureProgressierSubscribed({ id: user.id, email: user.email || undefined });
      }

      // Store token and verify backend targeting
      await autoSetupPushToken();

      // Hide banner after success
      setShow(false);
    } catch (e) {
      console.error('Failed to enable notifications:', e);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-border/50 bg-card/70 backdrop-blur-sm p-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
          {('Notification' in window && Notification.permission === 'denied') ? (
            <ShieldAlert className="h-4 w-4 text-primary" />
          ) : (
            <Bell className="h-4 w-4 text-primary" />
          )}
        </div>
        <div>
          <div className="text-sm font-medium text-foreground">Enable closed-app notifications</div>
          <div className="text-xs text-muted-foreground">Stay signed in and receive pushes even after closing the app.</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={handleEnable}>Enable</Button>
        <Button size="sm" variant="ghost" onClick={() => setShow(false)}>Dismiss</Button>
      </div>
    </div>
  );
};

export default NotificationFixBanner;
