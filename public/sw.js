const CACHE_NAME = "lamas-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/login",
  "/manifest.json",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/favicon.ico"
];

// Install Event - Pre-cache essential shells and assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] Pre-caching offline resources");
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Deleting obsolete cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Hybrid Caching Strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Bypass API routes, auth callbacks, and server actions
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/_next/data") || request.method !== "GET") {
    return;
  }

  // 2. Network-First, Fallback-to-Cache Strategy for HTML pages/navigation
  if (request.mode === "navigate" || request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response and cache it for offline reading
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseCopy);
          });
          return response;
        })
        .catch(() => {
          // If network fails, return from cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            // Standard fallback if both fail (e.g. not in cache)
            return caches.match("/login");
          });
        })
    );
    return;
  }

  // 3. Cache-First, Fallback-to-Network Strategy for static static assets/fonts/images
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Asynchronously update cache in the background for next load (Stale-While-Revalidate style)
        fetch(request).then((response) => {
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
          }
        }).catch(() => {/* Ignore network errors during background sync */});
        
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response;
        }
        const responseCopy = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseCopy);
        });
        return response;
      });
    })
  );
});
