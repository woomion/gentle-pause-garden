// Service Worker for Pocket Pause PWA
// Handles push notifications when app is closed

const CACHE_NAME = 'pocket-pause-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/favicon.ico'
];

// Install event - cache important resources
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📂 Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      }
    )
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received in service worker');
  console.log('📱 Raw push data:', event.data?.text());
  
  let notificationData = {
    title: 'Pocket Pause',
    body: 'You have items ready to review!',
    icon: '/icons/app-icon-512.png',
    badge: '/icons/app-icon-512.png',
    tag: 'pocket-pause-notification',
    requireInteraction: false,
    data: {
      url: 'https://cnjznmbgxprsrovmdywe.supabase.co'
    }
  };

  // Parse push data if available - handle multiple formats
  if (event.data) {
    try {
      // Try parsing as JSON first (standard format)
      const data = event.data.json();
      console.log('📱 Parsed push data as JSON:', data);
      
      // Handle Progressier's data format
      if (data.notification) {
        // Progressier wraps data in a notification object
        notificationData = {
          title: data.notification.title || notificationData.title,
          body: data.notification.body || notificationData.body,
          icon: data.notification.icon || notificationData.icon,
          badge: data.notification.badge || notificationData.badge,
          tag: data.notification.tag || notificationData.tag,
          requireInteraction: data.notification.requireInteraction || false,
          data: {
            url: data.notification.url || data.url || notificationData.data.url,
            ...data.notification.data,
            ...data.data
          }
        };
      } else {
        // Standard format
        notificationData = {
          title: data.title || notificationData.title,
          body: data.body || notificationData.body,
          icon: data.icon || notificationData.icon,
          badge: data.badge || notificationData.badge,
          tag: data.tag || notificationData.tag,
          requireInteraction: data.requireInteraction || false,
          data: {
            url: data.url || notificationData.data.url,
            ...data.data
          }
        };
      }
      
      console.log('📱 Final notification data:', notificationData);
      
    } catch (e) {
      console.log('📱 Failed to parse as JSON, trying text format');
      console.log('📱 Parse error:', e);
      
      // Try to extract data from text format
      const textData = event.data.text();
      console.log('📱 Text data:', textData);
      
      // Check if it's a JSON string that failed initial parsing
      try {
        const parsedText = JSON.parse(textData);
        console.log('📱 Successfully parsed text as JSON:', parsedText);
        
        notificationData.title = parsedText.title || notificationData.title;
        notificationData.body = parsedText.body || notificationData.body;
        notificationData.data.url = parsedText.url || notificationData.data.url;
      } catch (textParseError) {
        console.log('📱 Using raw text as notification body');
        notificationData.body = textData || notificationData.body;
      }
    }
  } else {
    console.log('📱 No push data available, using defaults');
  }

  console.log('📱 Showing notification with data:', notificationData);

  const notificationPromise = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data,
      actions: [
        {
          action: 'open',
          title: 'Open App'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    }
  );

  event.waitUntil(notificationPromise);
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('👆 Notification clicked:', event.notification.tag);
  console.log('👆 Notification action:', event.action);
  console.log('👆 Notification data:', event.notification.data);
  
  event.notification.close();
  
  // Handle different actions
  if (event.action === 'dismiss') {
    console.log('👆 User dismissed notification');
    return;
  }
  
  // Get the URL to open from notification data
  let urlToOpen = event.notification.data?.url || 'https://cnjznmbgxprsrovmdywe.supabase.co';
  
  // Ensure we have a full URL
  if (urlToOpen.startsWith('/')) {
    urlToOpen = 'https://cnjznmbgxprsrovmdywe.supabase.co' + urlToOpen;
  }
  
  console.log('👆 Opening URL:', urlToOpen);
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        console.log('👆 Found', clientList.length, 'open windows');
        
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes('cnjznmbgxprsrovmdywe.supabase.co') && 'focus' in client) {
            console.log('🔍 Focusing existing window:', client.url);
            return client.focus();
          }
        }
        
        // Open new window if app is not open
        if (clients.openWindow) {
          console.log('🆕 Opening new window:', urlToOpen);
          return clients.openWindow(urlToOpen);
        }
      })
      .catch(error => {
        console.error('👆 Error handling notification click:', error);
      })
  );
});

// Background sync event (if needed in the future)
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Perform background sync operations here
      Promise.resolve()
    );
  }
});

// Message event - handle messages from main app
self.addEventListener('message', (event) => {
  console.log('💬 Message received in SW:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('✅ Service Worker script loaded');