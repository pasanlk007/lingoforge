// This is a basic service worker file.
// It's required for a web app to be considered a PWA and be installable.
self.addEventListener('fetch', (event) => {
  // For this basic setup, we're not implementing any caching strategies.
  // The service worker will just pass through the requests.
  event.respondWith(fetch(event.request));
});
