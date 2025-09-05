// Custom Service Worker that cooperates with Progressier
/// <reference lib="webworker" />

import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { clientsClaim } from 'workbox-core'

declare const self: ServiceWorkerGlobalScope

// Clean old caches
cleanupOutdatedCaches()

// Precache app shell - but allow injection point to be replaced
precacheAndRoute(self.__WB_MANIFEST || [])

// Take control immediately
self.skipWaiting()
clientsClaim()

// Allow Progressier to handle push messaging by not interfering
self.addEventListener('push', (event) => {
  console.log('Push event received - Progressier should handle this')
  // Don't call event.preventDefault() or event.waitUntil() 
  // Let Progressier's service worker handle the push notification
})

self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received - Progressier should handle this')
  // Don't call event.preventDefault() or event.waitUntil()
  // Let Progressier's service worker handle the notification click
})

// Basic offline fallback for app pages
self.addEventListener('fetch', (event) => {
  // Only handle navigation requests to our domain
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return app shell on offline navigation
        return caches.match('/') || new Response('Offline')
      })
    )
  }
})