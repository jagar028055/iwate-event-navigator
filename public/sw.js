const CACHE_NAME = 'iwate-events-v1.0.0';
const STATIC_CACHE = 'iwate-events-static-v1';
const RUNTIME_CACHE = 'iwate-events-runtime-v1';

// Files to cache on install
const STATIC_FILES = [
  '/',
  '/index.html',
  '/src/styles/globals.css',
  '/manifest.json',
];

// Cache strategies configuration
const CACHE_STRATEGIES = {
  'map-tiles': 'CacheFirst',
  'api-data': 'NetworkFirst',
  'static-assets': 'StaleWhileRevalidate',
  'user-content': 'NetworkOnly'
};

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static files');
      return cache.addAll(STATIC_FILES);
    }).then(() => {
      console.log('[SW] Installation complete');
      self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    // Map tiles - CacheFirst strategy
    if (isMapTileRequest(url)) {
      event.respondWith(cacheFirst(request, RUNTIME_CACHE));
    }
    // API requests - NetworkFirst strategy
    else if (isAPIRequest(url)) {
      event.respondWith(networkFirst(request, RUNTIME_CACHE));
    }
    // Static assets - StaleWhileRevalidate strategy
    else if (isStaticAsset(url)) {
      event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    }
    // Default - NetworkFirst for HTML, CacheFirst for others
    else {
      event.respondWith(
        request.destination === 'document' 
          ? networkFirst(request, RUNTIME_CACHE)
          : staleWhileRevalidate(request, RUNTIME_CACHE)
      );
    }
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || '新しい通知があります',
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-72.png',
      tag: data.tag || 'default',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      vibrate: [200, 100, 200]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || '岩手イベントナビゲーター', options)
    );
  } catch (error) {
    console.error('[SW] Error handling push:', error);
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  const data = event.notification.data;
  const action = event.action;

  let url = '/';
  if (data && data.url) {
    url = data.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          client.focus();
          if (url !== '/') {
            client.postMessage({ type: 'navigate', url });
          }
          return;
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  switch (event.tag) {
    case 'background-sync':
      event.waitUntil(doBackgroundSync());
      break;
    case 'bookmark-sync':
      event.waitUntil(syncBookmarks());
      break;
  }
});

// Cache strategies implementation

// CacheFirst - Good for map tiles, images
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  if (cached) {
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.error('[SW] CacheFirst failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// NetworkFirst - Good for API data
async function networkFirst(request, cacheName, timeout = 3000) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(reject, timeout))
    ]);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error.message);
    const cached = await cache.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// StaleWhileRevalidate - Good for static assets
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => cached);
  
  return cached || await fetchPromise;
}

// Utility functions
function isMapTileRequest(url) {
  return url.hostname.includes('openstreetmap') || 
         url.hostname.includes('tile.osm') ||
         url.hostname.includes('cyberjapandata.gsi.go.jp');
}

function isAPIRequest(url) {
  return url.pathname.startsWith('/api/') ||
         url.hostname.includes('googleapis.com') ||
         url.hostname.includes('generativelanguage.googleapis.com');
}

function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.woff2', '.woff'];
  return staticExtensions.some(ext => url.pathname.endsWith(ext));
}

// Background sync functions
async function doBackgroundSync() {
  console.log('[SW] Performing background sync');
  
  try {
    // Sync any pending data
    const syncData = await getStoredSyncData();
    if (syncData.length > 0) {
      await Promise.all(syncData.map(data => syncDataItem(data)));
      await clearStoredSyncData();
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

async function syncBookmarks() {
  console.log('[SW] Syncing bookmarks');
  // Implement bookmark synchronization logic
}

async function getStoredSyncData() {
  // Implement getting data from IndexedDB or similar
  return [];
}

async function syncDataItem(data) {
  // Implement syncing individual data items
  console.log('[SW] Syncing data item:', data);
}

async function clearStoredSyncData() {
  // Implement clearing synced data
  console.log('[SW] Clearing synced data');
}

// Cache management
async function cleanupCaches() {
  const caches = await caches.keys();
  const maxCacheSize = 50 * 1024 * 1024; // 50MB
  
  for (const cacheName of caches) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > 100) { // Limit number of cached items
      const oldestKeys = keys.slice(0, keys.length - 100);
      await Promise.all(oldestKeys.map(key => cache.delete(key)));
    }
  }
}

// Periodic cleanup
setInterval(cleanupCaches, 24 * 60 * 60 * 1000); // Once per day