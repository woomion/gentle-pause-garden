// public/sw.js — Pocket Pause PWA

// IMPORTANT: load Progressier's SW (handles push, click, etc.)
try {
  importScripts('https://progressier.app/9LL6P8U26R3MyH8El0RL/sw.js');
} catch (e) {
  console.error('Failed to import Progressier SW:', e);
}

// Basic caching
const CACHE_NAME = 'pocket-pause-v3';
const urlsToCache = ['/', '/favicon.ico'];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(urlsToCache);
    } catch (e) {
      console.log('Cache setup failed:', e);
    }
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    return cached || fetch(event.request);
  })());
});

// --- Push handling ---
// Progressier handles all push notifications, but we need explicit push handler
self.addEventListener('push', event => {
  console.log('🔔 Push event received:', event);
  
  // Let Progressier handle the push, but ensure showNotification is called
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('📱 Push data:', data);
      
      // Ensure notification is shown even when app is closed
      event.waitUntil(
        self.registration.showNotification(data.title || 'Pocket Pause', {
          body: data.body || 'You have a notification',
          icon: '/icons/app-icon-512.png',
          badge: '/icons/app-icon-512.png',
          data: data,
          requireInteraction: false,
          silent: false
        })
      );
    } catch (e) {
      console.error('❌ Error parsing push data:', e);
      // Fallback notification
      event.waitUntil(
        self.registration.showNotification('Pocket Pause', {
          body: 'You have a new notification',
          icon: '/icons/app-icon-512.png',
          badge: '/icons/app-icon-512.png'
        })
      );
    }
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const defaultUrl = '/';
  const url = (event.notification?.data && event.notification.data.url) || defaultUrl;

  event.waitUntil((async () => {
    const origin = self.location.origin;
    const absoluteUrl = url.startsWith('http') ? url : origin + url;

    // Focus existing app window if present, else open new
    const all = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const match = all.find(c => c.url.startsWith(origin));
    if (match) {
      await match.focus();
      try { await match.navigate(absoluteUrl); } catch {}
      return;
    }
    await clients.openWindow(absoluteUrl);
  })());
});

// Optional: background sync & messages (left as-is but guarded)
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(Promise.resolve());
  }
});

self.addEventListener('message', event => {
  if (event?.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
