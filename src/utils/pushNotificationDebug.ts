// Debug utility for push notification diagnostics

export const debugPushNotifications = async () => {
  console.log('🔍 === PUSH NOTIFICATION DIAGNOSTICS ===');
  
  // 1. Check Service Worker
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    console.log('📋 Service Worker Status:');
    console.log('  - Registration:', !!registration);
    console.log('  - Active:', !!registration?.active);
    console.log('  - Scope:', registration?.scope);
    console.log('  - Script URL:', registration?.active?.scriptURL);
    
    if (registration?.active) {
      console.log('✅ Service Worker is active and running');
    } else {
      console.error('❌ Service Worker not active - notifications will not work when app is closed');
    }
  } else {
    console.error('❌ Service Worker not supported');
  }
  
  // 2. Check Push Manager
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      console.log('📋 Push Subscription Status:');
      console.log('  - Subscribed:', !!subscription);
      if (subscription) {
        console.log('  - Endpoint:', subscription.endpoint);
        console.log('  - Keys:', !!subscription.getKey);
      } else {
        console.warn('⚠️ No push subscription found - user may not receive notifications when app is closed');
      }
    } catch (error) {
      console.error('❌ Error checking push subscription:', error);
    }
  } else {
    console.error('❌ Push Manager not supported');
  }
  
  // 3. Check Notification Permission
  console.log('📋 Notification Permission Status:');
  console.log('  - Permission:', Notification.permission);
  console.log('  - Support:', 'Notification' in window);
  
  if (Notification.permission === 'granted') {
    console.log('✅ Notification permission granted');
  } else {
    console.warn('⚠️ Notification permission not granted:', Notification.permission);
  }
  
  // 4. Check Progressier
  console.log('📋 Progressier Status:');
  console.log('  - Available:', !!(window as any).progressier);
  if ((window as any).progressier) {
    try {
      const isSubscribed = await (window as any).progressier.isSubscribed();
      console.log('  - Subscribed:', isSubscribed);
      console.log('✅ Progressier is available and configured');
    } catch (error) {
      console.error('❌ Error checking Progressier subscription:', error);
    }
  } else {
    console.warn('⚠️ Progressier not loaded - push notifications may not work');
  }
  
  // 5. Check if we're in a secure context
  console.log('📋 Security Context:');
  console.log('  - Secure Context:', window.isSecureContext);
  console.log('  - Protocol:', window.location.protocol);
  console.log('  - Origin:', window.location.origin);
  
  if (!window.isSecureContext && window.location.protocol !== 'http:') {
    console.error('❌ Not in secure context - push notifications require HTTPS');
  }
  
  // 6. Test basic notification
  if (Notification.permission === 'granted') {
    console.log('🧪 Testing basic notification...');
    try {
      const notification = new Notification('Test Notification', {
        body: 'This is a test to verify notifications work',
        icon: '/icons/app-icon-512.png'
      });
      console.log('✅ Basic notification created successfully');
      setTimeout(() => notification.close(), 3000);
    } catch (error) {
      console.error('❌ Error creating basic notification:', error);
    }
  }
  
  console.log('🔍 === END DIAGNOSTICS ===');
};

// Make it globally available for testing
(window as any).debugPushNotifications = debugPushNotifications;