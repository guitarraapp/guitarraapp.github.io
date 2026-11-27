// Exportar una pieza a PDF vectorial con pdf-lib (incluido en local)
import { getPdfBytes } from "./pdfjs.js";
import { renderObj, pathD, arrowHead, objBox, holeToPage } from "./objects.js";
import { clipUrl } from "./clips.js";
import { ED, chordHeight, chordTop, fretNumSize, FRET_NUM_GAP } from "./chords.js";
import { downloadBlob, safeFileName, normalizeUrl, isHttpUrl } from "./util.js";
import { pagePdfId } from "./model.js";
import { imageRecord } from "./images.js";
import { staffPrims, neckPrims, textWidthEstimate } from "./vector.js";

// Pinta las primitivas de pautas y mástiles (las mismas que se ven en pantalla)
function drawPrims(page, P, H, F, rgb, LineCapStyle) {
  const fontOf = (p) => (p.font === "mono" ? (p.bold ? F.monoB : F.mono) : (p.bold ? F.sansB : F.sans));
  for (const p of P) {
    switch (p.k) {
      case "line": page.drawLine({ start: { x: p.x1, y: H - p.y1 }, end: { x: p.x2, y: H - p.y2 }, thickness: p.w, color: hexToRgb(p.color, rgb) }); break;
      case "circle": page.drawCircle({ x: p.cx, y: H - p.cy, size: p.r, ...(p.fill ? { color: hexToRgb(p.fill, rgb) } : {}), ...(p.stroke ? { borderColor: hexToRgb(p.stroke, rgb), borderWidth: p.sw } : {}) }); break;
      case "rect": page.drawRectangle({ x: p.x, y: H - (p.y + p.h), width: p.w, height: p.h, ...(p.fill ? { color: hexToRgb(p.fill, rgb) } : {}) }); break;
      case "path": page.drawSvgPath(p.d, { x: p.tx, y: H - p.ty, scale: p.sc, borderColor: hexToRgb(p.color, rgb), borderWidth: p.w / p.sc, borderLineCap: LineCapStyle.Round }); break;
      case "text": {
        const font = fontOf(p), t = String(p.text);
        if (!canEncode(font, t)) break;
        if (p.bg) { const w = textWidthEstimate(t, p.size) + 2; page.drawRectangle({ x: p.x - w / 2, y: H - (p.y + p.size * 0.55), width: w, height: p.size * 1.1, color: hexToRgb(p.bg, rgb) }); }
        const tw = font.widthOfTextAtSize(t, p.size);
        const x = p.anchor === "middle" ? p.x - tw / 2 : p.anchor === "end" ? p.x - tw : p.x;
        const y = p.base === "central" ? H - p.y - p.size * 0.35 : H - p.y;
        page.drawText(t, { x, y, size: p.size, font, color: hexToRgb(p.color, rgb) });
        break;
      }
    }
  }
}

function hexToRgb(hex, rgb) {
  const m = /^#([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return rgb(0, 0, 0);
  const n = parseInt(m[1], 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}
function canEncode(font, txt) { try { font.encodeText(txt); return true; } catch { return false; } }

// Dibuja un objeto como imagen (para textos con símbolos que las fuentes PDF estándar no tienen)
async function rasterObject(out, page, H, o) {
  // se dibuja en un SVG oculto para medirlo y convertirlo en imagen
  const host = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  host.setAttribute("style", "position:absolute;left:-9999px;top:0;width:10px;height:10px;overflow:visible");
  const gEl = renderObj(o);
  host.append(gEl); document.body.append(host);
  let b;
  try { b = gEl.getBBox(); } finally { host.remove(); }
  if (!b || (!b.width && !b.height)) return false;
  const pad = 2;
  const x = b.x - pad, y = b.y - pad, w = b.width + pad * 2, h = b.height + pad * 2;
  const scale = 6;
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(w * scale)}" height="${Math.ceil(h * scale)}" viewBox="${x} ${y} ${w} ${h}">${new XMLSerializer().serializeToString(gEl)}</svg>`;
  const url = URL.createObjectURL(new Blob([s], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const c = document.createElement("canvas");
    c.width = Math.ceil(w * scale); c.height = Math.ceil(h * scale);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    const png = await out.embedPng(await (await fetch(c.toDataURL("image/png"))).arrayBuffer());
    page.drawImage(png, { x, y: H - (y + h), width: w, height: h });
    return true;
  } finally { URL.revokeObjectURL(url); }
}

function drawChord(page, o, H, F, rgb) {
  const m = o.model, k = o.size / ED.W, TOP = chordTop(m);
  const X = lx => o.x + lx * k, Y = ly => H - (o.y + ly * k);
  const black = rgb(0, 0, 0), white = rgb(1, 1, 1);
  const hh = chordHeight(m);
  page.drawRectangle({ x: X(0), y: Y(hh), width: ED.W * k, height: hh * k, color: white });
  const text = (t, cx, cy, size, font, anchor = "middle") => {
    const tw = font.widthOfTextAtSize(t, size);
    const x = anchor === "middle" ? cx - tw / 2 : anchor === "end" ? cx - tw : cx;
    page.drawText(t, { x, y: cy, size, font, color: black });
  };
  if (m.name) text(m.name, X((ED.left + ED.right) / 2), Y(15), 14 * k, F.monoB);
  const bottom = TOP + m.frets * ED.fGap;
  for (let i = 0; i < 6; i++) {
    const x = ED.left + i * ED.sGap;
    page.drawLine({ start: { x: X(x), y: Y(TOP) }, end: { x: X(x), y: Y(bottom) }, thickness: k, color: black });
  }
  for (let i = 0; i <= m.frets; i++) {
    const y = TOP + i * ED.fGap;
    page.drawLine({ start: { x: X(ED.left), y: Y(y) }, end: { x: X(ED.right), y: Y(y) }, thickness: (i === 0 && m.traste === 1 ? 3 : 1) * k, color: black });
  }
  if (m.traste > 1) { const fs = fretNumSize(m.traste) * k; text(String(m.traste), X(ED.left - FRET_NUM_GAP), Y(TOP + ED.fGap * 0.5) - fs * 0.35, fs, F.monoB, "end"); }
  for (const cj of m.cejillas) {
    const rel = cj.traste - m.traste;
    if (rel < 0 || rel >= m.frets) continue;
    const yc = TOP + (rel + 0.5) * ED.fGap;
    const a = Math.min(cj.desde, cj.hasta) - 1, b = Math.max(cj.desde, cj.hasta) - 1;
    const x1 = ED.left + a * ED.sGap, x2 = ED.left + b * ED.sGap;
    // barra con extremos redondeados
    page.drawRectangle({ x: X(x1), y: Y(yc + 5), width: (x2 - x1) * k, height: 10 * k, color: black });
    page.drawCircle({ x: X(x1), y: Y(yc), size: 5 * k, color: black });
    page.drawCircle({ x: X(x2), y: Y(yc), size: 5 * k, color: black });
  }
  for (let i = 0; i < 6; i++) {
    const x = ED.left + i * ED.sGap;
    const arr = m.pos[i] || [];
    if (arr.includes(-1)) text("X", X(x), Y(TOP - 4), 11 * k, F.mono);
    else if (arr.includes(0)) page.drawCircle({ x: X(x), y: Y(TOP - 8), size: 3.5 * k, borderColor: black, borderWidth: k });
    const dot = (fret, hollow) => {
      if (fret <= 0) return;
      if (m.cejillas.some(cj => cj.traste === fret && i + 1 >= Math.min(cj.desde, cj.hasta) && i + 1 <= Math.max(cj.desde, cj.hasta))) return;
      const rel = fret - m.traste;
      if (rel < 0 || rel >= m.frets) return;
      const cy = TOP + (rel + 0.5) * ED.fGap;
      page.drawCircle({ x: X(x), y: Y(cy), size: 5 * k, color: hollow ? white : black, borderColor: black, borderWidth: hollow ? 1.6 * k : 0 });
    };
    arr.forEach(f => dot(f, false));
    (m.hollowPos[i] || []).forEach(f => dot(f, true));
  }
  if (m.label) text(m.label, X((ED.left + ED.right) / 2), Y(bottom + 20), 13 * k, F.mono);
}

function textsOf(o) {
  if (o.t === "text") return [o.text];
  if (o.t === "loop") return [o.text];
  if (o.t === "finger") return [String(o.n)];
  if (o.t === "chord") return [o.model.name, o.model.label, String(o.model.traste)];
  if (o.t === "neck") return [o.title, ...(o.marks || []).map(m => m.txt)];
  return [];
}

// opts.pages: solo esas hojas (por defecto todas) · opts.fileName · opts.download=false devuelve los bytes
export async function exportPiecePdf(piece, opts = {}) {
  const { PDFDocument, PDFName, PDFString, StandardFonts, rgb, degrees, LineCapStyle, pushGraphicsState, popGraphicsState, rectangle, clip, clipEvenOdd, endPath } = window.PDFLib;
  const pages = opts.pages || piece.pages;
  const out = await PDFDocument.create();
  out.setTitle(piece.title);
  out.setProducer("Partituras");
  const F = {
    sansB: await out.embedFont(StandardFonts.HelveticaBold),
    sans: await out.embedFont(StandardFonts.Helvetica),
    monoB: await out.embedFont(StandardFonts.CourierBold),
    mono: await out.embedFont(StandardFonts.Courier),
  };
  const srcs = new Map(); // pdfId -> PDFDocument de pdf-lib (se cargan cuando hacen falta)
  const getSrc = async (pdfId) => {
    if (!srcs.has(pdfId)) srcs.set(pdfId, PDFDocument.load(await getPdfBytes(pdfId), { ignoreEncryption: true }));
    return srcs.get(pdfId);
  };
  const embedCache = new Map();
  const imgCache = new Map(); // imgId -> imagen incrustada
  const getImg = async (imgId) => {
    if (!imgCache.has(imgId)) imgCache.set(imgId, (async () => {
      const rec = await imageRecord(imgId);
      if (!rec) return null;
      let bytes = new Uint8Array(await rec.blob.arrayBuffer());
      if (rec.blob.type === "image/jpeg") return out.embedJpg(bytes);
      if (rec.blob.type !== "image/png") { // otros formatos: se pasan a PNG
        const bmp = await createImageBitmap(rec.blob); const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
        c.getContext("2d").drawImage(bmp, 0, 0); bytes = new Uint8Array(await (await new Promise(r => c.toBlob(r, "image/png"))).arrayBuffer());
      }
      return out.embedPng(bytes);
    })());
    return imgCache.get(imgId);
  };
  let rasterObjs = 0;

  for (const pg of pages) {
    const page = out.addPage([pg.w, pg.h]);
    const H = pg.h;
    const pid = pagePdfId(piece, pg);
    if (pid) {
      const src = await getSrc(pid);
      const ek = `${pid}:${pg.src.index}`;
      let emb = embedCache.get(ek);
      if (!emb) {
        const sp = src.getPage(pg.src.index);
        const [x1, y1, x2, y2] = pg.src.view;
        emb = await out.embedPage(sp, { left: x1, bottom: y1, right: x2, top: y2 });
        embedCache.set(ek, emb);
      }
      const bw = emb.width, bh = emb.height, r = pg.src.rotate || 0;
      const pos = r === 90 ? { x: 0, y: bw } : r === 180 ? { x: bw, y: bh } : r === 270 ? { x: bh, y: 0 } : { x: 0, y: 0 };
      page.drawPage(emb, { x: pos.x, y: pos.y, width: bw, height: bh, rotate: degrees(-r) });
      // trozos cortados del fondo
      for (const h of pg.holes || []) page.drawRectangle({ x: h.x, y: H - (h.y + h.h), width: h.w, height: h.h, color: rgb(1, 1, 1) });
    }

    const annots = [];
    for (const o of pg.objs) {
      const fontFor = o.t === "text" ? (o.font === "mono" ? (o.bold ? F.monoB : F.mono) : (o.bold ? F.sansB : F.sans)) : F.monoB;
      if (!textsOf(o).every(t => !t || canEncode(fontFor, t) && canEncode(F.mono, t))) {
        if (await rasterObject(out, page, H, o)) { rasterObjs++; }
        continue;
      }
      // huecos: solo se dibuja la caja del objeto menos lo cortado
      const holed = o.holes?.length && ["rect", "clip", "image"].includes(o.t);
      if (holed) {
        const b = objBox(o);
        const ops = [pushGraphicsState(), rectangle(b.x, H - (b.y + b.h), b.w, b.h)];
        for (const h0 of o.holes) { const h = holeToPage(o, h0); ops.push(rectangle(h.x, H - (h.y + h.h), h.w, h.h)); }
        page.pushOperators(...ops, clipEvenOdd(), endPath());
      }
      switch (o.t) {
        case "rect":
          page.drawRectangle({ x: o.x, y: H - (o.y + o.h), width: o.w, height: o.h, color: hexToRgb(o.fill, rgb) });
          break;
        case "line": {
          const col = hexToRgb(o.color, rgb);
          if (o.arrow) {
            const h = arrowHead(o);
            page.drawLine({ start: { x: o.x1, y: H - o.y1 }, end: { x: h.base[0], y: H - h.base[1] }, thickness: o.w, color: col });
            page.drawSvgPath(`M${h.tip[0]} ${h.tip[1]} L${h.a[0]} ${h.a[1]} L${h.b[0]} ${h.b[1]} Z`, { x: 0, y: H, color: col });
          } else {
            page.drawLine({ start: { x: o.x1, y: H - o.y1 }, end: { x: o.x2, y: H - o.y2 }, thickness: o.w, color: col, lineCap: LineCapStyle.Round });
          }
          break;
        }
        case "path":
          page.drawSvgPath(pathD(o.pts), { x: 0, y: H, borderColor: hexToRgb(o.color, rgb), borderWidth: o.w, borderLineCap: LineCapStyle.Round });
          break;
        case "ellipse":
          page.drawEllipse({ x: o.x + o.w / 2, y: H - (o.y + o.h / 2), xScale: o.w / 2, yScale: o.h / 2, borderColor: hexToRgb(o.color, rgb), borderWidth: o.sw });
          break;
        case "clip": {
          const w = o.sw * o.scale, h = o.sh * o.scale;
          if ((o.src.rotate || 0) === 0) {
            const src = await getSrc(o.src.pdfId);
            const [vx1, , , vy2] = o.src.view;
            const emb = await out.embedPage(src.getPage(o.src.index), { left: vx1 + o.sx, right: vx1 + o.sx + o.sw, top: vy2 - o.sy, bottom: vy2 - o.sy - o.sh });
            page.drawRectangle({ x: o.x, y: H - (o.y + h), width: w, height: h, color: rgb(1, 1, 1) });
            page.drawPage(emb, { x: o.x, y: H - (o.y + h), width: w, height: h });
          } else {
            // páginas giradas: el recorte va como imagen de alta resolución
            const url = await clipUrl(o);
            const png = await out.embedPng(await (await fetch(url)).arrayBuffer());
            page.drawImage(png, { x: o.x, y: H - (o.y + h), width: w, height: h });
            rasterObjs++;
          }
          break;
        }
        case "image": {
          const im = await getImg(o.imgId);
          if (!im) break;
          // se dibuja la imagen completa escalada y se recorta con un trazado (solo se ve el recorte)
          const sx = o.w / o.cw, sy = o.h / o.ch;
          const fullW = o.nw * sx, fullH = o.nh * sy;
          const x0 = o.x - o.cx * sx, yTop = o.y - o.cy * sy;
          page.pushOperators(pushGraphicsState(), rectangle(o.x, H - (o.y + o.h), o.w, o.h), clip(), endPath());
          page.drawImage(im, { x: x0, y: H - (yTop + fullH), width: fullW, height: fullH });
          page.pushOperators(popGraphicsState());
          break;
        }
        case "text":
          if (!o.text) break;
          if (o.tab) { // número de traste centrado sobre la línea, con fondo blanco
            const w = textWidthEstimate(o.text, o.size) + 2, tw = fontFor.widthOfTextAtSize(o.text, o.size);
            page.drawRectangle({ x: o.x - w / 2, y: H - (o.y + o.size * 0.5), width: w, height: o.size, color: rgb(1, 1, 1) });
            page.drawText(o.text, { x: o.x - tw / 2, y: H - o.y - o.size * 0.35, size: o.size, font: fontFor, color: hexToRgb(o.color, rgb) });
          } else page.drawText(o.text, { x: o.x, y: H - o.y, size: o.size, font: fontFor, color: hexToRgb(o.color, rgb) });
          break;
        case "staff": drawPrims(page, staffPrims(o), H, F, rgb, LineCapStyle); break;
        case "neck": drawPrims(page, neckPrims(o), H, F, rgb, LineCapStyle); break;
        case "finger": {
          const k = o.size / 100, cx = o.x + 50 * k, cy = H - (o.y + 50 * k);
          page.drawCircle({ x: cx, y: cy, size: 45 * k, color: rgb(1, 1, 1), borderColor: rgb(0, 0, 0), borderWidth: 6 * k });
          const fs = 62 * k, t = String(o.n);
          page.drawText(t, { x: cx - F.monoB.widthOfTextAtSize(t, fs) / 2, y: cy - fs * 0.33, size: fs, font: F.monoB, color: rgb(0, 0, 0) });
          break;
        }
        case "loop": {
          const k = o.size / 100, col = rgb(0.047, 0.4, 0.329);
          page.drawRectangle({ x: o.x + 2 * k, y: H - (o.y + 58 * k), width: 96 * k, height: 56 * k, color: rgb(1, 1, 1), borderColor: col, borderWidth: 4 * k });
          const fs = (o.text.length > 4 ? 26 : 34) * k;
          page.drawText(o.text, { x: o.x + 50 * k - F.monoB.widthOfTextAtSize(o.text, fs) / 2, y: H - (o.y + 29 * k) - fs * 0.33, size: fs, font: F.monoB, color: col });
          page.drawLine({ start: { x: o.x + 16 * k, y: H - (o.y + 47 * k) }, end: { x: o.x + 84 * k, y: H - (o.y + 47 * k) }, thickness: 3 * k, color: col });
          break;
        }
        case "chord":
          drawChord(page, o, H, F, rgb);
          break;
      }
      if (holed) page.pushOperators(popGraphicsState());
      if (o.t === "loop") {
        const url = normalizeUrl(o.url || piece.videoUrl);
        if (isHttpUrl(url)) {
          const k = o.size / 100;
          annots.push(out.context.register(out.context.obj({
            Type: "Annot", Subtype: "Link", Border: [0, 0, 0],
            Rect: [o.x, H - (o.y + 60 * k), o.x + 100 * k, H - o.y],
            A: { Type: "Action", S: "URI", URI: PDFString.of(url) },
          })));
        }
      }
    }
    if (annots.length) page.node.set(PDFName.of("Annots"), out.context.obj(annots));
  }

  const bytes = await out.save();
  if (opts.download === false) return { bytes, pages: pages.length, rasterObjs };
  downloadBlob(new Blob([bytes], { type: "application/pdf" }), `${safeFileName(opts.fileName || piece.title)}.pdf`);
  return { pages: pages.length, rasterObjs };
}
