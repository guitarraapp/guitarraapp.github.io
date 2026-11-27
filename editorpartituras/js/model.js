// Modelo de datos: piezas -> páginas -> objetos. Todas las medidas en PUNTOS de página (1/72"),
// con origen arriba a la izquierda. No dependen del zoom ni de la resolución de pantalla.
import { uid, num, clamp } from "./util.js";
import { dbPut, dbPutMany, dbAll, dbDel, dbGet, dbTx } from "./db.js";
import { openPdfBytes, pageInfo, makeThumb, destroyDoc } from "./pdfjs.js";

export const A4 = { w: 595.28, h: 841.89 };
export const A4H = { w: A4.h, h: A4.w }; // horizontal
export const OBJ_TYPES = ["text", "line", "rect", "chord", "finger", "loop", "path", "ellipse", "clip", "image", "staff", "neck"];
// PDF del que sale el fondo de una hoja (desde la fase 2 cada hoja puede llevar el suyo)
export function pagePdfId(piece, pg) { return pg?.src?.kind === "pdf" ? (pg.src.pdfId || piece.pdfId || null) : null; }
export const isLandscape = (pg) => pg.w > pg.h;

export function newPiece(title) {
  const now = Date.now();
  return {
    id: uid("pz"), title: title || "Sin título", tags: [], favorite: false,
    createdAt: now, updatedAt: now, pdfId: null, thumb: "", videoUrl: "",
    pages: [], practice: {}, schema: 1,
  };
}
export function blankPage(w = A4.w, h = A4.h) {
  return { id: uid("pg"), src: { kind: "blank" }, w, h, objs: [] };
}
export function blankPageOriented(orient) { return orient === "h" ? blankPage(A4H.w, A4H.h) : blankPage(A4.w, A4.h); }

/* ---------- Importar PDF ---------- */
export async function importPdfFile(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const doc = await openPdfBytes(buf.slice());
  try {
    const pdfId = uid("pdf");
    const piece = newPiece((file.name || "partitura").replace(/\.pdf$/i, ""));
    piece.pdfId = pdfId;
    for (let i = 1; i <= doc.numPages; i++) {
      const p = await doc.getPage(i);
      const info = pageInfo(p);
      piece.pages.push({ id: uid("pg"), src: { kind: "pdf", pdfId, index: i - 1, view: info.view, rotate: info.rotate }, w: info.w, h: info.h, objs: [] });
      if (i === 1) { try { piece.thumb = await makeThumb(p); } catch { piece.thumb = ""; } }
    }
    await dbPutMany([
      { store: "pdfs", value: { id: pdfId, name: file.name, size: buf.length, pageCount: doc.numPages, blob: new Blob([buf], { type: "application/pdf" }) } },
      { store: "pieces", value: piece },
    ]);
    return piece;
  } finally {
    destroyDoc(doc);
  }
}

export async function createBlankPiece(title, pages = 1, orient = "v") {
  const piece = newPiece(title || "Hoja en blanco");
  for (let i = 0; i < pages; i++) piece.pages.push(blankPageOriented(orient));
  await dbPut("pieces", piece);
  return piece;
}

export async function listPieces() {
  const all = await dbAll("pieces");
  return all.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

// PDFs que usa una pieza: el suyo, el de cada hoja y los de recortes pegados desde otras piezas
export function pdfIdsOf(piece) {
  const ids = new Set();
  if (piece.pdfId) ids.add(piece.pdfId);
  for (const pg of piece.pages) {
    const pid = pagePdfId(piece, pg); if (pid) ids.add(pid);
    for (const o of pg.objs) if (o.t === "clip" && o.src?.pdfId) ids.add(o.src.pdfId);
  }
  return [...ids];
}
// Imágenes pegadas que usa una pieza
export function imgIdsOf(piece) {
  const ids = new Set();
  for (const pg of piece.pages) for (const o of pg.objs) if (o.t === "image" && o.imgId) ids.add(o.imgId);
  return [...ids];
}

// Borra la pieza y los PDF e imágenes que ya no use ninguna otra pieza (todo en una transacción)
export async function deletePiece(piece) {
  const others = (await dbAll("pieces")).filter(p => p.id !== piece.id);
  const usedP = new Set(others.flatMap(pdfIdsOf)), usedI = new Set(others.flatMap(imgIdsOf));
  const ops = [{ store: "pieces", del: piece.id }];
  for (const id of pdfIdsOf(piece)) if (!usedP.has(id)) ops.push({ store: "pdfs", del: id });
  for (const id of imgIdsOf(piece)) if (!usedI.has(id)) ops.push({ store: "imgs", del: id });
  await dbTx(ops);
}

export async function duplicatePiece(piece) {
  const copy = JSON.parse(JSON.stringify(piece));
  copy.id = uid("pz");
  copy.title = `${piece.title} (copia)`;
  copy.createdAt = copy.updatedAt = Date.now();
  copy.pages.forEach(pg => { pg.id = uid("pg"); pg.objs.forEach(o => { o.id = uid("o"); }); });
  await dbPut("pieces", copy); // comparte el mismo PDF (no se duplica)
  return copy;
}

/* ---------- Saneado de datos (al restaurar copias) ---------- */
const COLOR_RE = /^#[0-9a-f]{6}$/i;
const color = (c, def) => (typeof c === "string" && COLOR_RE.test(c) ? c : def);
const str = (s, max = 200) => (typeof s === "string" ? s.slice(0, max) : "");
const fretArr = (a) => Array.isArray(a) ? a.map(Number).filter(v => Number.isInteger(v) && v >= -1 && v <= 30).slice(0, 12) : [];

export function sanitizeChordModel(m) {
  m = m || {};
  return {
    name: str(m.name, 16), label: str(m.label, 16),
    traste: clamp(Math.round(num(m.traste, 1)), 1, 24),
    frets: clamp(Math.round(num(m.frets, 5)), 1, 15),
    pos: Array.from({ length: 6 }, (_, i) => fretArr(m.pos?.[i])),
    hollowPos: Array.from({ length: 6 }, (_, i) => fretArr(m.hollowPos?.[i])),
    cejillas: (Array.isArray(m.cejillas) ? m.cejillas : []).slice(0, 8).map(c => ({
      traste: clamp(Math.round(num(c.traste, 1)), 1, 30), desde: clamp(Math.round(num(c.desde, 1)), 1, 6), hasta: clamp(Math.round(num(c.hasta, 6)), 1, 6),
    })),
  };
}

const holesArr = (a) => (Array.isArray(a) ? a : []).slice(0, 300).map(h => ({ x: num(h?.x), y: num(h?.y), w: clamp(num(h?.w), 0, 50000), h: clamp(num(h?.h), 0, 50000) })).filter(h => h.w > 0 && h.h > 0);
export function sanitizeObj(o) {
  const r = sanitizeObj0(o);
  if (r && ["image", "clip", "rect"].includes(r.t)) { const hs = holesArr(o.holes); if (hs.length) r.holes = hs; }
  return r;
}
function sanitizeObj0(o) {
  if (!o || !OBJ_TYPES.includes(o.t)) return null;
  const id = str(o.id, 60) || uid("o");
  const N = (v, d = 0) => clamp(num(v, d), -5000, 5000);
  switch (o.t) {
    case "text": return { id, t: "text", x: N(o.x), y: N(o.y), size: clamp(num(o.size, 12), 3, 200), text: str(o.text, 500), color: color(o.color, "#000000"), font: o.font === "mono" ? "mono" : "sans", bold: o.bold !== false, ...(o.tab ? { tab: 1 } : {}) };
    case "staff": return { id, t: "staff", x: N(o.x), y: N(o.y), w: clamp(num(o.w, 500), 20, 5000), kind: ["tab", "std", "both"].includes(o.kind) ? o.kind : "tab",
      systems: clamp(Math.round(num(o.systems, 1)), 1, 40), measures: clamp(Math.round(num(o.measures, 4)), 0, 16), gap: clamp(num(o.gap, 7), 2, 30), sysGap: clamp(num(o.sysGap, 30), 0, 400),
      clef: o.clef !== false && o.clef !== 0, chordRow: Boolean(o.chordRow), chordH: clamp(num(o.chordH, 78), 10, 300), lw: clamp(num(o.lw, 0.7), 0.2, 4), color: color(o.color, "#000000") };
    case "neck": return { id, t: "neck", x: N(o.x), y: N(o.y), w: clamp(num(o.w, 400), 20, 5000),
      from: clamp(Math.round(num(o.from, 0)), 0, 23), to: clamp(Math.round(num(o.to, 12)), 1, 24), sg: clamp(num(o.sg, 11), 4, 40),
      notes: Boolean(o.notes), names: Boolean(o.names), nums: o.nums !== false, noteStyle: o.noteStyle === "es" ? "es" : "en", title: str(o.title, 60),
      marks: (Array.isArray(o.marks) ? o.marks : []).slice(0, 400).map(m => ({ s: clamp(Math.round(num(m?.s, 1)), 1, 6), f: clamp(Math.round(num(m?.f, 0)), 0, 24), txt: str(m?.txt, 4), fill: ["black", "white", "red", "blue", "green", "gray", "orange"].includes(m?.fill) ? m.fill : "black" })) };
    case "line": return { id, t: "line", x1: N(o.x1), y1: N(o.y1), x2: N(o.x2), y2: N(o.y2), w: clamp(num(o.w, 1), 0.2, 20), color: color(o.color, "#000000"), arrow: o.arrow ? 1 : 0 };
    case "path": {
      const pts = (Array.isArray(o.pts) ? o.pts : []).slice(0, 5000).map(p => [N(p?.[0]), N(p?.[1])]);
      if (!pts.length) return null;
      return { id, t: "path", pts, w: clamp(num(o.w, 1.5), 0.2, 80), color: color(o.color, "#000000"), kind: o.kind === "eraser" ? "eraser" : "pen" };
    }
    case "ellipse": return { id, t: "ellipse", x: N(o.x), y: N(o.y), w: clamp(num(o.w, 10), 0.5, 5000), h: clamp(num(o.h, 10), 0.5, 5000), sw: clamp(num(o.sw, 1.5), 0.2, 20), color: color(o.color, "#000000") };
    case "clip": {
      if (!o.src || typeof o.src.pdfId !== "string") return null;
      return {
        id, t: "clip", x: N(o.x), y: N(o.y), scale: clamp(num(o.scale, 1), 0.05, 20),
        sx: N(o.sx), sy: N(o.sy), sw: clamp(num(o.sw, 10), 1, 5000), sh: clamp(num(o.sh, 10), 1, 5000),
        src: { pdfId: o.src.pdfId.slice(0, 60), index: clamp(Math.round(num(o.src.index, 0)), 0, 100000), view: (Array.isArray(o.src.view) ? o.src.view : [0, 0, A4.w, A4.h]).slice(0, 4).map(v => num(v)), rotate: [0, 90, 180, 270].includes(num(o.src.rotate)) ? num(o.src.rotate) : 0 },
      };
    }
    case "image": {
      if (typeof o.imgId !== "string") return null;
      const nw = clamp(num(o.nw, 1), 1, 20000), nh = clamp(num(o.nh, 1), 1, 20000);
      return { id, t: "image", imgId: o.imgId.slice(0, 60), x: N(o.x), y: N(o.y), w: clamp(num(o.w, 50), 0.5, 5000), h: clamp(num(o.h, 50), 0.5, 5000),
        nw, nh, cx: clamp(num(o.cx, 0), 0, nw), cy: clamp(num(o.cy, 0), 0, nh), cw: clamp(num(o.cw, nw), 0.5, nw), ch: clamp(num(o.ch, nh), 0.5, nh) };
    }
    case "rect": return { id, t: "rect", x: N(o.x), y: N(o.y), w: clamp(num(o.w, 10), 0.5, 5000), h: clamp(num(o.h, 10), 0.5, 5000), fill: color(o.fill, "#ffffff") };
    case "chord": return { id, t: "chord", x: N(o.x), y: N(o.y), size: clamp(num(o.size, 55), 10, 600), model: sanitizeChordModel(o.model) };
    case "finger": return { id, t: "finger", x: N(o.x), y: N(o.y), size: clamp(num(o.size, 14), 4, 200), n: clamp(Math.round(num(o.n, 1)), 0, 9) };
    case "loop": return { id, t: "loop", x: N(o.x), y: N(o.y), size: clamp(num(o.size, 30), 8, 300), text: str(o.text, 12) || "L1", url: str(o.url, 2000) };
  }
  return null;
}

export function sanitizePiece(p) {
  if (!p || typeof p !== "object" || typeof p.id !== "string") return null;
  const pages = (Array.isArray(p.pages) ? p.pages : []).slice(0, 2000).map(pg => {
    const src = pg?.src?.kind === "pdf"
      ? { kind: "pdf", ...(typeof pg.src.pdfId === "string" ? { pdfId: pg.src.pdfId.slice(0, 60) } : {}), index: clamp(Math.round(num(pg.src.index, 0)), 0, 100000), view: (Array.isArray(pg.src.view) ? pg.src.view : [0, 0, A4.w, A4.h]).slice(0, 4).map(v => num(v)), rotate: [0, 90, 180, 270].includes(num(pg.src.rotate)) ? num(pg.src.rotate) : 0 }
      : { kind: "blank" };
    return {
      id: str(pg?.id, 60) || uid("pg"), src,
      w: clamp(num(pg?.w, A4.w), 20, 5000), h: clamp(num(pg?.h, A4.h), 20, 5000),
      objs: (Array.isArray(pg?.objs) ? pg.objs : []).slice(0, 5000).map(sanitizeObj).filter(Boolean),
      ...(holesArr(pg?.holes).length ? { holes: holesArr(pg.holes) } : {}),
    };
  });
  return {
    id: str(p.id, 60), title: str(p.title, 200) || "Sin título",
    tags: (Array.isArray(p.tags) ? p.tags : []).map(t => str(t, 40)).filter(Boolean).slice(0, 30),
    favorite: Boolean(p.favorite), createdAt: num(p.createdAt, Date.now()), updatedAt: num(p.updatedAt, Date.now()),
    pdfId: typeof p.pdfId === "string" ? p.pdfId.slice(0, 60) : null,
    thumb: typeof p.thumb === "string" && /^data:image\/(jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(p.thumb) && p.thumb.length < 400000 ? p.thumb : "",
    videoUrl: str(p.videoUrl, 2000), pages, practice: {}, schema: 1,
  };
}

export async function getPiece(id) { return dbGet("pieces", id); }
