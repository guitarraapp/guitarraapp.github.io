// Dibujo y geometría de los objetos de página (en puntos)
import { svg } from "./util.js";
import { buildChordContent, chordHeight, ED } from "./chords.js";

export const FONT_SANS = "Helvetica, Arial, sans-serif";
export const FONT_MONO = "Courier New, Courier, monospace";

// Las imágenes de los recortes las proporciona clips.js (asíncrono)
let clipResolver = null;
export function setClipResolver(fn) { clipResolver = fn; }

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

export function renderObj(o) {
  const g = svg("g", { class: `obj obj-${o.t}`, "data-oid": o.id });
  switch (o.t) {
    case "text": {
      const t = svg("text", {
        x: o.x, y: o.y, "font-size": o.size, fill: o.color,
        "font-family": o.font === "mono" ? FONT_MONO : FONT_SANS, "font-weight": o.bold ? "bold" : "normal",
        "xml:space": "preserve",
      });
      t.textContent = o.text || " ";
      g.append(t);
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
      break;
    case "clip": {
      const w = o.sw * o.scale, h = o.sh * o.scale;
      g.append(svg("rect", { x: o.x, y: o.y, width: w, height: h, fill: "#fff" }));
      const img = svg("image", { x: o.x, y: o.y, width: w, height: h, preserveAspectRatio: "none" });
      g.append(img);
      if (clipResolver) clipResolver(o).then(url => { if (url) img.setAttribute("href", url); }).catch(() => {});
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
  switch (o.t) {
    case "rect": case "ellipse": return { x: o.x, y: o.y, w: o.w, h: o.h };
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
    case "text": {
      if (gEl) { try { const b = gEl.querySelector("text").getBBox(); if (b.width || b.height) return { x: b.x, y: b.y, w: b.width, h: b.height }; } catch { /* sin DOM */ } }
      const w = (o.text || " ").length * o.size * 0.6;
      return { x: o.x, y: o.y - o.size * 0.8, w, h: o.size };
    }
  }
  return { x: 0, y: 0, w: 0, h: 0 };
}

export function moveObj(o, dx, dy) {
  if (o.t === "line") { o.x1 += dx; o.x2 += dx; o.y1 += dy; o.y2 += dy; }
  else if (o.t === "path") { o.pts = o.pts.map(([x, y]) => [Math.round((x + dx) * 100) / 100, Math.round((y + dy) * 100) / 100]); }
  else { o.x += dx; o.y += dy; }
}

// Redimensionar arrastrando la esquina inferior derecha (o el extremo final en líneas)
export function resizeObj(o, orig, dx, dy, box0) {
  switch (o.t) {
    case "rect": case "ellipse": o.w = Math.max(1, orig.w + dx); o.h = Math.max(1, orig.h + dy); break;
    case "line": o.x2 = orig.x2 + dx; o.y2 = orig.y2 + dy; break;
    case "clip": o.scale = Math.max(0.1, orig.scale * (box0.w + dx) / Math.max(1, box0.w)); break;
    case "path": {
      const fx = Math.max(0.05, (box0.w + dx) / Math.max(1, box0.w)), fy = Math.max(0.05, (box0.h + dy) / Math.max(1, box0.h));
      o.pts = orig.pts.map(([x, y]) => [box0.x + (x - box0.x) * fx, box0.y + (y - box0.y) * fy]);
      break;
    }
    case "chord": case "finger": case "loop": o.size = Math.max(o.t === "chord" ? 15 : 6, orig.size + dx); break;
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
