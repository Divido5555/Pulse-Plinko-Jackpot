// sw.js - Service Worker for Pulse369 Plinko
// Provides offline support and caching

const CACHE_NAME = 'pulse369-plinko-v1';
const STATIC_CACHE = 'pulse369-static-v1';

// Files to cache for offline support
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/config.js',
    '/manifest.json',
    '/assets/css/style.css',
    '/assets/js/utils.js',
    '/assets/js/wallet.js',
    '/assets/js/game.js',
    '/assets/js/app.js',
    '/contracts/abi.json'
];

// External resources to cache
const EXTERNAL_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[ServiceWorker] Install');
    
    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then((cache) => {
                console.log('[ServiceWorker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                // Skip waiting to activate immediately
                return self.skipWaiting();
            })
            .catch((err) => {
                console.error('[ServiceWorker] Cache failed:', err);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[ServiceWorker] Activate');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => {
                            return cacheName !== CACHE_NAME && 
                                   cacheName !== STATIC_CACHE;
                        })
                        .map((cacheName) => {
                            console.log('[ServiceWorker] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                // Claim all clients
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip cross-origin requests except for fonts and allowed APIs
    if (url.origin !== self.location.origin) {
        // Allow fonts
        if (url.hostname.includes('fonts.googleapis.com') || 
            url.hostname.includes('fonts.gstatic.com')) {
            event.respondWith(
                caches.match(request)
                    .then((cachedResponse) => {
                        if (cachedResponse) {
                            return cachedResponse;
                        }
                        return fetch(request)
                            .then((response) => {
                                // Cache font files
                                if (response.ok) {
                                    const responseClone = response.clone();
                                    caches.open(CACHE_NAME)
                                        .then((cache) => cache.put(request, responseClone));
                                }
                                return response;
                            });
                    })
            );
            return;
        }
        
        // Don't cache RPC calls or other external requests
        return;
    }
    
    // For navigation requests, try network first (for fresh content)
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Update cache with fresh version
                    const responseClone = response.clone();
                    caches.open(STATIC_CACHE)
                        .then((cache) => cache.put(request, responseClone));
                    return response;
                })
                .catch(() => {
                    // Fall back to cache if offline
                    return caches.match(request)
                        .then((cachedResponse) => {
                            return cachedResponse || caches.match('/index.html');
                        });
                })
        );
        return;
    }
    
    // For static assets, try cache first
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached version and update in background
                    fetchAndCache(request);
                    return cachedResponse;
                }
                
                // Not in cache, fetch from network
                return fetch(request)
                    .then((response) => {
                        // Cache the new response
                        if (response.ok && shouldCache(request)) {
                            const responseClone = response.clone();
                            caches.open(STATIC_CACHE)
                                .then((cache) => cache.put(request, responseClone));
                        }
                        return response;
                    });
            })
            .catch((err) => {
                console.error('[ServiceWorker] Fetch failed:', err);
                // Return offline page or error response
                return new Response('Offline', { 
                    status: 503, 
                    statusText: 'Service Unavailable' 
                });
            })
    );
});

// Helper: Fetch and update cache in background
function fetchAndCache(request) {
    fetch(request)
        .then((response) => {
            if (response.ok && shouldCache(request)) {
                caches.open(STATIC_CACHE)
                    .then((cache) => cache.put(request, response));
            }
        })
        .catch(() => {
            // Silently fail background update
        });
}

// Helper: Determine if request should be cached
function shouldCache(request) {
    const url = new URL(request.url);
    
    // Cache static assets
    if (url.pathname.match(/\.(html|css|js|json|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
        return true;
    }
    
    // Cache main pages
    if (url.pathname === '/' || url.pathname === '/index.html') {
        return true;
    }
    
    return false;
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
    
    if (event.data.action === 'clearCache') {
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => caches.delete(cacheName))
                );
            })
            .then(() => {
                event.ports[0].postMessage({ success: true });
            });
    }
});

// Background sync for game actions (future enhancement)
self.addEventListener('sync', (event) => {
    console.log('[ServiceWorker] Sync event:', event.tag);
    
    if (event.tag === 'sync-game-state') {
        // Sync game state when back online
        event.waitUntil(syncGameState());
    }
});

async function syncGameState() {
    // Placeholder for future sync functionality
    console.log('[ServiceWorker] Syncing game state...');
}

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
    if (!event.data) return;
    
    const data = event.data.json();
    
    const options = {
        body: data.body || 'New notification',
        icon: '/assets/images/icon-192.png',
        badge: '/assets/images/badge-72.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/'
        },
        actions: [
            { action: 'open', title: 'Open Game' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'Pulse369 Plinko', options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    if (event.action === 'dismiss') return;
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Focus existing window if available
                for (const client of clientList) {
                    if (client.url === event.notification.data.url && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window
                if (clients.openWindow) {
                    return clients.openWindow(event.notification.data.url);
                }
            })
    );
});
