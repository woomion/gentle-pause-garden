// public/sw.js — Pocket Pause PWA (fixed)

// 0) Load Progressier's service worker FIRST (replace <YOUR_ID> or URL they gave you)
try {
  importScripts('https://progressier.app/9LL6P8U26R3MyH8El0RL/sw.js');
} catch (e) {
  // If this fails, Progressier pushes won't work
  console.error('Failed to import Progressier SW:', e);
}

const CACHE_NAME = 'pocket-pause-v2';
const urlsToCache = ['/', '/static/js/bundle.js', '/static/css/main.css', '/favicon.ico'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(urlsToCache);
    } finally {
      // Ensure new SW takes over ASAP
      self.skipWaiting();
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(k => (k !== CACHE_NAME ? caches.delete(k) : undefined)));
    await clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    return cached || fetch(event.request);
  })());
});

// --- Push handling ---
// Progressier's own handler will run because we imported their SW.
// Keep ours defensive and additive; never throw.
self.addEventListener('push', event => {
  event.waitUntil((async () => {
    try {
      let data = {};
      if (event.data) {
        try { data = event.data.json(); } catch { data = { body: event.data.text() }; }
      }

      // If Progressier already showed a notification, showing another is optional.
      // Keep ours as a fallback only when Progressier didn't include a payload.
      if (!data || (!data.title && !data.notification)) {
        await self.registration.showNotification('Pocket Pause', {
          body: 'You have items ready to review.',
          icon: '/icons/app-icon-512.png',
          badge: '/icons/app-icon-512.png',
          tag: 'pocket-pause-fallback',
          data: { url: '/' }
        });
      }
    } catch (e) {
      // swallow to avoid breaking Progressier handler
      console.error('Custom push handler error:', e);
    }
  })());
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
