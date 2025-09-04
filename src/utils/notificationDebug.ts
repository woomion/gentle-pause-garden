import { supabase } from '@/integrations/supabase/client';

export async function debugNotificationSetup() {
  try {
    console.log('🔔 Starting notification debug...');
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ No authenticated user:', authError);
      return;
    }
    
    console.log('👤 Current user:', user.id);
    
    // Check if Progressier is available
    if (typeof window !== 'undefined' && window.progressier) {
      console.log('✅ Progressier is available');
      
      // Set user ID in Progressier (if method exists)
      if ((window.progressier as any).setUserId) {
        (window.progressier as any).setUserId(user.id);
        console.log('✅ Set Progressier user ID');
      }
      
      // Check subscription status
      if (window.progressier && typeof window.progressier.isSubscribed === 'function') {
        const isSubscribed = await window.progressier.isSubscribed();
        console.log('🔔 Subscription status:', isSubscribed);
        
        if (isSubscribed) {
          // Try to get subscription details (if method exists)
          const getSubscription = (window.progressier as any).getSubscription;
          if (getSubscription) {
            const subscription = await getSubscription();
            console.log('🔔 Subscription details:', subscription);
            
            // Manually store token
            if (subscription) {
              await storeUserToken(user.id, subscription);
            }
          }
        } else {
          console.log('❌ User not subscribed, requesting subscription...');
          if (window.progressier && typeof window.progressier.subscribe === 'function') {
            const newSubscription = await window.progressier.subscribe();
            console.log('🔔 New subscription:', newSubscription);
            
            if (newSubscription) {
              await storeUserToken(user.id, newSubscription);
            }
          }
        }
      }
    } else {
      console.error('❌ Progressier not available');
    }
    
    // Check database state
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('notifications_enabled, notification_delivery_style')
      .eq('user_id', user.id)
      .single();
      
    console.log('📊 User settings:', userSettings);
    
    const { data: pushTokens } = await supabase
      .from('push_tokens')
      .select('*')
      .eq('user_id', user.id);
      
    console.log('🔑 Push tokens:', pushTokens);
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

async function storeUserToken(userId: string, subscription: any) {
  try {
    // Extract token
    let token = subscription.endpoint || subscription.subscriptionId || subscription.token;
    
    if (!token) {
      console.error('❌ No token found in subscription');
      return;
    }
    
    console.log('🔑 Storing token for user:', userId);
    
    // Store via edge function
    const { error } = await supabase.functions.invoke('store-push-token', {
      body: {
        userId: userId,
        token: token,
        endpoint: subscription.endpoint || null,
        platform: 'web'
      }
    });
    
    if (error) {
      console.error('❌ Error storing token:', error);
    } else {
      console.log('✅ Token stored successfully');
    }
    
  } catch (error) {
    console.error('❌ Error in storeUserToken:', error);
  }
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).debugNotificationSetup = debugNotificationSetup;
}