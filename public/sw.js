// public/sw.js — Pocket Pause PWA
self.skipWaiting();

self.addEventListener('install', () => {
  console.log('🔧 SW: Installing service worker');
  // Skip waiting to activate immediately
});

self.addEventListener('activate', (event) => {
  console.log('🔧 SW: Activating service worker');
  event.waitUntil(self.clients.claim());
});

// IMPORTANT: load Progressier's SW (handles push, click, etc.)
try {
  importScripts('https://progressier.app/9LL6P8U26R3MyH8El0RL/sw.js');
  console.log('✅ SW: Progressier service worker loaded');
} catch (e) {
  console.error('❌ SW: Failed to import Progressier SW:', e);
}

// Enhanced push event handling for when app is closed
self.addEventListener('push', (event) => {
  console.log('🔔 SW: Push event received', event);
  
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('🔔 SW: Push payload:', payload);
      
      // Ensure notification is shown even if app is closed
      const notificationPromise = self.registration.showNotification(
        payload.title || 'Pocket Pause',
        {
          body: payload.body || 'You have items ready for review',
          icon: '/icons/app-icon-512.png',
          badge: '/icons/app-icon-512.png',
          tag: 'pocket-pause-notification',
          data: payload.data || { url: '/' },
          requireInteraction: false,
          silent: false
        }
      );
      
      event.waitUntil(notificationPromise);
    } catch (error) {
      console.error('❌ SW: Error handling push event:', error);
      
      // Fallback notification
      const fallbackPromise = self.registration.showNotification(
        'Pocket Pause',
        {
          body: 'You have items ready for review',
          icon: '/icons/app-icon-512.png',
          badge: '/icons/app-icon-512.png',
          tag: 'pocket-pause-notification',
          data: { url: '/' }
        }
      );
      
      event.waitUntil(fallbackPromise);
    }
  }
});

// Enhanced notification click handling
self.addEventListener('notificationclick', event => {
  console.log('🔔 SW: Notification clicked', event);
  event.notification.close();
  
  const defaultUrl = '/';
  const url = (event.notification?.data && event.notification.data.url) || defaultUrl;

  event.waitUntil((async () => {
    const origin = self.location.origin;
    const absoluteUrl = url.startsWith('http') ? url : origin + url;

    console.log('🔔 SW: Opening URL:', absoluteUrl);

    // Focus existing app window if present, else open new
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const match = all.find(c => c.url.startsWith(origin));
    if (match) {
      console.log('🔔 SW: Focusing existing window');
      await match.focus();
      try { 
        await match.navigate(absoluteUrl); 
      } catch (e) {
        console.log('🔔 SW: Navigation failed, opening new window');
        await clients.openWindow(absoluteUrl);
      }
      return;
    }
    
    console.log('🔔 SW: Opening new window');
    await clients.openWindow(absoluteUrl);
  })());
});

// Basic caching
const CACHE_NAME = 'pocket-pause-v4';
const urlsToCache = ['/', '/favicon.ico', '/icons/app-icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(urlsToCache);
      console.log('✅ SW: Cache setup complete');
    } catch (e) {
      console.log('❌ SW: Cache setup failed:', e);
    }
  })());
});

self.addEventListener('fetch', event => {
  // Only cache GET requests and avoid caching API calls
  if (event.request.method === 'GET' && !event.request.url.includes('/functions/')) {
    event.respondWith((async () => {
      try {
        const cached = await caches.match(event.request);
        if (cached) {
          return cached;
        }
        const response = await fetch(event.request);
        
        // Cache successful responses
        if (response.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }
        
        return response;
      } catch (error) {
        console.log('❌ SW: Fetch failed:', error);
        return new Response('Offline', { status: 503 });
      }
    })());
  }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  console.log('🔄 SW: Background sync event:', event.tag);
  if (event.tag === 'background-sync') {
    event.waitUntil(Promise.resolve());
  }
});

// Message handling
self.addEventListener('message', event => {
  console.log('📨 SW: Message received:', event.data);
  if (event?.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Clean up old caches
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!currentCaches.includes(cacheName)) {
            console.log('🗑️ SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
