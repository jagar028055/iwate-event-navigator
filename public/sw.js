// Simple Service Worker for Cloudflare Pages compatibility
const CACHE_NAME = 'iwate-events-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(self.clients.claim());
});

// Basic fetch handling
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;
  
  // For now, just pass through all requests
  event.respondWith(fetch(event.request));
});