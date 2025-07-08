// Nama cache untuk aset aplikasi (App Shell) dan API
const CACHE_NAME = "gameverse-pwa-cache-v2"; // Versi cache untuk aset statis
const API_CACHE_NAME = "gameverse-api-cache-v1"; // Versi cache khusus untuk data API

// Daftar file statis yang akan dicache saat instalasi Service Worker
const ASSETS_TO_CACHE = [
  "/", // Halaman utama (root)
  "index.html",
  "detail.html",
  "favorites.html", // Halaman favorit
  "style.css",
  "app.js",
  "idb-utility.js", // Utility script untuk IndexedDB
  "manifest.json",
  "assets/icon-192x192.png", // Ikon PWA
  "assets/icon-512x512.png",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css", // Font Awesome
  "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap", // Google Fonts
];

// Event: Install → untuk cache App Shell
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");

  event.waitUntil(
    caches
      .open(CACHE_NAME) // Buka cache
      .then((cache) => {
        console.log("Service Worker: Caching App Shell");
        return cache.addAll(ASSETS_TO_CACHE); // Cache semua aset statis
      })
      .catch((error) => {
        console.error("Service Worker: App Shell caching failed", error);
      })
  );
});

// Event: Activate → membersihkan cache lama
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log("Service Worker: Clearing old cache", cacheName);
            return caches.delete(cacheName); // Hapus cache lama
          }
        })
      );
    })
  );

  return self.clients.claim(); // Agar langsung mengontrol halaman aktif
});

// Event: Fetch → menangani request
self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Strategi: Cache-first untuk App Shell
  if (
    ASSETS_TO_CACHE.includes(requestUrl.pathname) || // Jika file termasuk daftar cache
    requestUrl.origin === self.location.origin // Atau berasal dari domain yang sama
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Jika ada di cache, pakai cache. Kalau tidak, fetch ke jaringan.
        return response || fetch(event.request);
      })
    );
  }

  // Strategi: Cache-first + Stale-While-Revalidate untuk API (FreeToGame)
  else if (
    requestUrl.host === "www.freetogame.com" && // Domain API
    requestUrl.pathname.startsWith("/api/") // Path API
  ) {
    event.respondWith(
      caches
        .open(API_CACHE_NAME)
        .then((cache) => {
          return cache.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request)
              .then((networkResponse) => {
                cache.put(event.request, networkResponse.clone()); // Update cache
                return networkResponse; // Return data dari network
              })
              .catch((error) => {
                console.log("Service Worker: Network fetch failed for API:", error);
                return cachedResponse; // Jika gagal, pakai cache jika ada
              });

            // Return cache dulu jika ada, sambil tetap fetch di background
            return cachedResponse || fetchPromise;
          });
        })
        .catch((error) => {
          console.error("Service Worker: API cache access error:", error);
          return fetch(event.request); // Jika gagal buka cache, fallback ke jaringan
        })
    );
  }

  // Default: Ambil langsung dari network untuk selain App Shell & API
  else {
    event.respondWith(fetch(event.request));
  }
});
