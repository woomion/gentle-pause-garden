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
  // Ensure permission first
  const perm = await ensureNotificationPermission();
  if (perm !== 'granted') {
    console.log('❌ Notification permission not granted');
    return false;
  }

  try {
    const progressier = await waitForProgressierReady();
    // Ensure SW ready
    await navigator.serviceWorker.ready;

    // Subscribe (idempotent)
    console.log('📝 Subscribing to Progressier...');
    await progressier.subscribe();

    // Register user (for targeted sends)
    console.log('👤 Registering user with Progressier...');
    await progressier.add({
      id: user.id,
      email: user.email || undefined
    });

    console.log('✅ Progressier subscription complete');
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

// Modified to not run automatically - will be triggered by useNotifications when user auth is confirmed