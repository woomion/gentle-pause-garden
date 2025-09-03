import { supabase } from '@/integrations/supabase/client';

export async function autoSetupPushToken(): Promise<boolean> {
  try {
    console.log('🔄 Auto-setting up push token...');
    
    // Check if user is logged in
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log('❌ No authenticated user for auto token setup');
      return false;
    }

    // Check if we already have a token stored
    const { data: existingTokens } = await supabase
      .from('push_tokens')
      .select('*')
      .eq('user_id', user.id);
    
    if (existingTokens && existingTokens.length > 0) {
      console.log('✅ Push token already exists');
      return true;
    }

    // Wait a bit for Progressier to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if service worker and push manager are available
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('❌ Service worker or PushManager not available');
      return false;
    }

    // Get service worker registration and check for push subscription
    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('⚠️ No push subscription found, trying to create one...');
      
      // Try to subscribe for push notifications
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: null // Let Progressier handle this
        });
      } catch (subscribeError) {
        console.log('❌ Could not subscribe for push notifications:', subscribeError);
        return false;
      }
    }

    if (subscription) {
      console.log('✅ Found push subscription, storing token...');
      
      // Store the push token
      const { error: storeError } = await supabase.functions.invoke('store-push-token', {
        body: {
          userId: user.id,
          token: subscription.endpoint,
          endpoint: subscription.endpoint,
          platform: 'web'
        }
      });

      if (storeError) {
        console.error('❌ Error storing push token:', storeError);
        return false;
      } else {
        console.log('✅ Push token stored successfully!');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error in auto token setup:', error);
    return false;
  }
}

// Run automatically when module loads
if (typeof window !== 'undefined') {
  // Wait for the page to be ready, then try to set up push token
  setTimeout(() => {
    autoSetupPushToken();
  }, 3000); // Wait 3 seconds for everything to load
}