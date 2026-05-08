const CACHE_VERSION = 'v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('Offline - please check connection', { 
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      });
    })
  );
});
