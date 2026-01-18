// public/sw.js — Pocket Pause PWA

// Basic caching
const CACHE_NAME = 'pocket-pause-v4';
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
  event.waitUntil((async () => {
    // Take control of existing clients
    await self.clients.claim();

    // Clean up old caches
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter(name => name.startsWith('pocket-pause-') && name !== CACHE_NAME)
        .map(name => caches.delete(name))
    );
  })());
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Always try network first for page navigations so new UI changes show up
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith((async () => {
      try {
        const networkResponse = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      } catch (error) {
        const cached = await caches.match(request);
        return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  // Cache-first for other requests (icons, assets, etc.)
  event.respondWith((async () => {
    const cached = await caches.match(request);
    return cached || fetch(request);
  })());
});

// --- Push handling ---
console.log('🔔 Service Worker loaded');

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
