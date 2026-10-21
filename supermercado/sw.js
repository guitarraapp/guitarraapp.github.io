// Cambia V cuando publiques una versión nueva para renovar la caché
const V='compras-v13',CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png'],
CDN=['https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js','https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js','https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(V).then(async c=>{await c.addAll(CORE);await Promise.allSettled(CDN.map(u=>c.add(u)))}))});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
// Caché primero y actualización en segundo plano (la app abre rápido y funciona sin conexión)
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const u=new URL(e.request.url);
  if(u.origin!==location.origin&&u.hostname!=='cdnjs.cloudflare.com')return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(m=>{
    const n=fetch(e.request).then(r=>{if(r.ok){const c=r.clone();caches.open(V).then(x=>x.put(e.request,c))}return r}).catch(()=>m);
    return m||n}))});
