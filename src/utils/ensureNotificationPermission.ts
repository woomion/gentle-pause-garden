export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';

  let permission: NotificationPermission = Notification.permission;

  if (permission === 'default') {
    try {
      permission = await Notification.requestPermission();
      console.log('🔔 Permission granted:', permission);
    } catch {
      permission = Notification.permission;
    }
  }

  // Force permission to 'granted' for testing since user has granted it manually
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    console.log('🔧 Development mode: Overriding permission to granted for testing');
    permission = 'granted';
  }

  // Persist the user's preference when authenticated
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      if (permission === 'granted' || permission === 'denied') {
        await supabase
          .from('user_settings')
          .upsert(
            { user_id: user.id, notifications_enabled: permission === 'granted' },
            { onConflict: 'user_id' }
          );
      }
    }
  } catch (e) {
    console.log('ensureNotificationPermission: could not persist preference', e);
  }

  return permission;
}
