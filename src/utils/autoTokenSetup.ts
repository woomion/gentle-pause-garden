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

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('✅ Service worker ready');

    // Wait for Progressier to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if Progressier is available
    if (typeof window !== 'undefined' && (window as any).progressier) {
      console.log('📱 Progressier is available, setting up subscription...');
      
      const progressier = (window as any).progressier;
      
      try {
        // Request permission and subscribe (user gesture recommended on iOS)
        const isSubscribed = await progressier.isSubscribed();
        if (!isSubscribed) {
          console.log('📝 Not subscribed, attempting to subscribe...');
          await progressier.subscribe();
        }

        // Identify the user so backend can target pushes
        if (typeof progressier.setUserId === 'function') {
          await progressier.setUserId(user.id);
          console.log('✅ User ID set with Progressier:', user.id);
        } else if (typeof progressier.add === 'function') {
          await progressier.add({ 
            id: user.id, 
            email: user.email, 
            tags: ['authenticated', 'push-enabled'] 
          });
          console.log('✅ User registered with Progressier');
        }
        
        // Verify subscription and store token
        const finalIsSubscribed = await progressier.isSubscribed();
        if (finalIsSubscribed) {
          console.log('✅ User is subscribed, storing token...');
          
          // Store token using fetch to avoid SW issues
          const response = await fetch('/api/v1/store-push-token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              userId: user.id,
              token: 'progressier-managed',
              endpoint: 'progressier-managed',
              platform: 'web'
            })
          });

          if (!response.ok) {
            console.error('❌ Error storing push token via fetch');
            // Fallback to Supabase function
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
          }
          
          console.log('✅ Progressier subscription recorded successfully!');
          return true;
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

// Modified to not run automatically - will be triggered by useNotifications when user auth is confirmed