import { supabase } from '@/integrations/supabase/client';

export async function debugProgressierSetup() {
  console.log('🔍 === Progressier Debug Report ===');
  
  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('👤 User authenticated:', !!user);
  if (user) {
    console.log('👤 User ID:', user.id);
    console.log('👤 User email:', user.email);
  } else {
    console.log('❌ No authenticated user - this is the problem!');
    console.log('💡 Solution: Log in first, then notifications will work');
    return;
  }
  
  // Check Progressier availability
  console.log('📱 Progressier available:', !!window.progressier);
  if (window.progressier) {
    console.log('📱 Progressier methods:', Object.keys(window.progressier));
  }
  
  // Check if user is registered with Progressier
  if (window.progressier && user) {
    try {
      // Check if subscribed to push notifications
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        console.log('🔔 Has push subscription:', !!subscription);
        
        if (subscription) {
          console.log('🔔 Subscription endpoint:', subscription.endpoint.substring(0, 50) + '...');
        }
      }
      
      // Test registering user with Progressier
      console.log('🔄 Attempting to register user with Progressier...');
      await window.progressier.add({ 
        id: user.id, 
        email: user.email,
        tags: ['debug-test'] 
      });
      console.log('✅ User registered with Progressier');
      
      // Test sending notification
      console.log('🧪 Testing push notification...');
      const { error } = await supabase.functions.invoke('send-push-notifications', {
        body: {
          userIds: [user.id],
          title: 'Debug Test',
          body: 'Testing Progressier targeting',
          data: { debug: true }
        }
      });
      
      if (error) {
        console.error('❌ Push notification test failed:', error);
      } else {
        console.log('✅ Push notification test sent - check Progressier dashboard');
      }
      
    } catch (error) {
      console.error('❌ Error during Progressier setup:', error);
    }
  }
  
  console.log('🔍 === End Debug Report ===');
}

// Make it available globally for console debugging
if (typeof window !== 'undefined') {
  (window as any).debugProgressierSetup = debugProgressierSetup;
}