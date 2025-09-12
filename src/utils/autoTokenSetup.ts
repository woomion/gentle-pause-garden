import { supabase } from '@/integrations/supabase/client';
import { ensureNotificationPermission } from './ensureNotificationPermission';

async function waitForProgressierReady(timeoutMs = 8000) {
  const start = Date.now();
  while (!(window as any).progressier) {
    if (Date.now() - start > timeoutMs) throw new Error('Progressier not found');
    await new Promise(r => setTimeout(r, 100));
  }
  return (window as any).progressier;
}

export async function ensureProgressierSubscribed(user: { id: string, email?: string }) {
  console.log('🔔 Ensuring Progressier subscription for user:', user.id);
  
  // Ensure permission first
  const perm = await ensureNotificationPermission();
  if (perm !== 'granted') {
    console.log('❌ Notification permission not granted');
    return false;
  }

  try {
    console.log('⏳ Waiting for Progressier to be ready...');
    const progressier = await waitForProgressierReady();
    
    // Ensure SW ready
    console.log('⏳ Waiting for service worker to be ready...');
    await navigator.serviceWorker.ready;

    // Subscribe (idempotent)
    console.log('📝 Subscribing to Progressier push notifications...');
    await progressier.subscribe();
    console.log('✅ Progressier subscription successful');

    // Register user (for targeted sends)
    console.log('👤 Registering user with Progressier for targeted notifications...');
    await progressier.add({
      id: user.id,
      email: user.email || undefined
    });
    console.log('✅ User registration with Progressier complete');

    // Verify subscription is active
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      console.log('🔔 Push subscription status:', subscription ? 'ACTIVE' : 'INACTIVE');
      
      if (!subscription) {
        console.log('⚠️ No push subscription found after setup');
        return false;
      }
    }

    console.log('✅ Progressier setup complete - user can receive closed-app notifications');
    return true;
  } catch (error) {
    console.error('❌ Progressier subscription failed:', error);
    return false;
  }
}

export async function autoSetupPushToken(): Promise<boolean> {
  try {
    console.log('🔄 Auto-setting up push token...');
    
    // Check if user is logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('❌ No authenticated user for auto token setup');
      return false;
    }

    // Use the new ensure function
    const success = await ensureProgressierSubscribed(user);
    if (!success) {
      return false;
    }
    // Store token in database
    console.log('💾 Storing push token...');
    const { error: storeError } = await supabase.functions.invoke('store-push-token', {
      body: {
        userId: user.id,
        token: 'progressier-managed',
        endpoint: 'progressier-managed',
        platform: 'web'
      }
    });

    if (storeError) {
      console.error('❌ Error storing push token:', storeError);
      return false;
    }
    
    console.log('✅ Push token setup complete!');
    return true;
  } catch (error) {
    console.error('❌ Error in auto token setup:', error);
    return false;
  }
}

// Auto-run setup when module loads for authenticated users
(async () => {
  // Wait a bit for app to initialize
  setTimeout(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('🔄 Auto-initializing push notifications for authenticated user');
        await autoSetupPushToken();
      }
    } catch (error) {
      console.log('ℹ️ Auto-setup skipped:', error.message);
    }
  }, 2000); // Wait 2 seconds for app to be ready
})();