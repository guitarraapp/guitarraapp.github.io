// Imágenes pegadas o importadas (capturas, figuras de webs o de otros PDF). Se guardan como archivo en IndexedDB («imgs»).
import { uid } from "./util.js";
import { dbGet, dbPut } from "./db.js";

const MAX_SIDE = 3000;          // lado máximo guardado (px)
const MAX_BYTES = 6 * 1048576;  // por encima se recomprime
const urlCache = new Map();     // imgId -> Promise<objectURL>

function loadBitmap(blob) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { res({ img, url }); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("No se reconoce la imagen.")); };
    img.src = url;
  });
}

// Guarda la imagen (reducida si es enorme) y devuelve { id, w, h }
export async function storeImage(blob, name = "imagen") {
  if (!blob || !/^image\//.test(blob.type || "")) throw new Error("Lo pegado no es una imagen.");
  const { img, url } = await loadBitmap(blob);
  try {
    let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    if (!w || !h) throw new Error("La imagen está vacía.");
    let out = blob;
    const okType = /^image\/(png|jpeg)$/.test(blob.type);
    if (!okType || Math.max(w, h) > MAX_SIDE || blob.size > MAX_BYTES) {
      const k = Math.min(1, MAX_SIDE / Math.max(w, h));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(w * k)); c.height = Math.max(1, Math.round(h * k));
      const ctx = c.getContext("2d");
      if (blob.type === "image/jpeg") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); }
      ctx.drawImage(img, 0, 0, c.width, c.height);
      const type = blob.type === "image/jpeg" ? "image/jpeg" : "image/png";
      out = await new Promise(r => c.toBlob(r, type, 0.9));
      if (out && out.size > MAX_BYTES && type === "image/png") {
        // fotos grandes con fondo: JPEG con fondo blanco
        ctx.globalCompositeOperation = "destination-over"; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        out = await new Promise(r => c.toBlob(r, "image/jpeg", 0.88));
      }
      w = c.width; h = c.height; c.width = c.height = 0;
      if (!out) throw new Error("No se pudo preparar la imagen.");
    }
    const id = uid("img");
    await dbPut("imgs", { id, name: String(name).slice(0, 120), type: out.type, w, h, size: out.size, blob: out });
    return { id, w, h };
  } finally { URL.revokeObjectURL(url); }
}

export function imageUrl(imgId) {
  if (!urlCache.has(imgId)) {
    const p = (async () => {
      const rec = await dbGet("imgs", imgId);
      if (!rec) throw new Error("Falta la imagen");
      return URL.createObjectURL(rec.blob);
    })();
    urlCache.set(imgId, p);
    p.catch(() => urlCache.delete(imgId));
  }
  return urlCache.get(imgId);
}

export async function imageRecord(imgId) { return dbGet("imgs", imgId); }

// Objeto de página para una imagen, centrado en (cx, cy) y que no pase de maxW × maxH puntos
export function imageObj(info, cx, cy, maxW, maxH) {
  // 1 px de pantalla ≈ 0,75 pt; se limita al hueco disponible
  let w = info.w * 0.75, h = info.h * 0.75;
  const k = Math.min(1, maxW / w, maxH / h);
  w *= k; h *= k;
  return { id: uid("o"), t: "image", imgId: info.id, x: cx - w / 2, y: cy - h / 2, w, h, nw: info.w, nh: info.h, cx: 0, cy: 0, cw: info.w, ch: info.h };
}
