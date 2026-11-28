// Dibujo y geometría de los objetos de página (en puntos)
import { svg } from "./util.js";
import { buildChordContent, chordHeight, ED } from "./chords.js";
import { staffPrims, staffLayout, neckPrims, neckLayout, primsToSvg, textWidthEstimate } from "./vector.js";

export const FONT_SANS = "Helvetica, Arial, sans-serif";
export const FONT_MONO = "Courier New, Courier, monospace";

// Las imágenes de los recortes las proporciona clips.js (asíncrono)
let clipResolver = null, imageResolver = null;
export function setClipResolver(fn) { clipResolver = fn; }
export function setImageResolver(fn) { imageResolver = fn; }

export function pathD(pts) {
  if (!pts.length) return "";
  if (pts.length === 1) return `M${pts[0][0]} ${pts[0][1]} L${pts[0][0] + 0.01} ${pts[0][1]}`;
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  // curva suave pasando por puntos medios
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = pts[i], [nx, ny] = pts[i + 1];
    d += ` Q${x} ${y} ${(x + nx) / 2} ${(y + ny) / 2}`;
  }
  const last = pts[pts.length - 1];
  d += ` L${last[0]} ${last[1]}`;
  return d;
}

export function arrowHead(o) {
  const ang = Math.atan2(o.y2 - o.y1, o.x2 - o.x1);
  const len = Math.max(6, o.w * 4.5), half = Math.max(3, o.w * 2.2);
  const bx = o.x2 - Math.cos(ang) * len, by = o.y2 - Math.sin(ang) * len;
  const px = -Math.sin(ang) * half, py = Math.cos(ang) * half;
  return { tip: [o.x2, o.y2], a: [bx + px, by + py], b: [bx - px, by - py], base: [bx, by] };
}

/* ---------- Huecos (lo que se ha cortado de un fondo, imagen, recorte o tapado) ----------
   Cada objeto guarda sus huecos en SUS coordenadas, así se mueven y escalan con él:
   imagen → píxeles de la imagen · recorte → puntos del PDF de origen · tapado → puntos desde su esquina. */
export const HOLED = ["image", "clip", "rect"];
// El resto de elementos (pauta, mástil, acorde, texto, trazos…) también se pueden partir con «Zona»:
// guardan un recorte visible (crop) y huecos en coordenadas de la hoja, que se desplazan al moverlos.
export const isVcut = (o) => !HOLED.includes(o.t);
export function holeToPage(o, h) {
  if (isVcut(o)) return { ...h };
  if (o.t === "image") { const fx = o.w / o.cw, fy = o.h / o.ch; return { x: o.x + (h.x - o.cx) * fx, y: o.y + (h.y - o.cy) * fy, w: h.w * fx, h: h.h * fy }; }
  if (o.t === "clip") { const k = o.scale; return { x: o.x + (h.x - o.sx) * k, y: o.y + (h.y - o.sy) * k, w: h.w * k, h: h.h * k }; }
  return { x: o.x + h.x, y: o.y + h.y, w: h.w, h: h.h };
}
export function pageToHole(o, b) {
  if (isVcut(o)) return { ...b };
  if (o.t === "image") { const fx = o.cw / o.w, fy = o.ch / o.h; return { x: o.cx + (b.x - o.x) * fx, y: o.cy + (b.y - o.y) * fy, w: b.w * fx, h: b.h * fy }; }
  if (o.t === "clip") { const k = o.scale; return { x: o.sx + (b.x - o.x) / k, y: o.sy + (b.y - o.y) / k, w: b.w / k, h: b.h / k }; }
  return { x: b.x - o.x, y: b.y - o.y, w: b.w, h: b.h };
}
let cpSeq = 0;
const rp = (b) => `M${b.x} ${b.y}h${b.w}v${b.h}h${-b.w}Z`;
// Solo se ve (y solo se puede tocar) la caja del objeto menos sus huecos
function visibleClip(g, o) {
  const box = isVcut(o) ? (o.crop || inflate(naturalBox(o), Math.max(8, o.size || 0))) : objBox(o);
  const holes = (o.holes || []).map(h => holeToPage(o, h));
  const id = `cp${++cpSeq}`;
  const cp = svg("clipPath", { id });
  cp.append(svg("path", { d: rp(box) + holes.map(rp).join(""), "clip-rule": "evenodd" }));
  g.append(cp);
  g.setAttribute("clip-path", `url(#${id})`);
}

const inflate = (b, d) => ({ x: b.x - d, y: b.y - d, w: b.w + 2 * d, h: b.h + 2 * d });
export function renderObj(o) {
  const g = renderObj0(o);
  if (isVcut(o) && (o.crop || o.holes?.length)) visibleClip(g, o);
  return g;
}
function renderObj0(o) {
  const g = svg("g", { class: `obj obj-${o.t}`, "data-oid": o.id });
  switch (o.t) {
    case "text": {
      // número de traste en tablatura: centrado en la línea y con fondo blanco que corta la línea
      if (o.tab) { const w = textWidthEstimate(o.text || " ", o.size) + 2; g.append(svg("rect", { x: o.x - w / 2, y: o.y - o.size * 0.5, width: w, height: o.size, fill: "#fff" })); }
      const t = svg("text", {
        x: o.x, y: o.y, "font-size": o.size, fill: o.color,
        "font-family": o.font === "mono" ? FONT_MONO : FONT_SANS, "font-weight": o.bold ? "bold" : "normal",
        "xml:space": "preserve", ...(o.tab ? { "text-anchor": "middle", "dominant-baseline": "central" } : {}),
      });
      t.textContent = o.text || " ";
      g.append(t);
      break;
    }
    case "meas": { // fila de compases: solo se ve con la herramienta «Compases» o la práctica abierta
      g.append(svg("rect", { class: "meas-body", x: o.x, y: o.y, width: o.w, height: o.h }));
      const xs = [o.x, ...o.cuts.map(f => o.x + f * o.w), o.x + o.w];
      xs.forEach((x, k) => {
        if (k > 0 && k < xs.length - 1) g.append(svg("line", { class: "meas-line", x1: x, y1: o.y, x2: x, y2: o.y + o.h }));
        g.append(svg("rect", { class: "meas-sep", "data-sep": k, x: x - 4, y: o.y, width: 8, height: o.h })); // tirador
      });
      for (let i = 0; i < xs.length - 1; i++) {
        const t = svg("text", { class: "mnum", x: xs[i] + 2, y: o.y + 9, "data-i": i });
        if (o.ch?.[i]) { const c = o.ch[i]; const t2 = svg("text", { class: "mchange", x: xs[i] + 2, y: o.y + o.h - 3 }); t2.textContent = [c.ts, c.bpm ? `♩=${c.bpm}` : ""].filter(Boolean).join(" "); g.append(t2); }
        g.append(t);
      }
      return g;
    }
    case "staff": case "neck": {
      const P = o.t === "staff" ? staffPrims(o) : neckPrims(o);
      const b = objBox(o);
      g.append(svg("rect", { x: b.x, y: b.y, width: b.w, height: b.h, fill: "transparent" })); // para poder tocarla entre líneas
      g.append(primsToSvg(P));
      break;
    }
    case "line": {
      const end = o.arrow ? arrowHead(o).base : [o.x2, o.y2];
      g.append(svg("line", { x1: o.x1, y1: o.y1, x2: o.x2, y2: o.y2, stroke: "transparent", "stroke-width": Math.max(8, o.w + 6), class: "hit" }));
      g.append(svg("line", { x1: o.x1, y1: o.y1, x2: end[0], y2: end[1], stroke: o.color, "stroke-width": o.w, "stroke-linecap": o.arrow ? "butt" : "round" }));
      if (o.arrow) {
        const h = arrowHead(o);
        g.append(svg("polygon", { points: `${h.tip.join(",")} ${h.a.join(",")} ${h.b.join(",")}`, fill: o.color }));
      }
      break;
    }
    case "path": {
      const d = pathD(o.pts);
      g.append(svg("path", { d, fill: "none", stroke: "transparent", "stroke-width": Math.max(8, o.w + 6), class: "hit", "stroke-linecap": "round", "stroke-linejoin": "round" }));
      g.append(svg("path", { d, fill: "none", stroke: o.color, "stroke-width": o.w, "stroke-linecap": "round", "stroke-linejoin": "round" }));
      break;
    }
    case "ellipse":
      g.append(svg("ellipse", { cx: o.x + o.w / 2, cy: o.y + o.h / 2, rx: o.w / 2, ry: o.h / 2, fill: "none", stroke: "transparent", "stroke-width": Math.max(8, o.sw + 6), class: "hit" }));
      g.append(svg("ellipse", { cx: o.x + o.w / 2, cy: o.y + o.h / 2, rx: o.w / 2, ry: o.h / 2, fill: "none", stroke: o.color, "stroke-width": o.sw }));
      break;
    case "rect":
      g.append(svg("rect", { x: o.x, y: o.y, width: o.w, height: o.h, fill: o.fill }));
      if (o.holes?.length) visibleClip(g, o);
      break;
    case "clip": {
      const w = o.sw * o.scale, h = o.sh * o.scale;
      g.append(svg("rect", { x: o.x, y: o.y, width: w, height: h, fill: "#fff" }));
      const img = svg("image", { x: o.x, y: o.y, width: w, height: h, preserveAspectRatio: "none" });
      g.append(img);
      if (clipResolver) clipResolver(o).then(url => { if (url) img.setAttribute("href", url); }).catch(() => {});
      if (o.holes?.length) visibleClip(g, o);
      break;
    }
    case "image": {
      // la imagen completa dentro de un «marco» que solo deja ver el recorte (cx, cy, cw, ch en píxeles de la imagen)
      const box = svg("svg", { x: o.x, y: o.y, width: o.w, height: o.h, viewBox: `${o.cx} ${o.cy} ${o.cw} ${o.ch}`, preserveAspectRatio: "none", overflow: "hidden" });
      const img = svg("image", { x: 0, y: 0, width: o.nw, height: o.nh, preserveAspectRatio: "none" });
      box.append(img);
      g.append(svg("rect", { x: o.x, y: o.y, width: o.w, height: o.h, fill: "transparent" }), box);
      // la imagen completa queda fuera del marco: sin esto, al tocar cualquier punto de la hoja
      // donde «estaría» la imagen entera se seleccionaba este trozo (fallo de la 11.2)
      visibleClip(g, o);
      if (imageResolver) imageResolver(o.imgId).then(url => { if (url) img.setAttribute("href", url); }).catch(() => {
        g.append(svg("rect", { x: o.x, y: o.y, width: o.w, height: o.h, fill: "#fdecea", stroke: "#a33b35", "stroke-width": 1 }));
      });
      break;
    }
    case "chord": {
      const inner = buildChordContent(o.model);
      inner.setAttribute("transform", `translate(${o.x},${o.y}) scale(${o.size / ED.W})`);
      g.append(inner);
      break;
    }
    case "finger": {
      const k = o.size / 100;
      const inner = svg("g", { transform: `translate(${o.x},${o.y}) scale(${k})` });
      inner.append(svg("circle", { cx: 50, cy: 50, r: 45, fill: "#fff", stroke: "#000", "stroke-width": 6 }));
      const t = svg("text", { x: 50, y: 52, "text-anchor": "middle", "dominant-baseline": "central", "font-family": FONT_MONO, "font-weight": "bold", "font-size": 62, fill: "#000" });
      t.textContent = String(o.n);
      inner.append(t);
      g.append(inner);
      break;
    }
    case "loop": {
      const k = o.size / 100;
      const inner = svg("g", { transform: `translate(${o.x},${o.y}) scale(${k})` });
      const col = "#0c6654";
      inner.append(svg("rect", { x: 2, y: 2, width: 96, height: 56, rx: 10, fill: "#fff", stroke: col, "stroke-width": 4 }));
      const t = svg("text", { x: 50, y: 29, "text-anchor": "middle", "dominant-baseline": "central", "font-family": FONT_MONO, "font-weight": "bold", "font-size": o.text.length > 4 ? 26 : 34, fill: col });
      t.textContent = o.text;
      inner.append(t);
      inner.append(svg("line", { x1: 16, y1: 47, x2: 84, y2: 47, stroke: col, "stroke-width": 3, "stroke-linecap": "round" }));
      g.append(inner);
      break;
    }
  }
  return g;
}

// Caja del objeto (en puntos de página)
export function objBox(o, gEl) {
  if (o.crop && isVcut(o)) return { ...o.crop }; // trozo de un elemento: su caja es lo que se ve
  return naturalBox(o, gEl);
}
export function naturalBox(o, gEl) {
  switch (o.t) {
    case "rect": case "ellipse": case "image": return { x: o.x, y: o.y, w: o.w, h: o.h };
    case "clip": return { x: o.x, y: o.y, w: o.sw * o.scale, h: o.sh * o.scale };
    case "line": {
      const pad = o.arrow ? o.w * 2.5 : 0;
      return { x: Math.min(o.x1, o.x2) - pad, y: Math.min(o.y1, o.y2) - pad, w: Math.abs(o.x2 - o.x1) + pad * 2, h: Math.abs(o.y2 - o.y1) + pad * 2 };
    }
    case "path": {
      const xs = o.pts.map(p => p[0]), ys = o.pts.map(p => p[1]), r = o.w / 2;
      const x = Math.min(...xs) - r, y = Math.min(...ys) - r;
      return { x, y, w: Math.max(...xs) + r - x, h: Math.max(...ys) + r - y };
    }
    case "chord": return { x: o.x, y: o.y, w: o.size, h: chordHeight(o.model) * o.size / ED.W };
    case "finger": return { x: o.x, y: o.y, w: o.size, h: o.size };
    case "loop": return { x: o.x, y: o.y, w: o.size, h: o.size * 0.6 };
    case "staff": return { x: o.x, y: o.y, w: o.w, h: staffLayout(o).height };
    case "meas": return { x: o.x, y: o.y, w: o.w, h: o.h };
    case "neck": return { x: o.x, y: o.y, w: o.w, h: neckLayout(o).height };
    case "text": {
      if (gEl) { try { const b = gEl.querySelector("text").getBBox(); if (b.width || b.height) return { x: b.x, y: b.y, w: b.width, h: b.height }; } catch { /* sin DOM */ } }
      const w = (o.text || " ").length * o.size * 0.6;
      if (o.tab) return { x: o.x - w / 2 - 1, y: o.y - o.size / 2, w: w + 2, h: o.size };
      return { x: o.x, y: o.y - o.size * 0.8, w, h: o.size };
    }
  }
  return { x: 0, y: 0, w: 0, h: 0 };
}

export function moveObj(o, dx, dy) {
  if (isVcut(o)) { // recorte y huecos van en coordenadas de hoja
    if (o.crop) o.crop = { ...o.crop, x: o.crop.x + dx, y: o.crop.y + dy };
    if (o.holes) o.holes = o.holes.map(h => ({ ...h, x: h.x + dx, y: h.y + dy }));
  }
  if (o.t === "line") { o.x1 += dx; o.x2 += dx; o.y1 += dy; o.y2 += dy; }
  else if (o.t === "path") { o.pts = o.pts.map(([x, y]) => [Math.round((x + dx) * 100) / 100, Math.round((y + dy) * 100) / 100]); }
  else { o.x += dx; o.y += dy; }
}

// Redimensionar arrastrando la esquina inferior derecha (o el extremo final en líneas)
export function resizeObj(o, orig, dx, dy, box0) {
  switch (o.t) {
    case "rect": case "ellipse": o.w = Math.max(1, orig.w + dx); o.h = Math.max(1, orig.h + dy); break;
    case "image": { // mantiene la proporción
      const f = Math.max(0.03, (orig.w + dx) / Math.max(1, orig.w));
      o.w = Math.max(2, orig.w * f); o.h = Math.max(2, orig.h * f); break;
    }
    case "line": o.x2 = orig.x2 + dx; o.y2 = orig.y2 + dy; break;
    case "clip": o.scale = Math.max(0.1, orig.scale * (box0.w + dx) / Math.max(1, box0.w)); break;
    case "path": {
      const fx = Math.max(0.05, (box0.w + dx) / Math.max(1, box0.w)), fy = Math.max(0.05, (box0.h + dy) / Math.max(1, box0.h));
      o.pts = orig.pts.map(([x, y]) => [box0.x + (x - box0.x) * fx, box0.y + (y - box0.y) * fy]);
      break;
    }
    case "chord": case "finger": case "loop": o.size = Math.max(o.t === "chord" ? 15 : 6, orig.size + dx); break;
    case "staff": { // ancho con el arrastre horizontal y separación de líneas con el vertical: para cuadrar con una partitura
      o.w = Math.max(40, orig.w + dx);
      const f = Math.max(0.3, (box0.h + dy) / Math.max(1, box0.h));
      o.gap = Math.max(2, Math.min(30, Math.round(orig.gap * f * 100) / 100));
      o.sysGap = Math.max(0, Math.round(orig.sysGap * f * 10) / 10);
      if (o.chordRow) o.chordH = Math.max(10, Math.round(orig.chordH * f));
      break;
    }
    case "meas": o.w = Math.max(10, orig.w + dx); o.h = Math.max(6, orig.h + dy); break;
    case "neck": {
      o.w = Math.max(40, orig.w + dx);
      const f = Math.max(0.3, (box0.h + dy) / Math.max(1, box0.h));
      o.sg = Math.max(4, Math.min(40, Math.round(orig.sg * f * 100) / 100));
      break;
    }
    case "text": {
      const f = Math.max(0.2, (box0.h + dy) / Math.max(1, box0.h));
      o.size = Math.max(3, Math.round(orig.size * f * 10) / 10);
      break;
    }
  }
}

// Simplificación de trazos a mano alzada (Ramer-Douglas-Peucker)
export function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  const dist = (p, a, b) => {
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const l = dx * dx + dy * dy;
    if (!l) return Math.hypot(p[0] - a[0], p[1] - a[1]);
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l));
    return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
  };
  let max = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) { const d = dist(pts[i], pts[0], pts[pts.length - 1]); if (d > max) { max = d; idx = i; } }
  if (max <= eps) return [pts[0], pts[pts.length - 1]];
  return [...simplify(pts.slice(0, idx + 1), eps).slice(0, -1), ...simplify(pts.slice(idx), eps)];
}

// Estilo editable desde la barra (para sincronizar los controles)
export function styleOf(o) {
  return {
    color: ["text", "line", "path", "ellipse"].includes(o.t) && !(o.t === "path" && o.kind === "eraser") ? o.color : null,
    width: o.t === "line" || (o.t === "path" && o.kind !== "eraser") ? o.w : o.t === "ellipse" ? o.sw : null,
    eraser: o.t === "path" && o.kind === "eraser" ? o.w : null,
    font: o.t === "text" ? o.size : null,
    fill: o.t === "rect" ? o.fill : null,
  };
}

/* ---------- Recortar un objeto a una zona (para «Copiar/Cortar zona» sobre cualquier hoja) ---------- */
function inter(a, b) {
  const x = Math.max(a.x, b.x), y = Math.max(a.y, b.y);
  const w = Math.min(a.x + a.w, b.x + b.w) - x, h = Math.min(a.y + a.h, b.y + b.h) - y;
  return w > 0.5 && h > 0.5 ? { x, y, w, h } : null;
}
// Devuelve la parte del objeto que cae dentro de la zona (sin id), o null si no se puede recortar
export function cropToZone(o, zone) {
  const c = cropRaw(o, zone);
  if (c?.holes) { c.holes = c.holes.filter(h => inter(holeToPage(c, h), objBox(c))); if (!c.holes.length) delete c.holes; }
  return c;
}
export function interBox(a, b) { return inter(a, b); }
function cropRaw(o, zone) {
  const b = objBox(o), I = inter(b, zone);
  if (!I) return null;
  if (o.t === "clip") {
    const k = o.scale;
    return { ...JSON.parse(JSON.stringify(o)), x: I.x, y: I.y, sx: o.sx + (I.x - o.x) / k, sy: o.sy + (I.y - o.y) / k, sw: I.w / k, sh: I.h / k };
  }
  if (o.t === "image") {
    const fx = o.cw / o.w, fy = o.ch / o.h;
    return { ...JSON.parse(JSON.stringify(o)), x: I.x, y: I.y, w: I.w, h: I.h, cx: o.cx + (I.x - o.x) * fx, cy: o.cy + (I.y - o.y) * fy, cw: I.w * fx, ch: I.h * fy };
  }
  if (o.t === "rect") return { ...JSON.parse(JSON.stringify(o)), x: I.x, y: I.y, w: I.w, h: I.h };
  return { ...JSON.parse(JSON.stringify(o)), crop: { ...I } }; // pauta, mástil, acorde, texto, trazos…
}
export function boxInside(b, z) { return b.x >= z.x - 0.5 && b.y >= z.y - 0.5 && b.x + b.w <= z.x + z.w + 0.5 && b.y + b.h <= z.y + z.h + 0.5; }
export function boxCenterIn(b, z) { const cx = b.x + b.w / 2, cy = b.y + b.h / 2; return cx >= z.x && cx <= z.x + z.w && cy >= z.y && cy <= z.y + z.h; }
export function boxesTouch(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
