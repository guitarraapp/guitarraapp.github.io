// Fase 3: pautas (pentagrama / tablatura) y mástiles, dibujados como «primitivas» vectoriales.
// Las mismas primitivas se pintan en pantalla (SVG) y en el PDF exportado, así salen idénticos.
// Todas las medidas en puntos de página.
import { svg } from "./util.js";

export const FONT_SANS = "Helvetica, Arial, sans-serif";
export const FONT_MONO = "Courier New, Courier, monospace";

/* ================= Teoría mínima ================= */
export const TUNING = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 }; // cuerda 1 = Mi agudo
const SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const LAT_S = ["Do", "Do#", "Re", "Re#", "Mi", "Fa", "Fa#", "Sol", "Sol#", "La", "La#", "Si"];
const LAT_F = ["Do", "Reb", "Re", "Mib", "Mi", "Fa", "Solb", "Sol", "Lab", "La", "Sib", "Si"];
export function noteName(pc, style = "en", flats = false) {
  const t = style === "es" ? (flats ? LAT_F : LAT_S) : (flats ? FLAT : SHARP);
  return t[((pc % 12) + 12) % 12];
}
export const ROOTS = SHARP.map((n, i) => ({ pc: i, label: `${n}${FLAT[i] !== n ? "/" + FLAT[i] : ""} · ${LAT_S[i]}` }));
export const pcAt = (s, f) => (TUNING[s] + f) % 12;
const INTERVAL = ["R", "b2", "2", "b3", "3", "4", "b5", "5", "b6", "6", "b7", "7"];
export const intervalName = (root, pc) => INTERVAL[((pc - root) % 12 + 12) % 12];
export const SETS = {
  "triad-maj": { label: "Tríada mayor (R 3 5)", iv: [0, 4, 7] },
  "triad-min": { label: "Tríada menor (R b3 5)", iv: [0, 3, 7] },
  "dom7": { label: "Acorde 7 (R 3 5 b7)", iv: [0, 4, 7, 10] },
  "maj7": { label: "Acorde maj7 (R 3 5 7)", iv: [0, 4, 7, 11] },
  "m7": { label: "Acorde m7 (R b3 5 b7)", iv: [0, 3, 7, 10] },
  "scale-maj": { label: "Escala mayor", iv: [0, 2, 4, 5, 7, 9, 11] },
  "scale-min": { label: "Escala menor natural", iv: [0, 2, 3, 5, 7, 8, 10] },
  "penta-min": { label: "Pentatónica menor", iv: [0, 3, 5, 7, 10] },
  "penta-maj": { label: "Pentatónica mayor", iv: [0, 2, 4, 7, 9] },
  "blues": { label: "Escala de blues", iv: [0, 3, 5, 6, 7, 10] },
  "note": { label: "Solo esa nota", iv: [0] },
};
// Formas CAGED: cuerda donde cae la tónica y ventana de 4 trastes respecto a ella
const CAGED = { C: { s: 5, a: -3, b: 0 }, A: { s: 5, a: 0, b: 3 }, G: { s: 6, a: -3, b: 0 }, E: { s: 6, a: 0, b: 3 }, D: { s: 4, a: 0, b: 3 } };
export function cagedWindow(shape, root) {
  const c = CAGED[shape]; if (!c) return null;
  for (let p = 0; p <= 15; p++) {
    if (pcAt(c.s, p) !== root) continue;
    const a = p + c.a, b = p + c.b;
    if (a >= 0) return { a, b };
  }
  return null;
}
// Marcas de un conjunto (acorde, escala…) entre los trastes a y b
export function setMarks(root, setKey, a, b, labelMode = "iv", style = "en") {
  const set = SETS[setKey] || SETS["triad-maj"];
  const pcs = set.iv.map(i => (root + i) % 12);
  const marks = [];
  for (let s = 1; s <= 6; s++) for (let f = a; f <= b; f++) {
    const pc = pcAt(s, f);
    if (!pcs.includes(pc)) continue;
    const isRoot = pc === root;
    const txt = labelMode === "iv" ? intervalName(root, pc) : labelMode === "note" ? noteName(pc, style, [1, 3, 5, 8, 10].includes(root)) : "";
    marks.push({ s, f, txt, fill: isRoot ? "red" : "black" });
  }
  return marks;
}

/* ================= Colores de las marcas ================= */
export const MARK_FILL = { black: "#111111", white: "#ffffff", red: "#c0392b", blue: "#1f5fbf", green: "#1e8449", gray: "#8a8a8a", orange: "#d35400" };
export const MARK_LABEL = { black: "Negro", white: "Hueco", red: "Rojo", blue: "Azul", green: "Verde", gray: "Gris", orange: "Naranja" };

/* ================= Pauta ================= */
// o: { t:"staff", x, y, w, kind:"tab"|"std"|"both", systems, measures, gap, sysGap, clef, chordRow, chordH }
export function staffLayout(o) {
  const g = o.gap, tg = g * 1.15; // la tablatura un poco más abierta
  const hasStd = o.kind !== "tab", hasTab = o.kind !== "std";
  const sys = [];
  let y = o.y;
  const chordH = o.chordRow ? o.chordH : 0;
  for (let i = 0; i < o.systems; i++) {
    const top = y;
    y += chordH;
    const s = { top, std: null, tab: null };
    if (hasStd) { s.std = [0, 1, 2, 3, 4].map(k => y + k * g); y += 4 * g; }
    if (hasStd && hasTab) y += 3.2 * g;
    if (hasTab) { s.tab = [0, 1, 2, 3, 4, 5].map(k => y + k * tg); y += 5 * tg; }
    s.bottom = y;
    sys.push(s);
    if (i < o.systems - 1) y += o.sysGap;
  }
  const clefW = o.clef ? g * 4.2 : 0;
  const mx0 = o.x + clefW, mw = o.measures > 0 ? (o.x + o.w - mx0) / o.measures : 0;
  const bars = o.measures > 0 ? Array.from({ length: o.measures + 1 }, (_, k) => mx0 + k * mw) : [o.x, o.x + o.w];
  return { sys, height: y - o.y, clefW, mx0, mw, bars, tg };
}
// Clave de sol dibujada con curvas (en espacios de pentagrama; la línea 0 es la de arriba)
const CLEF_D = "M0.42 5.15 C0.18 5.55 0.95 5.85 1.12 5.05 C1.22 4.2 0.72 -0.6 0.92 -1.25 C1.02 -1.65 1.42 -1.6 1.35 -0.95 C1.25 -0.1 0.18 0.75 0.12 1.9 C0.06 3.0 0.65 3.7 1.25 3.55 C1.9 3.4 1.85 2.35 1.12 2.28 C0.6 2.25 0.42 2.85 0.86 3.12";
export function staffPrims(o) {
  const L = staffLayout(o), P = [];
  const col = o.color || "#000000", lw = o.lw || 0.7;
  for (const s of L.sys) {
    for (const ys of [s.std, s.tab]) {
      if (!ys) continue;
      for (const y of ys) P.push({ k: "line", x1: o.x, y1: y, x2: o.x + o.w, y2: y, w: lw, color: col });
      const y1 = ys[0], y2 = ys[ys.length - 1];
      for (const x of L.bars) P.push({ k: "line", x1: x, y1, x2: x, y2, w: lw * 1.3, color: col });
      if (L.bars[0] !== o.x) P.push({ k: "line", x1: o.x, y1, x2: o.x, y2, w: lw * 1.3, color: col });
    }
    if (o.clef && s.std) {
      const g = o.gap, x0 = o.x + g * 0.9, y0 = s.std[0];
      P.push({ k: "path", d: CLEF_D, tx: x0, ty: y0, sc: g, w: 0.2 * g, color: col });
      P.push({ k: "circle", cx: x0 + 0.42 * g, cy: y0 + 5.15 * g, r: 0.26 * g, fill: col });
    }
    if (o.clef && s.tab) {
      const fs = L.tg * 1.3, cx = o.x + L.clefW / 2, mid = (s.tab[0] + s.tab[5]) / 2;
      ["T", "A", "B"].forEach((t, i) => P.push({ k: "text", x: cx, y: mid + (i - 1) * fs * 1.05, text: t, size: fs, font: "sans", bold: true, anchor: "middle", base: "central", color: col, bg: "#ffffff" }));
    }
  }
  return P;
}
// Línea de tablatura más cercana a un punto (para escribir números de traste)
export function nearestTabLine(o, p, tol = 0.6) {
  if (o.t !== "staff" || o.kind === "std") return null;
  if (p.x < o.x - 6 || p.x > o.x + o.w + 6) return null;
  const L = staffLayout(o);
  let best = null;
  for (const s of L.sys) if (s.tab) s.tab.forEach((y, i) => {
    const d = Math.abs(p.y - y);
    if (d <= L.tg * tol && (!best || d < best.d)) best = { d, y, string: i + 1, gap: L.tg };
  });
  return best;
}

/* ================= Mástil ================= */
// o: { t:"neck", x, y, w, from, to, sg, marks:[{s,f,txt,fill}], notes, names, nums, title }
export function neckLayout(o) {
  const n = Math.max(1, o.to - o.from);
  const titleH = o.title ? 15 : 0;
  const left = o.names ? 13 : 3;
  const openW = o.from === 0 ? Math.max(12, o.sg * 1.3) : 0;
  const x0 = o.x + left + openW;                 // nut o primer traste visible
  const fw = (o.x + o.w - 3 - x0) / n;
  const y0 = o.y + titleH + o.sg * 0.75;         // cuerda 1 (Mi agudo)
  const yS = (s) => y0 + (s - 1) * o.sg;
  const xF = (f) => (f === 0 ? x0 - openW / 2 : x0 + (f - o.from - 0.5) * fw); // centro de la casilla
  const bottom = yS(6) + o.sg * 0.75 + (o.nums ? 11 : 0);
  return { n, x0, fw, y0, yS, xF, openW, height: bottom - o.y, titleH, left };
}
const INLAY = new Set([3, 5, 7, 9, 15, 17, 19, 21]);
export function neckPrims(o, opts = {}) {
  const L = neckLayout(o), P = [];
  const col = "#000000", grey = "#9a9a9a";
  const yTop = L.yS(1), yBot = L.yS(6);
  if (o.title) P.push({ k: "text", x: o.x + o.w / 2, y: o.y + 11, text: o.title, size: 11, font: "sans", bold: true, anchor: "middle", base: "alphabetic", color: col });
  // marcadores del mástil (debajo de todo)
  for (let f = o.from + 1; f <= o.to; f++) {
    const fx = L.xF(f), r = Math.min(L.fw, o.sg) * 0.16;
    if (INLAY.has(f)) P.push({ k: "circle", cx: fx, cy: (L.yS(3) + L.yS(4)) / 2, r, fill: "#dddddd" });
    if (f % 12 === 0) { P.push({ k: "circle", cx: fx, cy: (L.yS(2) + L.yS(3)) / 2, r, fill: "#dddddd" }); P.push({ k: "circle", cx: fx, cy: (L.yS(4) + L.yS(5)) / 2, r, fill: "#dddddd" }); }
  }
  // trastes
  for (let k = 0; k <= L.n; k++) {
    const x = L.x0 + k * L.fw;
    const nut = k === 0 && o.from === 0;
    P.push({ k: "line", x1: x, y1: yTop, x2: x, y2: yBot, w: nut ? 3 : 0.8, color: col });
  }
  // cuerdas (las graves algo más gruesas)
  for (let s = 1; s <= 6; s++) P.push({ k: "line", x1: L.x0 - (o.from === 0 ? L.openW : 0), y1: L.yS(s), x2: L.x0 + L.n * L.fw, y2: L.yS(s), w: 0.5 + (s - 1) * 0.13, color: col });
  if (o.names) ["E", "B", "G", "D", "A", "E"].forEach((t, i) => P.push({ k: "text", x: o.x + 6, y: L.yS(i + 1), text: t, size: Math.min(9, o.sg * 0.85), font: "sans", bold: false, anchor: "middle", base: "central", color: "#555555" }));
  if (o.nums) for (let f = o.from + 1; f <= o.to; f++) P.push({ k: "text", x: L.xF(f), y: yBot + o.sg * 0.75 + 8, text: String(f), size: 7.5, font: "sans", bold: false, anchor: "middle", base: "alphabetic", color: INLAY.has(f) || f % 12 === 0 ? "#333333" : "#999999" });
  const r = Math.max(3, Math.min(o.sg * 0.46, L.fw * 0.36));
  const occupied = new Set((o.marks || []).map(m => `${m.s}:${m.f}`));
  if (o.notes) for (let s = 1; s <= 6; s++) for (let f = o.from === 0 ? 0 : o.from + 1; f <= o.to; f++) {
    if (occupied.has(`${s}:${f}`)) continue;
    P.push({ k: "text", x: L.xF(f), y: L.yS(s), text: noteName(pcAt(s, f), o.noteStyle || "en"), size: Math.min(7, r * 1.2), font: "sans", bold: false, anchor: "middle", base: "central", color: grey, bg: "#ffffff" });
  }
  for (const m of o.marks || []) {
    if (m.f < (o.from === 0 ? 0 : o.from + 1) || m.f > o.to) continue;
    const cx = L.xF(m.f), cy = L.yS(m.s), fill = MARK_FILL[m.fill] || MARK_FILL.black;
    const hollow = m.fill === "white";
    P.push({ k: "circle", cx, cy, r, fill, stroke: hollow ? "#111111" : null, sw: hollow ? 1.1 : 0 });
    if (m.txt) {
      const fs = r * (m.txt.length > 2 ? 0.95 : m.txt.length > 1 ? 1.15 : 1.3);
      P.push({ k: "text", x: cx, y: cy, text: m.txt, size: fs, font: "sans", bold: true, anchor: "middle", base: "central", color: hollow ? "#111111" : "#ffffff" });
    }
  }
  if (opts.cells) { // zonas de clic (solo en el editor del mástil)
    for (let s = 1; s <= 6; s++) for (let f = o.from === 0 ? 0 : o.from + 1; f <= o.to; f++) {
      const w = f === 0 ? L.openW : L.fw;
      P.push({ k: "cell", x: L.xF(f) - w / 2, y: L.yS(s) - o.sg / 2, w, h: o.sg, s, f });
    }
  }
  return P;
}

/* ================= Primitivas → SVG ================= */
export function textWidthEstimate(t, size) { return String(t).length * size * 0.6; }
export function primsToSvg(P) {
  const g = svg("g");
  for (const p of P) {
    switch (p.k) {
      case "line": g.append(svg("line", { x1: p.x1, y1: p.y1, x2: p.x2, y2: p.y2, stroke: p.color, "stroke-width": p.w, "stroke-linecap": "butt" })); break;
      case "circle": g.append(svg("circle", { cx: p.cx, cy: p.cy, r: p.r, fill: p.fill || "none", stroke: p.stroke || null, "stroke-width": p.sw || null })); break;
      case "rect": g.append(svg("rect", { x: p.x, y: p.y, width: p.w, height: p.h, fill: p.fill || "none", stroke: p.stroke || null, "stroke-width": p.sw || null })); break;
      case "path": g.append(svg("path", { d: p.d, transform: `translate(${p.tx},${p.ty}) scale(${p.sc})`, fill: "none", stroke: p.color, "stroke-width": p.w / p.sc, "stroke-linecap": "round", "stroke-linejoin": "round" })); break;
      case "text": {
        if (p.bg) { const w = textWidthEstimate(p.text, p.size) + 2; g.append(svg("rect", { x: p.x - w / 2, y: p.y - p.size * 0.55, width: w, height: p.size * 1.1, fill: p.bg })); }
        const t = svg("text", { x: p.x, y: p.y, "font-size": p.size, fill: p.color, "font-family": p.font === "mono" ? FONT_MONO : FONT_SANS, "font-weight": p.bold ? "bold" : "normal", "text-anchor": p.anchor || "start", "dominant-baseline": p.base === "central" ? "central" : null });
        t.textContent = p.text; g.append(t); break;
      }
      case "poly": g.append(svg("polygon", { points: p.pts.map(q => q.join(",")).join(" "), fill: p.fill || "none", stroke: p.stroke || null, "stroke-width": p.sw || null })); break;
      case "cell": g.append(svg("rect", { x: p.x, y: p.y, width: p.w, height: p.h, fill: "transparent", "data-s": p.s, "data-f": p.f, class: "neck-cell" })); break;
    }
  }
  return g;
}
