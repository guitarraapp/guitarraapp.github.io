// Fase 4b: marcas de repetición y salto, orden real de reproducción, rasgueos y cajas de acordes.
// Todo se dibuja como «primitivas» (las mismas en pantalla y en el PDF), en puntos de página.
import { clamp, num } from "./util.js";

export const TS_RE = /^([1-9]|1[0-9])\/(1|2|4|8|16)$/;
export function parseTs(ts) { const [n, d] = String(ts || "4/4").split("/").map(Number); return { n: n || 4, d: d || 4 }; }
const str = (s, max = 200) => (typeof s === "string" ? s.slice(0, max) : "");

/* ================= Marcas de un compás ================= */
export const JUMPS = { DC: "D.C.", DCF: "D.C. al Fine", DCC: "D.C. al Coda", DS: "D.S.", DSF: "D.S. al Fine", DSC: "D.S. al Coda" };
// Casilla de 1.ª/2.ª vez: «1», «2», «1,2»… (hasta 9)
export function parseVolta(v) {
  if (typeof v !== "string" || !v) return null;
  const a = [...new Set(v.split(/[^0-9]+/).filter(Boolean).map(Number).filter(n => n >= 1 && n <= 9))].sort((x, y) => x - y);
  return a.length ? a : null;
}
export const voltaLabel = (v) => (parseVolta(v) || []).map(n => n + ".").join(" ");

// Entrada de un compás: cambio de compás y tempo (fase 4) + marcas de reproducción (fase 4b)
export function sanitizeEntry(v) {
  const e = {};
  if (!v || typeof v !== "object") return e;
  if (typeof v.ts === "string" && TS_RE.test(v.ts)) e.ts = v.ts;
  if (Number.isFinite(Number(v.bpm)) && v.bpm !== "" && v.bpm !== null && v.bpm !== undefined) e.bpm = clamp(Math.round(num(v.bpm)), 20, 400);
  if (v.rs) e.rs = 1;
  if (v.re) e.re = clamp(Math.round(num(v.re, 2)), 2, 9);
  const vo = parseVolta(v.v); if (vo) e.v = vo.join(",");
  for (const k of ["segno", "coda", "toCoda", "fine", "sim"]) if (v[k]) e[k] = 1;
  if (typeof v.jump === "string" && JUMPS[v.jump]) e.jump = v.jump;
  if (v.ferm) e.ferm = clamp(Math.round(num(v.ferm, 2)), 1, 16);
  if (v.rit && typeof v.rit === "object" && (v.rit.k === "rit" || v.rit.k === "acc")) e.rit = { k: v.rit.k, n: clamp(Math.round(num(v.rit.n, 2)), 1, 16), p: clamp(Math.round(num(v.rit.p, v.rit.k === "rit" ? 75 : 120)), 20, 200) };
  return e;
}
export function sanitizeCh(ch, max = 64) {
  const out = {};
  for (const [k, v] of Object.entries(ch && typeof ch === "object" ? ch : {})) {
    const i = Math.round(num(k, -1)); if (i < 0 || i >= max) continue;
    const e = sanitizeEntry(v);
    if (Object.keys(e).length) out[i] = e;
  }
  return out;
}
const ABOVE = ["v", "segno", "coda", "toCoda", "fine", "jump", "ferm", "rit", "re"];
export const hasAboveMarks = (ch) => Object.values(ch || {}).some(e => ABOVE.some(k => e[k]));
export const hasPlayMarks = (e) => Boolean(e && (e.rs || e.re || e.v || e.segno || e.coda || e.toCoda || e.fine || e.jump || e.ferm || e.rit || e.sim));

/* ================= Orden real de reproducción ================= */
// M: lista de compases (measureList) con .mk = marcas. Devuelve [{ m, pass }] en el orden en que suenan.
// Reglas habituales: «:‖» vuelve al «‖:» anterior (o al principio, o tras el «:‖» anterior);
// las casillas se tocan en su vuelta; tras D.C./D.S. no se repite (salvo opción) y se toca la última casilla;
// tras el salto valen «Fine» y «To Coda».
export function playOrder(M, { repAfterJump = false } = {}) {
  const n = M.length, out = [];
  if (!n) return out;
  const mk = (i) => M[i].mk || {};
  const vol = M.map((_, i) => parseVolta(mk(i).v));
  const runMax = new Array(n).fill(0);
  for (let i = 0; i < n;) {
    if (!vol[i]) { i++; continue; }
    let j = i, mx = 0;
    while (j < n && vol[j]) { mx = Math.max(mx, ...vol[j]); j++; }
    for (let k = i; k < j; k++) runMax[k] = mx;
    i = j;
  }
  const segno = M.findIndex((_, i) => mk(i).segno), coda = M.findIndex((_, i) => mk(i).coda);
  let pos = 0, repStart = 0, pass = 1, jumped = false, cameBack = false, inVolta = false, guard = 0;
  const endDone = new Map(), jumpUsed = new Set(), codaUsed = new Set();
  while (pos < n && guard++ < 20000 && out.length < 5000) {
    const k = mk(pos), v = vol[pos];
    const repOn = !jumped || repAfterJump;
    if (k.rs && !cameBack) { repStart = pos; pass = 1; }
    cameBack = false;
    if (v) {
      inVolta = true;
      const play = repOn ? v.includes(pass) : v.includes(runMax[pos]);
      if (!play) { if (k.re) repStart = pos + 1; pos++; continue; }
    } else if (inVolta) { inVolta = false; pass = 1; }
    out.push({ m: pos, pass });
    if (jumped && k.fine) break;
    if (jumped && k.toCoda && coda > pos && !codaUsed.has(pos)) { codaUsed.add(pos); pos = coda; repStart = coda; pass = 1; inVolta = false; continue; }
    if (k.re && repOn) {
      const done = endDone.get(pos) || 0;
      if (done < k.re - 1) { endDone.set(pos, done + 1); pass++; pos = repStart; cameBack = true; inVolta = false; continue; }
      endDone.delete(pos);
    }
    if (k.re) { repStart = pos + 1; if (!v) pass = 1; }
    if (k.jump && !jumpUsed.has(pos)) {
      const target = k.jump.startsWith("DS") ? segno : 0;
      if (target >= 0) { jumpUsed.add(pos); jumped = true; pos = target; repStart = target; pass = 1; inVolta = false; endDone.clear(); continue; }
    }
    pos++;
  }
  return out;
}
// «1-8, 1-6, 9-12» a partir de una lista de índices (0 = compás 1)
export function compactOrder(idx) {
  const parts = [];
  let a = null, b = null;
  for (const i of idx) {
    if (a !== null && i === b + 1) { b = i; continue; }
    if (a !== null) parts.push(a === b ? `${a + 1}` : `${a + 1}–${b + 1}`);
    a = b = i;
  }
  if (a !== null) parts.push(a === b ? `${a + 1}` : `${a + 1}–${b + 1}`);
  return parts.join(", ");
}
// rit. / accel.: el tempo cambia poco a poco durante n compases (en el orden en que suenan) y luego vuelve («a tempo»)
export function tempoPlan(M, seq) {
  let ramp = null;
  return seq.map((m, j) => {
    const r = M[m]?.mk?.rit;
    if (r) ramp = { start: j, n: r.n, p: r.p / 100 };
    let f0 = 1, f1 = 1;
    if (ramp && j < ramp.start + ramp.n) {
      const a = (j - ramp.start) / ramp.n, b = (j - ramp.start + 1) / ramp.n;
      f0 = 1 + (ramp.p - 1) * a; f1 = 1 + (ramp.p - 1) * b;
    } else ramp = null;
    return { m, f0, f1 };
  });
}

/* ================= Dibujo de las marcas ================= */
export const markUnit = (h) => clamp(h / 4.6, 3.5, 11);
const BLACK = "#000000";
const SEGNO_D = "M0.78 0.32 C0.78 0.06 0.22 0.06 0.24 0.36 C0.26 0.62 0.76 0.66 0.76 0.98 C0.76 1.32 0.22 1.32 0.22 1.06";
export function segnoPrims(cx, cy, s, col = BLACK) {
  const x0 = cx - 0.5 * s, y0 = cy - 0.7 * s;
  return [
    { k: "path", d: SEGNO_D, tx: x0, ty: y0, sc: s, w: s * 0.11, color: col },
    { k: "line", x1: x0 + 0.1 * s, y1: y0 + 1.22 * s, x2: x0 + 0.9 * s, y2: y0 + 0.18 * s, w: s * 0.07, color: col },
    { k: "circle", cx: x0 + 0.16 * s, cy: y0 + 0.6 * s, r: 0.075 * s, fill: col },
    { k: "circle", cx: x0 + 0.84 * s, cy: y0 + 0.8 * s, r: 0.075 * s, fill: col },
  ];
}
export function codaPrims(cx, cy, r, col = BLACK) {
  return [
    { k: "circle", cx, cy, r, fill: null, stroke: col, sw: r * 0.2 },
    { k: "line", x1: cx - r * 1.45, y1: cy, x2: cx + r * 1.45, y2: cy, w: r * 0.14, color: col },
    { k: "line", x1: cx, y1: cy - r * 1.45, x2: cx, y2: cy + r * 1.45, w: r * 0.14, color: col },
  ];
}
export function fermataPrims(cx, cy, R, col = BLACK) {
  return [
    { k: "path", d: "M-1 0 C-1 -1.3 1 -1.3 1 0", tx: cx, ty: cy, sc: R, w: R * 0.16, color: col },
    { k: "circle", cx, cy: cy - 0.28 * R, r: 0.17 * R, fill: col },
  ];
}
export function simPrims(cx, cy, u, col = BLACK) {
  return [
    { k: "line", x1: cx - u * 0.75, y1: cy + u * 0.75, x2: cx + u * 0.75, y2: cy - u * 0.75, w: u * 0.32, color: col },
    { k: "circle", cx: cx - u * 0.62, cy: cy - u * 0.42, r: u * 0.2, fill: col },
    { k: "circle", cx: cx + u * 0.62, cy: cy + u * 0.42, r: u * 0.2, fill: col },
  ];
}
// cells: [{ x0, x1, y, h, c }] de UNA fila, en orden. Barras de repetición, casillas, segno, coda, saltos, calderón…
export function marksPrims(cells, u, col = BLACK) {
  const P = [];
  const text = (x, y, t, size, anchor = "start", bold = true) => P.push({ k: "text", x, y, text: t, size, font: "sans", bold, anchor, base: "alphabetic", color: col });
  cells.forEach((cell, i) => {
    const { x0, x1, y, h } = cell, c = cell.c || {};
    const prev = cells[i - 1]?.c || {}, next = cells[i + 1]?.c || {};
    const tw = u * 0.45, thin = Math.max(0.6, u * 0.11), dr = u * 0.17, ym = y + h / 2;
    if (c.rs) {
      P.push({ k: "line", x1: x0 + tw / 2, y1: y, x2: x0 + tw / 2, y2: y + h, w: tw, color: col });
      P.push({ k: "line", x1: x0 + tw + u * 0.3, y1: y, x2: x0 + tw + u * 0.3, y2: y + h, w: thin, color: col });
      P.push({ k: "circle", cx: x0 + tw + u * 0.75, cy: ym - u * 0.5, r: dr, fill: col }, { k: "circle", cx: x0 + tw + u * 0.75, cy: ym + u * 0.5, r: dr, fill: col });
    }
    if (c.re) {
      P.push({ k: "line", x1: x1 - tw / 2, y1: y, x2: x1 - tw / 2, y2: y + h, w: tw, color: col });
      P.push({ k: "line", x1: x1 - tw - u * 0.3, y1: y, x2: x1 - tw - u * 0.3, y2: y + h, w: thin, color: col });
      P.push({ k: "circle", cx: x1 - tw - u * 0.75, cy: ym - u * 0.5, r: dr, fill: col }, { k: "circle", cx: x1 - tw - u * 0.75, cy: ym + u * 0.5, r: dr, fill: col });
    }
    if (c.sim) P.push(...simPrims((x0 + x1) / 2, ym, Math.min(u, (x1 - x0) / 4), col));
    // casilla de 1.ª / 2.ª vez (varios compases seguidos con la misma forman una sola casilla)
    if (c.v) {
      const yb = y - u * 2.5, start = prev.v !== c.v, end = next.v !== c.v;
      const xa = x0 + (start ? u * 0.25 : 0), xb = x1 - (end ? u * 0.25 : 0);
      P.push({ k: "line", x1: xa, y1: yb, x2: xb, y2: yb, w: thin, color: col });
      if (start) { P.push({ k: "line", x1: xa, y1: yb, x2: xa, y2: yb + u * 1.6, w: thin, color: col }); text(xa + u * 0.4, yb + u * 1.15, voltaLabel(c.v), u * 1.05); }
      if (end && next.v) P.push({ k: "line", x1: xb, y1: yb, x2: xb, y2: yb + u * 1.6, w: thin, color: col });
    }
    // a la izquierda, encima: segno, coda, rit./accel.
    let lx = x0 + u * 0.3;
    const ly = y - u * 0.55;
    if (c.segno) { P.push(...segnoPrims(lx + u * 0.75, ly - u * 0.95, u * 1.5, col)); lx += u * 1.9; }
    if (c.coda) { P.push(...codaPrims(lx + u * 0.9, ly - u * 0.9, u * 0.6, col)); lx += u * 2.1; }
    if (c.rit) { text(lx, ly, c.rit.k === "rit" ? "rit." : "accel.", u * 1.1, "start", false); }
    // a la derecha, encima: Fine, To Coda, D.C./D.S. (apilados)
    let ry = y - u * 0.55;
    const stackR = (fn) => { fn(ry); ry -= u * 1.45; };
    if (c.re) stackR((yy) => text(x1, yy, `×${c.re}`, u * 1.1, "end"));
    if (c.fine) stackR((yy) => text(x1, yy, "Fine", u * 1.15, "end"));
    if (c.toCoda) stackR((yy) => { P.push(...codaPrims(x1 - u * 0.7, yy - u * 0.4, u * 0.45, col)); text(x1 - u * 1.6, yy, "To Coda", u * 1.0, "end"); });
    if (c.jump) stackR((yy) => text(x1, yy, JUMPS[c.jump], u * 1.1, "end"));
    if (c.ferm) P.push(...fermataPrims((x0 + x1) / 2, y - u * 0.45, u * 0.85, col));
  });
  return P;
}

/* ================= Rasgueos ================= */
export const STRUM_VALUES = ["", "d", "u", "x"];
export function slotsFor(ts, sub = 2) { const { n, d } = parseTs(ts); return clamp(Math.round(n * sub * 4 / d), 1, 32); }
export function sanitizeStrum(s) {
  if (!s || typeof s !== "object" || !Array.isArray(s.slots)) return null;
  const slots = s.slots.slice(0, 32).map(v => (STRUM_VALUES.includes(v) ? v : ""));
  if (!slots.length) return null;
  return { slots, sub: clamp(Math.round(num(s.sub, 2)), 1, 4), b: clamp(Math.round(num(s.b, 0)), 0, 16) };
}
// «D-DU-UDU» ⇄ [d,"",d,u,"",u,d,u]
export const strumToText = (slots) => slots.map(v => (v ? v.toUpperCase() : "-")).join("");
export function textToStrum(t) {
  const out = [];
  for (const ch of String(t || "").toUpperCase()) {
    if (ch === "D" || ch === "↓" || ch === "B") out.push("d");
    else if (ch === "U" || ch === "↑" || ch === "A" || ch === "S") out.push("u");
    else if (ch === "X" || ch === "✕") out.push("x");
    else if (ch === "-" || ch === "." || ch === "_" || ch === "0") out.push("");
  }
  return out.slice(0, 32);
}
export const STRUM_PRESETS = [
  { name: "Básico ↓ ↓↑ ↑↓↑ (4/4)", t: "D-DU-UDU" },
  { name: "Corcheas ↓↑↓↑↓↑↓↑ (4/4)", t: "DUDUDUDU" },
  { name: "Negras ↓ ↓ ↓ ↓ (4/4)", t: "D-D-D-D-" },
  { name: "Pop ↓ ↓ ↓↑ ↓↑ (4/4)", t: "D-D-DUDU" },
  { name: "Balada ↓ ↓↑ ↓ ↓↑ (4/4)", t: "D-DUD-DU" },
  { name: "Con apagado ↓ ✕↑ ↓ ✕↑ (4/4)", t: "D-XUD-XU" },
  { name: "Mitad ↓ ↓↑ (2 tiempos)", t: "D-DU" },
  { name: "Vals ↓ ↓↑ ↓↑ (3/4)", t: "D-DUDU" },
  { name: "Vals ↓ ↓ ↓ (3/4)", t: "D-D-D-" },
  { name: "6/8 ↓↓↑↓↓↑", t: "DDUDDU" },
  { name: "Semicorcheas ↓↑↓↑ ×4 (4/4)", t: "DUDUDUDUDUDUDUDU" },
];
// Etiquetas de conteo: 1 y 2 y… (corcheas), 1 · y · (semicorcheas), 1 · · (tresillos)
export function countLabels(N, perBeat) {
  return Array.from({ length: N }, (_, i) => {
    const b = Math.floor(i / perBeat) + 1, k = i % perBeat;
    if (k === 0) return String(b);
    if (perBeat === 2) return "y";
    if (perBeat === 4) return k === 2 ? "y" : "·";
    return "·";
  });
}
// Flechas de un rasgueo dentro de la caja (x, y, w, h)
export function strumPrims(st, x, y, w, h, { count = false, beats = 0, col = BLACK } = {}) {
  const P = [], slots = st?.slots || [];
  const N = slots.length; if (!N) return P;
  const dx = w / N;
  const countH = count ? Math.min(h * 0.3, dx * 0.9) : 0;
  const L = h - countH - (count ? h * 0.06 : 0);
  const lw = clamp(dx * 0.09, 0.55, 1.6), hw = Math.min(dx * 0.3, L * 0.16), hh = hw * 1.5;
  slots.forEach((v, i) => {
    const cx = x + (i + 0.5) * dx;
    if (v === "d") {
      P.push({ k: "line", x1: cx, y1: y, x2: cx, y2: y + L - hh * 0.9, w: lw, color: col });
      P.push({ k: "poly", pts: [[cx, y + L], [cx - hw, y + L - hh], [cx + hw, y + L - hh]], fill: col });
    } else if (v === "u") {
      P.push({ k: "line", x1: cx, y1: y + hh * 0.9, x2: cx, y2: y + L, w: lw, color: col });
      P.push({ k: "poly", pts: [[cx, y], [cx - hw, y + hh], [cx + hw, y + hh]], fill: col });
    } else if (v === "x") {
      const s = Math.min(dx * 0.32, L * 0.22), cy = y + L / 2;
      P.push({ k: "line", x1: cx - s, y1: cy - s, x2: cx + s, y2: cy + s, w: lw * 1.2, color: col });
      P.push({ k: "line", x1: cx - s, y1: cy + s, x2: cx + s, y2: cy - s, w: lw * 1.2, color: col });
    }
  });
  if (count) {
    const B = beats || st.b || 0;
    const per = B > 0 && N % B === 0 ? N / B : (st.sub || 2);
    const fs = Math.min(countH, dx * 0.95);
    countLabels(N, per).forEach((t, i) => P.push({ k: "text", x: x + (i + 0.5) * dx, y: y + h - fs * 0.15, text: t, size: fs * (i % per === 0 ? 1 : 0.85), font: "sans", bold: i % per === 0, anchor: "middle", base: "alphabetic", color: i % per === 0 ? col : "#555555" }));
  }
  return P;
}
export function sanitizeStrumObj(o, id, N) {
  const st = sanitizeStrum(o) || { slots: textToStrum("D-DU-UDU"), sub: 2 };
  return { id, t: "strum", x: N(o.x), y: N(o.y), w: clamp(num(o.w, 90), 10, 3000), h: clamp(num(o.h, 26), 6, 600), ...st, count: Boolean(o.count), ts: typeof o.ts === "string" && TS_RE.test(o.ts) ? o.ts : "4/4" };
}

/* ================= Cajas de acordes (una caja = un compás) ================= */
// k: «1» un acorde · «2d» dos con diagonal · «2c», «3c», «4c» en columnas
export const BOX_KINDS = { "1": 1, "2d": 2, "2c": 2, "3c": 3, "4c": 4 };
export const BOX_KIND_LABEL = { "1": "Un acorde", "2d": "Dos, con diagonal", "2c": "Dos, en columnas", "3c": "Tres, en columnas", "4c": "Cuatro (uno por pulso)" };
export function sanitizeCell(c) {
  c = c && typeof c === "object" ? c : {};
  const k = BOX_KINDS[c.k] ? c.k : "1";
  const chords = Array.from({ length: BOX_KINDS[k] }, (_, i) => str(c.c?.[i], 14));
  const st = sanitizeStrum(c.st);
  return { k, c: chords, ...(str(c.note, 24) ? { note: str(c.note, 24) } : {}), ...(st ? { st } : {}) };
}
export function sanitizeBoxesObj(o, id, N) {
  const cells = (Array.isArray(o.cells) ? o.cells : []).slice(0, 64).map(sanitizeCell);
  if (!cells.length) cells.push(sanitizeCell({}));
  return {
    id, t: "boxes", x: N(o.x), y: N(o.y), w: clamp(num(o.w, 480), 20, 5000), h: clamp(num(o.h, 36), 8, 400),
    cells, label: str(o.label, 80), meas: o.meas !== false, stCount: Boolean(o.stCount), ch: sanitizeCh(o.ch, cells.length), ...(o.nomk ? { nomk: 1 } : {}),
  };
}
export function boxesLayout(o) {
  const n = Math.max(1, o.cells.length), h = o.h, u = markUnit(h);
  const labelH = o.label ? h * 0.46 : 0;
  const cw = o.w / n;
  let marksH = 0;
  if (!o.nomk && hasAboveMarks(o.ch)) {
    // si las marcas quedan a la derecha del texto de encima, comparten su franja; si no, van en una franja propia
    const labelEnd = o.x + (o.label ? o.label.length * labelH * 0.62 * 0.62 + u : 0);
    const clash = Object.entries(o.ch).some(([i, e]) => ABOVE.some(k => e[k]) && o.x + Number(i) * cw < labelEnd);
    marksH = clash ? u * 2.9 : Math.max(0, u * 2.9 - labelH * 0.75);
  }
  const top = o.y + labelH + marksH;
  const hasSt = o.cells.some(c => c.st);
  const stGap = h * 0.12, stH = hasSt ? h * (o.stCount ? 0.95 : 0.72) : 0;
  return { n, cw, u, labelH, marksH, top, xs: Array.from({ length: n + 1 }, (_, i) => o.x + i * cw), stY: top + h + stGap, stH, height: labelH + marksH + h + (hasSt ? stGap + stH : 0) };
}
// Tamaño de letra para que un nombre quepa en un ancho
const fit = (t, maxW, maxH) => Math.max(3, Math.min(maxH, maxW / Math.max(1.6, String(t || "").length * 0.6)));
export function boxesPrims(o, { beatsOf } = {}) {
  const L = boxesLayout(o), P = [], col = "#000000", lw = Math.max(0.6, o.h * 0.025);
  const T = (x, y, t, size, anchor = "middle", bold = true, color = col) => { if (t) P.push({ k: "text", x, y, text: t, size, font: "sans", bold, anchor, base: "central", color }); };
  if (o.label) T(o.x, o.y + L.labelH * 0.5, o.label, L.labelH * 0.62, "start", true);
  const top = L.top, bot = top + o.h;
  P.push({ k: "line", x1: o.x, y1: top, x2: o.x + o.w, y2: top, w: lw, color: col });
  P.push({ k: "line", x1: o.x, y1: bot, x2: o.x + o.w, y2: bot, w: lw, color: col });
  L.xs.forEach(x => P.push({ k: "line", x1: x, y1: top - lw / 2, x2: x, y2: bot + lw / 2, w: lw, color: col }));
  o.cells.forEach((c, i) => {
    const x0 = L.xs[i], x1 = L.xs[i + 1], cw = L.cw, h = o.h;
    const noteH = c.note ? h * 0.2 : 0, ch = c.c;
    if (c.k === "1") T((x0 + x1) / 2, top + (h - noteH) / 2, ch[0], fit(ch[0], cw * 0.86, h * 0.38));
    else if (c.k === "2d") {
      P.push({ k: "line", x1: x0, y1: bot, x2: x1, y2: top, w: lw * 0.9, color: col });
      const fs = Math.min(fit(ch[0], cw * 0.5, h * 0.3), fit(ch[1], cw * 0.5, h * 0.3));
      T(x0 + cw * 0.07, top + h * 0.1 + fs * 0.55, ch[0], fs, "start");
      T(x1 - cw * 0.07, bot - h * 0.1 - fs * 0.55, ch[1], fs, "end");
    } else {
      const k = BOX_KINDS[c.k], sw = cw / k;
      for (let j = 1; j < k; j++) P.push({ k: "line", x1: x0 + j * sw, y1: top + h * 0.12, x2: x0 + j * sw, y2: bot - h * 0.12, w: lw * 0.7, color: "#555555" });
      const fs = Math.min(...ch.map(t => fit(t, sw * 0.86, h * 0.32)));
      ch.forEach((t, j) => T(x0 + (j + 0.5) * sw, top + (h - noteH) / 2, t, fs));
    }
    if (c.note) {
      const fsN = Math.min(noteH * 0.85, fit(c.note, c.k === "2d" ? cw * 0.45 : cw * 0.9, noteH));
      if (c.k === "2d") T(x0 + cw * 0.05, bot - noteH * 0.6, c.note, fsN, "start", false, "#333333"); // en el triángulo libre de abajo
      else T((x0 + x1) / 2, bot - noteH * 0.6, c.note, fsN, "middle", false, "#333333");
    }
    if (c.st) P.push(...strumPrims(c.st, x0 + cw * 0.06, L.stY, cw * 0.88, L.stH, { count: o.stCount, beats: beatsOf ? beatsOf(i) : 0, col }));
  });
  if (!o.nomk) P.push(...marksPrims(o.cells.map((_, i) => ({ x0: L.xs[i], x1: L.xs[i + 1], y: top, h: o.h, c: o.ch?.[i] })), L.u, col));
  return P;
}
// Texto rápido de una fila: «Do/Lam Rem/Sol7 Do - %» (/ = varios acordes en la caja, - = vacía, % = como la anterior)
export function parseBoxesText(t, prevCells = []) {
  const toks = String(t || "").trim().split(/\s+/).filter(Boolean).slice(0, 64);
  const out = [];
  toks.forEach((tok, i) => {
    if (tok === "%") { out.push(JSON.parse(JSON.stringify(out[i - 1] || sanitizeCell({})))); return; }
    if (tok === "-" || tok === "_") { out.push(sanitizeCell({ st: prevCells[i]?.st })); return; }
    const parts = tok.split("/").slice(0, 4);
    const k = parts.length === 1 ? "1" : parts.length === 2 ? "2d" : parts.length === 3 ? "3c" : "4c";
    out.push(sanitizeCell({ k, c: parts, note: prevCells[i]?.note, st: prevCells[i]?.st }));
  });
  return out;
}
export const boxesToText = (cells) => cells.map(c => (c.c.some(Boolean) ? c.c.map(x => x || "?").join("/") : "-")).join(" ");
