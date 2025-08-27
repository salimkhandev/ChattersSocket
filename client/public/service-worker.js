self.__WB_MANIFEST

const CACHE_VERSION = 'v3';
const CACHE_NAME = `app-cache-${CACHE_VERSION}`;

const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/android-chrome-192x192.png',
    '/icons/android-chrome-512x512.png',
    '/icons/apple-touch-icon.png',
    '/icons/favicon-16x16.png',
    '/icons/favicon-32x32.png',
    '/favicon.ico'
];

// Install event: Cache assets
self.addEventListener('install', (event) => {
    console.log('Service Worker installing.');
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log('🚀 Service Worker: Installation Started');
            for (const file of FILES_TO_CACHE) {
                try {
                    await cache.add(new Request(file, { cache: 'reload' }));
                    console.log('✅ Cached Successfully:', file);
                } catch (error) {
                    console.warn('❌ Cache Failed:', file, error);
                }
            }
            console.log('🎉 Service Worker: Installation Complete');
        })
    );
});

// Activate event remains the same
self.addEventListener('activate', (event) => {
    console.log('Service Worker activating.');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🧹 Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    console.log('💪 Service Worker: Activated');
    return self.clients.claim();
});

// Updated fetch event handler with proper dynamic caching
self.addEventListener('fetch', (event) => {
    console.log('🚀 Fetch event:', event.request.url);

    // Skip non-GET requests and non-same-origin requests
    if (
        !event.request.url.startsWith(self.location.origin) ||
        event.request.method !== 'GET'
    ) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                console.log('✅ Serving from Cache:', event.request.url);
                return cachedResponse;
            }

            return fetch(event.request)
                .then((networkResponse) => {
                    // Check if we received a valid response
                    if (!networkResponse || networkResponse.status !== 200) {
                        console.log('❌ Invalid response:', event.request.url);
                        return networkResponse;
                    }

                    // IMPORTANT: Clone the response before caching
                    const responseToCache = networkResponse.clone();

                    // Cache the fetched response
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache); // Uncommented this line
                            console.log('📥 Cached new resource:', event.request.url);
                        })
                        .catch((error) => {
                            console.error('❌ Cache put failed:', error);
                        });

                    return networkResponse;
                })
                .catch((error) => {
                    console.error('❌ Fetch failed:', error);
                    // You might want to return a custom offline page here
                    return caches.match('/offline.html');
                });
        })
    );
});

// Optional: Add a message event handler for cache updates
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});