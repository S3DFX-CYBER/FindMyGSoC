const CACHE_NAME = 'gsoc-finder-v5';
const CRITICAL_ASSETS = [
  './',
  'index.html',
  'landing.html',
  'manifest.json',
  'src/styles.css',
  'src/js/org.js',
  'src/js/app.js',
  'src/js/githubAnalyzer.js',
  'src/js/skillExtractor.js',
  'src/js/recommender.js',
  'src/js/recommendation-ui.js',
  'src/components/footer.html',
  'src/js/footer.js',
  'src/assets/icon-512.png'
];

const OPTIONAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
];

globalThis.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Install critical assets first
      await cache.addAll(CRITICAL_ASSETS);

      // Try to cache optional assets individually, catching errors so they don't break install
      await Promise.all(
        OPTIONAL_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.status === 200 || response.ok) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.warn('[ServiceWorker] Failed to precache optional asset:', url, err);
          }
        })
      );
    }).then(() => globalThis.skipWaiting())
  );
});

globalThis.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => globalThis.clients.claim())
  );
});

globalThis.addEventListener('fetch', (event) => {
  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return; // Ignore unparseable URLs
  }
  if (event.request.method && event.request.method !== 'GET') return;
  if (url.protocol && url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Network-First for API calls and data fetches.
  // /api/github keys stay query-sensitive (each repo slug differs).
  // /data/issues.json is fetched with ?v=<timestamp> busters in app.js;
  // normalise to the canonical path so every bust hits the same cache entry
  // and the offline fallback actually works.
  if (url.pathname.includes('/api/github') || url.pathname.includes('/data/issues.json')) {
    const cacheKey = url.pathname.includes('/data/issues.json')
      ? new Request(url.origin + url.pathname)  // strip query string
      : event.request;                           // keep query for GitHub API

    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, copy));
          }
          return response;
        })
        .catch(() => caches.match(cacheKey).then((res) => res || new Response('{"error":"offline"}', {
          headers: { 'Content-Type': 'application/json' }
        })))
    );
  } else {
    // Stale-While-Revalidate for static assets
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        }).catch(() => {
          if (event.request.mode === 'navigate') {
            // Try to serve the exact requested page from cache first
            // (e.g. landing.html is precached and should be served offline).
            // Only fall back to index.html if the specific page isn't cached.
            return caches.match(event.request).then((res) => res || caches.match('index.html'));
          }
          return caches.match(event.request);
        });

        return cachedResponse || fetchPromise;
      })
    );
  }
});
