/* GWENO service worker: cache only public static assets; never cache account/API responses. */
const CACHE_NAME = 'gweno-static-v1';
const STATIC_ASSETS = ['/offline.html', '/icons/gweno-192.png', '/icons/gweno-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/') || url.pathname.startsWith('/login') ||
      url.pathname.startsWith('/register') || url.pathname.startsWith('/dashboard') || url.pathname.startsWith('/withdraw') ||
      url.pathname.startsWith('/premium') || url.pathname.startsWith('/profile') || url.pathname.startsWith('/admin')) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/offline.html')));
    return;
  }
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
  }
});
