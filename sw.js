const CACHE_NAME = "gameverse-pwa-cache-v2"; // Ubah versi cache jika ada perubahan aset
const API_CACHE_NAME = "gameverse-api-cache-v1"; // Cache untuk data API

const ASSETS_TO_CACHE = [
  "/", // Root path for start_url
  "index.html",
  "detail.html",
  "favorites.html", // Halaman favorit
  "style.css",
  "app.js",
  "idb-utility.js", // IndexedDB utility script
  "manifest.json",
  // Pastikan path ke ikon yang Anda gunakan benar
  "assets/icon-192x192.png",
  "assets/icon-512x512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css", // Font Awesome
  "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap", // Google Fonts
];

// Event: Install Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching App Shell");
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .catch((error) => {
        console.error("Service Worker: App Shell caching failed", error);
      })
  );
});

// Event: Activate Service Worker
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log("Service Worker: Clearing old cache", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Immediately control clients
});

// Event: Fetch requests
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Cache-First, then Network for App Shell assets
  if (
    ASSETS_TO_CACHE.includes(requestUrl.pathname) ||
    requestUrl.origin === self.location.origin
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
  // Cache-First, then Network for API data (Stale-While-Revalidate-like)
  // Applies to the main games list API and individual game detail API
  else if (
    requestUrl.host === "www.freetogame.com" &&
    requestUrl.pathname.startsWith("/api/")
  ) {
    event.respondWith(
      caches
        .open(API_CACHE_NAME)
        .then((cache) => {
          return cache.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request)
              .then((networkResponse) => {
                // Put a copy of the response in the cache
                cache.put(event.request, networkResponse.clone());
                return networkResponse;
              })
              .catch((error) => {
                console.log(
                  "Service Worker: Network fetch failed for API:",
                  error
                );
                // If network fails and there's a cached response, return it.
                // Otherwise, the cachedResponse will be null and the outer promise will resolve with undefined.
                // The client-side app.js needs to handle this fallback/error.
                return cachedResponse; // Return cached data if network fails
              });

            // Return cached data immediately if available, otherwise wait for network
            return cachedResponse || fetchPromise;
          });
        })
        .catch((error) => {
          console.error("Service Worker: API cache access error:", error);
          return fetch(event.request); // Fallback to network if cache fails
        })
    );
  }
  // Default: go to network for anything else (e.g., external links)
  else {
    event.respondWith(fetch(event.request));
  }
});
