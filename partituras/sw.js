const CACHE_NAME = "partituras-pwa-v11-1-r3";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon.svg",
  "./pwa-192x192.png",
  "./pwa-512x512.png",
  "./pwa-maskable-512x512.png",
  "./apple-touch-icon.png"
];
const CDN_LIBS = [
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        APP_SHELL.map(async (url) => {
          const resp = await fetch(url, { cache: "reload" });
          if (resp && resp.ok) await cache.put(url, resp);
        })
      );
      await Promise.allSettled(
        CDN_LIBS.map(async (url) => {
          const resp = await fetch(url, { mode: "cors" });
          if (resp && resp.ok) await cache.put(url, resp);
        })
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          if (resp && resp.ok) {
            const copy = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put("./index.html", copy));
          }
          return resp;
        })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  const isSameOrigin = url.origin === self.location.origin;
  const isPdfCdn = url.origin === "https://cdnjs.cloudflare.com";
  if (!isSameOrigin && !isPdfCdn) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        if (resp && (resp.ok || resp.type === "opaque")) {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
        }
        return resp;
      });
    })
  );
});
