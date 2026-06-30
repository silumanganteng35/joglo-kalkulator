// ============================================================
// Service Worker — Kalkulator Sablon Kaos PWA
// Cache-first strategy untuk offline support
// ============================================================

const CACHE_NAME = "kalkulator-sablon-v1.4";

const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./app.min.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

// ── Install: cache semua asset ──
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: hapus cache lama ──
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first, fallback ke network ──
self.addEventListener("fetch", event => {
  // Hanya handle GET requests
  if (event.request.method !== "GET") return;

  // Skip cross-origin non-Google-Fonts requests
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === location.origin;
  const isGoogleFonts = url.hostname.includes("fonts.googleapis.com") ||
                        url.hostname.includes("fonts.gstatic.com");

  if (!isSameOrigin && !isGoogleFonts) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache valid responses
        if (response && response.status === 200 &&
            (response.type === "basic" || response.type === "cors")) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: return index.html for navigation requests
        if (event.request.destination === "document") {
          return caches.match("./index.html");
        }
      });
    })
  );
});
