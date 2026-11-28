// Separar una recopilación en piezas y liberar espacio. Cada pieza nueva guarda SOLO las páginas que usa (PDF propio).
import { uid, clone } from "./util.js";
import { dbTx, dbAll, dbGet, dbPut, bumpChanges } from "./db.js";
import { getPdfBytes, openPdfBytes, pageInfo, destroyDoc, getPdfDoc, forgetPdf } from "./pdfjs.js";
import { pagePdfId, newPiece, pdfIdsOf } from "./model.js";
import { pieceThumb } from "./thumbs.js";

// Páginas de PDF que necesitan unas hojas: su fondo y las de los recortes que llevan encima
function refsOf(piece, pages) {
  const refs = [], seen = new Set();
  const add = (pdf, index) => { const k = `${pdf}:${index}`; if (!seen.has(k)) { seen.add(k); refs.push({ pdf, index, k }); } };
  for (const pg of pages) {
    const pid = pagePdfId(piece, pg);
    if (pid) add(pid, pg.src.index);
    for (const o of pg.objs) if (o.t === "clip" && o.src?.pdfId) add(o.src.pdfId, o.src.index);
  }
  return refs;
}

// PDF nuevo con esas páginas en ese orden; las de un mismo PDF se copian juntas (no se duplican fuentes)
async function buildPdf(refs) {
  const { PDFDocument } = window.PDFLib;
  const out = await PDFDocument.create();
  const bySrc = new Map();
  for (const r of refs) { if (!bySrc.has(r.pdf)) bySrc.set(r.pdf, []); bySrc.get(r.pdf).push(r); }
  const copied = new Map();
  for (const [pdf, list] of bySrc) {
    const src = await PDFDocument.load(await getPdfBytes(pdf), { ignoreEncryption: true });
    const pages = await out.copyPages(src, list.map(r => r.index));
    list.forEach((r, i) => copied.set(r.k, pages[i]));
  }
  const map = new Map();
  refs.forEach((r, i) => { out.addPage(copied.get(r.k)); map.set(r.k, i); });
  const bytes = await out.save();
  // comprobación: se abre con pdf.js y se leen las medidas reales de cada página
  const doc = await openPdfBytes(bytes.slice());
  const info = [];
  try {
    if (doc.numPages !== refs.length) throw new Error("El PDF nuevo no tiene las páginas esperadas.");
    for (let i = 1; i <= doc.numPages; i++) info.push(pageInfo(await doc.getPage(i)));
  } finally { destroyDoc(doc); }
  return { bytes, map, info };
}

function remapPages(piece, pages, pdfId, map, info, keepIds) {
  return pages.map(pg => {
    const c = clone(pg);
    if (!keepIds) c.id = uid("pg");
    if (c.src.kind === "pdf") {
      const ni = map.get(`${pagePdfId(piece, pg)}:${pg.src.index}`);
      c.src = { kind: "pdf", pdfId, index: ni, view: info[ni].view, rotate: info[ni].rotate };
    }
    c.objs = c.objs.map(o => {
      const x = clone(o);
      if (!keepIds) x.id = uid("o");
      if (x.t === "clip" && map.has(`${x.src.pdfId}:${x.src.index}`)) {
        const ni = map.get(`${x.src.pdfId}:${x.src.index}`);
        x.src = { ...x.src, pdfId, index: ni, view: info[ni].view, rotate: info[ni].rotate };
      }
      return x;
    });
    return c;
  });
}

async function refreshThumb(piece) {
  try { piece.thumb = await pieceThumb(piece); await dbPut("pieces", piece); } catch (e) { console.warn("miniatura", e); }
}

// Crea una pieza nueva con esas hojas (copias). No toca la pieza original.
export async function createPieceFromPages(piece, pages, { title, tags = [] } = {}) {
  if (!pages.length) throw new Error("No hay hojas seleccionadas.");
  const np = newPiece(title || `${piece.title} (parte)`);
  np.tags = tags.slice(0, 30);
  np.videoUrl = "";
  const refs = refsOf(piece, pages);
  const entries = [];
  if (refs.length) {
    const { bytes, map, info } = await buildPdf(refs);
    const pdfId = uid("pdf");
    entries.push({ store: "pdfs", value: { id: pdfId, name: `${np.title}.pdf`, size: bytes.length, pageCount: info.length, blob: new Blob([bytes], { type: "application/pdf" }) } });
    np.pdfId = pdfId;
    np.pages = remapPages(piece, pages, pdfId, map, info, false);
  } else {
    np.pages = remapPages(piece, pages, null, new Map(), [], false);
  }
  entries.push({ store: "pieces", value: np });
  await dbTx(entries); // PDF y pieza a la vez: o todo o nada
  await bumpChanges(1);
  await refreshThumb(np);
  return np;
}

// Páginas del PDF que la pieza no usa (porque se borraron hojas o se separaron)
export async function wasteInfo(piece) {
  const used = new Map();
  for (const r of refsOf(piece, piece.pages)) { if (!used.has(r.pdf)) used.set(r.pdf, new Set()); used.get(r.pdf).add(r.index); }
  let unused = 0, bytes = 0;
  for (const [pdf, set] of used) {
    const rec = await dbGet("pdfs", pdf);
    if (!rec) continue;
    const extra = Math.max(0, (rec.pageCount || 0) - set.size);
    unused += extra;
    if (extra) bytes += rec.size || rec.blob?.size || 0;
  }
  const others = (await dbAll("pieces")).filter(p => p.id !== piece.id);
  const shared = new Set(others.flatMap(pdfIdsOf));
  const sharedWith = [...used.keys()].filter(id => shared.has(id)).length;
  return { unused, bytes, shared: sharedWith > 0, pdfs: used.size };
}

// Rehace el PDF de la pieza solo con lo que usa y borra los PDF antiguos que ya no use nadie
export async function compactPiece(piece) {
  const refs = refsOf(piece, piece.pages);
  const oldIds = pdfIdsOf(piece);
  const np = clone(piece);
  const entries = [];
  if (refs.length) {
    const { bytes, map, info } = await buildPdf(refs);
    const pdfId = uid("pdf");
    entries.push({ store: "pdfs", value: { id: pdfId, name: `${piece.title}.pdf`, size: bytes.length, pageCount: info.length, blob: new Blob([bytes], { type: "application/pdf" }) } });
    np.pdfId = pdfId;
    np.pages = remapPages(piece, piece.pages, pdfId, map, info, true);
  } else { np.pdfId = null; }
  np.updatedAt = Date.now();
  entries.push({ store: "pieces", value: np });
  const others = (await dbAll("pieces")).filter(p => p.id !== piece.id);
  const used = new Set(others.flatMap(pdfIdsOf));
  const freed = [];
  for (const id of oldIds) if (!used.has(id) && id !== np.pdfId) { entries.push({ store: "pdfs", del: id }); freed.push(id); }
  await dbTx(entries);
  freed.forEach(forgetPdf);
  await bumpChanges(1);
  return np;
}

// Título probable para un grupo de hojas: prueba la primera con partitura y, si no, el origen de sus recortes
export async function suggestTitleFor(piece, pages) {
  const cands = [];
  for (const pg of pages) if (pagePdfId(piece, pg)) cands.push(pg);
  for (const pg of pages) for (const o of pg.objs) if (o.t === "clip") cands.push({ src: { kind: "pdf", pdfId: o.src.pdfId, index: o.src.index } });
  for (const c of cands.slice(0, 3)) { const t = await suggestTitle(piece, c); if (t) return t; }
  return "";
}
// Título probable de una pieza: el texto más grande de la parte de arriba de su primera hoja (si el PDF tiene texto)
export async function suggestTitle(piece, pg) {
  const pid = pagePdfId(piece, pg);
  if (!pid) return "";
  try {
    const doc = await getPdfDoc(pid);
    const page = await doc.getPage(pg.src.index + 1);
    const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    const items = tc.items.filter(it => it.str && it.str.trim()).map(it => {
      const [x, y] = vp.convertToViewportPoint(it.transform[4], it.transform[5]);
      return { s: it.str, x, y, size: Math.hypot(it.transform[2], it.transform[3]) };
    }).filter(it => it.y < vp.height * 0.4 && !/^[\d\s.,:;()\-–—=♩♪]+$/.test(it.s));
    if (!items.length) return "";
    const max = Math.max(...items.map(i => i.size));
    const top = items.find(i => i.size === max);
    const line = items.filter(i => i.size >= max * 0.88 && Math.abs(i.y - top.y) < max * 0.7).sort((a, b) => a.x - b.x);
    return line.map(i => i.s).join(" ").replace(/\s+/g, " ").trim().slice(0, 80);
  } catch { return ""; }
}
