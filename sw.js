const CACHE_NAME = 'fadilabs-envelope-decoder-v1';
const OFFLINE_URLS = [
  '/',
  '/Index.html',
  '/manifest.json',
  '/styles/tailwind.min.css',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // For navigation requests, try network first, fallback to cached index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then(resp => {
        return resp;
      }).catch(() => caches.match('/Index.html'))
    );
    return;
  }

  // For other requests, use cache-first then fetch and cache
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Don't cache opaque responses from cross-origin if you prefer security; but caching helps offline here
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          try { cache.put(event.request, responseClone); } catch (e) { /* ignore */ }
        });
        return response;
      }).catch(() => {
        // As a last-resort, for images or other requests, try a fallback (optional)
        return caches.match('/Index.html');
      });
    })
  );
});