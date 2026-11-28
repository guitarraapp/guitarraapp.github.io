// Carga de pdf.js local (sin servidores externos) y caché de documentos abiertos
import * as pdfjsLib from "../vendor/pdfjs/pdf.min.js";
import { dbGet } from "./db.js";

const base = new URL("../vendor/pdfjs/", import.meta.url).href;
pdfjsLib.GlobalWorkerOptions.workerSrc = base + "pdf.worker.min.js";

const docCache = new Map(); // pdfId -> Promise<PDFDocumentProxy>

export function openPdfBytes(bytes) {
  return pdfjsLib.getDocument({
    data: bytes,
    isEvalSupported: false,
    standardFontDataUrl: base + "standard_fonts/",
    wasmUrl: base + "wasm/",
    enableXfa: false,
  }).promise;
}

export async function getPdfDoc(pdfId) {
  if (!docCache.has(pdfId)) {
    const p = (async () => {
      const rec = await dbGet("pdfs", pdfId);
      if (!rec) throw new Error("No se encuentra el PDF de esta pieza.");
      const bytes = new Uint8Array(await rec.blob.arrayBuffer());
      return openPdfBytes(bytes);
    })();
    docCache.set(pdfId, p);
    p.catch(() => docCache.delete(pdfId));
  }
  return docCache.get(pdfId);
}

export async function getPdfBytes(pdfId) {
  const rec = await dbGet("pdfs", pdfId);
  if (!rec) throw new Error("No se encuentra el PDF de esta pieza.");
  return new Uint8Array(await rec.blob.arrayBuffer());
}

export function destroyDoc(d) {
  try { (d?.loadingTask?.destroy ? d.loadingTask.destroy() : d?.destroy?.()); } catch { /* nada */ }
}
export function forgetPdf(pdfId) {
  const p = docCache.get(pdfId);
  docCache.delete(pdfId);
  if (p) p.then(destroyDoc).catch(() => {});
}

// Información de página en puntos tal como se ve (con rotación)
export function pageInfo(pdfPage) {
  const vp = pdfPage.getViewport({ scale: 1 });
  return {
    w: Math.round(vp.width * 100) / 100,
    h: Math.round(vp.height * 100) / 100,
    view: pdfPage.view.map(v => Math.round(v * 1000) / 1000),
    rotate: ((pdfPage.rotate || 0) % 360 + 360) % 360,
  };
}

export async function renderToCanvas(pdfPage, canvas, scale) {
  const viewport = pdfPage.getViewport({ scale });
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const task = pdfPage.render({ canvas, canvasContext: ctx, viewport });
  return task;
}

export async function makeThumb(pdfPage, width = 140) {
  const vp = pdfPage.getViewport({ scale: 1 });
  const scale = width / vp.width;
  const c = document.createElement("canvas");
  const task = await renderToCanvas(pdfPage, c, scale);
  await task.promise;
  return c.toDataURL("image/jpeg", 0.7);
}
