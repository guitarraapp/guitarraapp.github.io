// Imágenes de pantalla para los recortes de partitura (el PDF exportado los usa en vectorial)
import { getPdfDoc } from "./pdfjs.js";

const K = 4;                 // resolución de pantalla del recorte (4 px por punto ≈ 288 ppp)
const urlCache = new Map();  // clave -> Promise<objectURL>
const pageCache = new Map(); // pdfId:index -> Promise<canvas> (solo las 2 últimas)

function key(o) { return `${o.src.pdfId}:${o.src.index}:${o.sx.toFixed(2)}:${o.sy.toFixed(2)}:${o.sw.toFixed(2)}:${o.sh.toFixed(2)}`; }

async function pageCanvas(pdfId, index) {
  const k = `${pdfId}:${index}`;
  if (!pageCache.has(k)) {
    pageCache.set(k, (async () => {
      const doc = await getPdfDoc(pdfId);
      const page = await doc.getPage(index + 1);
      const vp = page.getViewport({ scale: K });
      const c = document.createElement("canvas");
      c.width = Math.floor(vp.width); c.height = Math.floor(vp.height);
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
      await page.render({ canvas: c, canvasContext: ctx, viewport: vp }).promise;
      return c;
    })());
    while (pageCache.size > 2) {
      const first = pageCache.keys().next().value;
      pageCache.get(first).then(c => { c.width = c.height = 0; }).catch(() => {});
      pageCache.delete(first);
    }
  }
  return pageCache.get(k);
}

export function clipUrl(o) {
  const k = key(o);
  if (!urlCache.has(k)) {
    const p = (async () => {
      const page = await pageCanvas(o.src.pdfId, o.src.index);
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(o.sw * K)); c.height = Math.max(1, Math.round(o.sh * K));
      c.getContext("2d").drawImage(page, o.sx * K, o.sy * K, o.sw * K, o.sh * K, 0, 0, c.width, c.height);
      const blob = await new Promise(res => c.toBlob(res, "image/png"));
      return URL.createObjectURL(blob);
    })();
    urlCache.set(k, p);
    p.catch(() => urlCache.delete(k));
  }
  return urlCache.get(k);
}
