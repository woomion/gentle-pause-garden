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

    // Wait for Progressier to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if Progressier is available
    if (typeof window !== 'undefined' && (window as any).progressier) {
      console.log('📱 Progressier is available, setting up subscription...');
      
      const progressier = (window as any).progressier;
      
      try {
        // Register user with Progressier first
        if (typeof progressier.add === 'function') {
          await progressier.add({
            id: user.id, // Use Supabase user ID
            tags: 'authenticated'
          });
          console.log('✅ User registered with Progressier');
        }

        // Check if user is already subscribed
        const isSubscribed = await progressier.isSubscribed();
        console.log('🔔 Is subscribed to Progressier:', isSubscribed);
        
        if (!isSubscribed) {
          console.log('📝 Not subscribed, attempting to subscribe...');
          
          // Show the opt-in UI and subscribe
          await progressier.subscribe();
          console.log('✅ Successfully subscribed to Progressier');
        }
        
        // Verify subscription and store token
        const finalIsSubscribed = await progressier.isSubscribed();
        if (finalIsSubscribed) {
          console.log('✅ User is subscribed, storing token...');
          
          // Store a Progressier token record
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
          } else {
            console.log('✅ Progressier subscription recorded successfully!');
            return true;
          }
        } else {
          console.log('📭 User declined push notifications');
          return false;
        }
      } catch (progressierError) {
        console.log('ℹ️ Progressier subscription failed or was declined:', progressierError);
        return false;
      }
    } else {
      console.log('❌ Progressier not available');
      return false;
    }
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