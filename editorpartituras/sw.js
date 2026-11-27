// Service worker de Partituras. Solo toca sus propias cachés (prefijo + carpeta).
const VER = "11.2.1-f2"; // debe coincidir con APP_VERSION de js/util.js
const SCOPE_KEY = new URL(self.registration.scope).pathname.replace(/[^a-z0-9]+/gi, "_");
const PREFIX = `partituras-app-${SCOPE_KEY}-`;
const CACHE = PREFIX + VER;
const CORE = [
  "./", "index.html", "manifest.webmanifest", "css/app.css",
  "js/app.js", "js/util.js", "js/db.js", "js/pdfjs.js", "js/model.js", "js/chords.js", "js/objects.js", "js/clips.js",
  "js/editor.js", "js/exportpdf.js", "js/backup.js", "js/ideas.js", "js/help.js",
  "js/images.js", "js/thumbs.js", "js/split.js", "js/organizer.js",
  "vendor/pdf-lib.min.js", "vendor/pdfjs/pdf.min.js", "vendor/pdfjs/pdf.worker.min.js",
  "icons/icon-192.png", "icons/icon-512.png",
];

self.addEventListener("install", (e) => {
  // cache:"reload" = pedir cada archivo al servidor, sin pasar por la caché del navegador.
  // Sin esto, GitHub Pages (que deja cada archivo 10 min en esa caché) podía colar archivos
  // de la versión anterior en la nueva: versión antigua, botones sin funcionar, pegar que no pega…
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.all(CORE.map(async (u) => {
      const res = await fetch(new Request(u, { cache: "reload" }));
      if (!res.ok) throw new Error(`${u}: ${res.status}`);
      await c.put(u, res);
    }));
  })());
});
self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener("message", (e) => {
  if (e.data === "skipWaiting") self.skipWaiting();
  if (e.data === "version") e.source?.postMessage({ swVersion: VER });
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin || !url.pathname.startsWith(new URL(self.registration.scope).pathname)) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    try {
      const res = await fetch(req);
      // fuentes y wasm de pdf.js se guardan la primera vez que se usan
      if (res.ok && url.pathname.includes("/vendor/")) cache.put(req, res.clone());
      return res;
    } catch (err) {
      if (req.mode === "navigate") { const idx = await cache.match("index.html"); if (idx) return idx; }
      throw err;
    }
  })());
});
