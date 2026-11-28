// Miniaturas: fondo PDF de una hoja (para el organizador) y portada de una pieza (para la biblioteca)
import { getPdfDoc, renderToCanvas } from "./pdfjs.js";
import { renderObj, objBox, holeToPage } from "./objects.js";
import { clipUrl } from "./clips.js";
import { imageUrl } from "./images.js";
import { pagePdfId } from "./model.js";

const bgCache = new Map(); // pdfId:index:ancho -> Promise<dataURL>
let queue = Promise.resolve(); // de una en una para no saturar

export function pdfThumbUrl(pdfId, index, width = 150) {
  const k = `${pdfId}:${index}:${width}`;
  if (!bgCache.has(k)) {
    const p = queue.then(async () => {
      const doc = await getPdfDoc(pdfId);
      const page = await doc.getPage(index + 1);
      const vp = page.getViewport({ scale: 1 });
      const c = document.createElement("canvas");
      const task = await renderToCanvas(page, c, (width * 2) / vp.width);
      await task.promise;
      const url = c.toDataURL("image/jpeg", 0.72);
      c.width = c.height = 0;
      return url;
    });
    queue = p.catch(() => {});
    bgCache.set(k, p);
    p.catch(() => bgCache.delete(k));
  }
  return bgCache.get(k);
}

function loadImg(src) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}

// Portada JPEG de una pieza: la primera hoja con su fondo y lo que tenga encima
export async function pieceThumb(piece, width = 140) {
  const pg = piece.pages[0];
  if (!pg) return "";
  const k = width / pg.w;
  const c = document.createElement("canvas");
  c.width = Math.round(width); c.height = Math.round(pg.h * k);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
  const pid = pagePdfId(piece, pg);
  if (pid) { try { ctx.drawImage(await loadImg(await pdfThumbUrl(pid, pg.src.index, Math.round(width))), 0, 0, c.width, c.height); } catch { /* sin fondo */ } }
  ctx.fillStyle = "#fff";
  for (const h of pg.holes || []) ctx.fillRect(h.x * k, h.y * k, h.w * k, h.h * k);
  // objetos en su orden: los vectoriales van en lotes como SVG; recortes e imágenes directamente
  let batch = [];
  const flush = async () => {
    if (!batch.length) return;
    const g = batch.map(o => new XMLSerializer().serializeToString(renderObj(o))).join("");
    batch = [];
    const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${c.width}" height="${c.height}" viewBox="0 0 ${pg.w} ${pg.h}">${g}</svg>`;
    const url = URL.createObjectURL(new Blob([s], { type: "image/svg+xml" }));
    try { ctx.drawImage(await loadImg(url), 0, 0, c.width, c.height); } catch { /* nada */ } finally { URL.revokeObjectURL(url); }
  };
  for (const o of pg.objs) {
    if (o.t === "meas") { if (!o.nomk && o.ch && Object.keys(o.ch).length) batch.push({ ...o, _print: 1 }); continue; }
    if (o.t === "clip" || o.t === "image") {
      await flush();
      ctx.save();
      if (o.holes?.length) { // solo la caja menos lo cortado
        const b = objBox(o); ctx.beginPath(); ctx.rect(b.x * k, b.y * k, b.w * k, b.h * k);
        for (const h0 of o.holes) { const h = holeToPage(o, h0); ctx.rect(h.x * k, h.y * k, h.w * k, h.h * k); }
        ctx.clip("evenodd");
      }
      try {
        if (o.t === "clip") {
          const w = o.sw * o.scale, h = o.sh * o.scale;
          ctx.fillStyle = "#fff"; ctx.fillRect(o.x * k, o.y * k, w * k, h * k);
          ctx.drawImage(await loadImg(await clipUrl(o)), o.x * k, o.y * k, w * k, h * k);
        } else {
          const im = await loadImg(await imageUrl(o.imgId));
          const fx = im.naturalWidth / o.nw, fy = im.naturalHeight / o.nh;
          ctx.drawImage(im, o.cx * fx, o.cy * fy, o.cw * fx, o.ch * fy, o.x * k, o.y * k, o.w * k, o.h * k);
        }
      } catch { /* nada */ }
      ctx.restore();
    } else batch.push(o);
  }
  await flush();
  const url = c.toDataURL("image/jpeg", 0.75);
  c.width = c.height = 0;
  return url;
}
