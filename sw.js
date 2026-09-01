/**
 * LNMIIT College Companion - Service Worker
 * Version: 1.0.0
 */

const CACHE_VERSION = 'v1.3.0';
const APP_SHELL_CACHE = `lnmiit-app-shell-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `lnmiit-dynamic-${CACHE_VERSION}`;

// Core static assets required for offline app shell
const APP_SHELL_ASSETS = [
    '/',
    'index.html',
    'style.css',
    'app.js',
    'mess.js',
    'timetable.js',
    'bus.js',
    'manifest.json',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/icon-192.svg',
    'icons/icon-512.svg',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap'
];

/**
 * Install Event: Cache all app shell files
 */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(APP_SHELL_CACHE).then(async (cache) => {
            console.log('[Service Worker] Pre-caching app shell assets');
            // Cache local and remote assets reliably with error resilience
            const cachePromises = APP_SHELL_ASSETS.map(async (asset) => {
                try {
                    const response = await fetch(asset, { cache: 'reload' });
                    if (response.ok) {
                        await cache.put(asset, response);
                    }
                } catch (error) {
                    console.warn(`[Service Worker] Failed to pre-cache ${asset}:`, error);
                }
            });
            await Promise.all(cachePromises);
        }).then(() => self.skipWaiting())
    );
});

/**
 * Activate Event: Clean up old caches & claim clients
 */
self.addEventListener('activate', (event) => {
    const currentCaches = [APP_SHELL_CACHE, DYNAMIC_CACHE];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (!currentCaches.includes(cacheName)) {
                        console.log('[Service Worker] Removing outdated cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

/**
 * Helper: Check if request is an App Shell (same-origin static) asset
 */
function isAppShellRequest(url, request) {
    if (request.mode === 'navigate') return true;
    if (url.origin === self.location.origin) {
        return (
            url.pathname === '/' ||
            url.pathname.endsWith('.html') ||
            url.pathname.endsWith('.css') ||
            url.pathname.endsWith('.js') ||
            url.pathname.endsWith('.json') ||
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.ico')
        );
    }
    // Google Fonts pre-cached resources are also treated as shell
    if (url.hostname.includes('cdnjs.cloudflare.com') || url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
        return true;
    }
    return false;
}

/**
 * Fetch Event Handler
 * - Cache-First strategy for App Shell files
 * - Network-First strategy for dynamic / external resources
 * - Offline navigation fallback to cached index.html
 */
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    const requestUrl = new URL(event.request.url);

    // Strategy 1: Cache-First for App Shell Assets
    if (isAppShellRequest(requestUrl, event.request)) {
        event.respondWith(
            caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
                if (cachedResponse) {
                    // Stale-while-revalidate in background for local static files
                    if (requestUrl.origin === self.location.origin) {
                        fetch(event.request).then((networkResponse) => {
                            if (networkResponse && networkResponse.status === 200) {
                                caches.open(APP_SHELL_CACHE).then((cache) => {
                                    cache.put(event.request, networkResponse);
                                });
                            }
                        }).catch(() => {
                            // Offline or network error - ignore background update failure
                        });
                    }
                    return cachedResponse;
                }

                // If not in cache, fetch from network and cache
                return fetch(event.request).then((networkResponse) => {
                    if (networkResponse && networkResponse.status === 200) {
                        const responseToCache = networkResponse.clone();
                        caches.open(APP_SHELL_CACHE).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch(async () => {
                    // Navigation fallback to index.html when offline
                    if (event.request.mode === 'navigate') {
                        const fallbackResponse = await caches.match('/index.html') || await caches.match('/');
                        if (fallbackResponse) return fallbackResponse;
                    }
                    return new Response('Offline: Resource not available', {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: { 'Content-Type': 'text/plain' }
                    });
                });
            })
        );
        return;
    }

    // Strategy 2: Network-First for External / Dynamic Resources
    event.respondWith(
        fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(DYNAMIC_CACHE).then((cache) => {
                    cache.put(event.request, responseToCache);
                });
            }
            return networkResponse;
        }).catch(async () => {
            // Check dynamic or app shell cache for offline copy
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
                return cachedResponse;
            }

            // Fallback for navigation requests
            if (event.request.mode === 'navigate') {
                const fallbackResponse = await caches.match('/index.html') || await caches.match('/');
                if (fallbackResponse) return fallbackResponse;
            }

            return new Response('Offline: Network request failed and no cache is available', {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'text/plain' }
            });
        })
    );
});

/**
 * Message Event: Support immediate update from client
 */
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
