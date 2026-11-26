// Dibujo y geometría de los objetos de página (en puntos)
import { svg } from "./util.js";
import { buildChordContent, chordHeight, ED } from "./chords.js";

export const FONT_SANS = "Helvetica, Arial, sans-serif";
export const FONT_MONO = "Courier New, Courier, monospace";

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
    case "line":
      g.append(svg("line", { x1: o.x1, y1: o.y1, x2: o.x2, y2: o.y2, stroke: "transparent", "stroke-width": Math.max(8, o.w + 6), class: "hit" }));
      g.append(svg("line", { x1: o.x1, y1: o.y1, x2: o.x2, y2: o.y2, stroke: o.color, "stroke-width": o.w, "stroke-linecap": "round" }));
      break;
    case "rect":
      g.append(svg("rect", { x: o.x, y: o.y, width: o.w, height: o.h, fill: o.fill }));
      break;
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

// Caja aproximada sin DOM (para objetos de tamaño conocido)
export function objBox(o, gEl) {
  switch (o.t) {
    case "rect": return { x: o.x, y: o.y, w: o.w, h: o.h };
    case "line": return { x: Math.min(o.x1, o.x2), y: Math.min(o.y1, o.y2), w: Math.abs(o.x2 - o.x1), h: Math.abs(o.y2 - o.y1) };
    case "chord": return { x: o.x, y: o.y, w: o.size, h: chordHeight(o.model) * o.size / ED.W };
    case "finger": return { x: o.x, y: o.y, w: o.size, h: o.size };
    case "loop": return { x: o.x, y: o.y, w: o.size, h: o.size * 0.6 };
    case "text": {
      if (gEl) { try { const b = gEl.querySelector("text").getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height }; } catch { /* sin DOM */ } }
      const w = (o.text || " ").length * o.size * 0.6;
      return { x: o.x, y: o.y - o.size * 0.8, w, h: o.size };
    }
  }
  return { x: 0, y: 0, w: 0, h: 0 };
}

export function moveObj(o, dx, dy) {
  if (o.t === "line") { o.x1 += dx; o.x2 += dx; o.y1 += dy; o.y2 += dy; }
  else { o.x += dx; o.y += dy; }
}

// Redimensionar arrastrando la esquina inferior derecha (o el extremo 2 en líneas)
export function resizeObj(o, orig, dx, dy, box0) {
  switch (o.t) {
    case "rect": o.w = Math.max(1, orig.w + dx); o.h = Math.max(1, orig.h + dy); break;
    case "line": o.x2 = orig.x2 + dx; o.y2 = orig.y2 + dy; break;
    case "chord": case "finger": case "loop": o.size = Math.max(o.t === "chord" ? 15 : 6, orig.size + dx); break;
    case "text": {
      const f = Math.max(0.2, (box0.h + dy) / Math.max(1, box0.h));
      o.size = Math.max(3, Math.round(orig.size * f * 10) / 10);
      break;
    }
  }
}

export function offsetCopy(o, d = 12) {
  const c = JSON.parse(JSON.stringify(o));
  moveObj(c, d, d);
  return c;
}
