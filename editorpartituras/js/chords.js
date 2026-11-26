// Diagramas de acordes: biblioteca, dibujo SVG y editor
import { svg, el, dialog, toast } from "./util.js";
import { getCustomChords, saveCustomChords } from "./db.js";
import { sanitizeChordModel } from "./model.js";

// Geometría interna del diagrama (unidades propias; el ancho total es ED.W)
export const ED = { W: 102, left: 21, right: 91, top: 25, strings: 6, fGap: 16 };
ED.sGap = (ED.right - ED.left) / (ED.strings - 1);
export function chordHeight(m) {
  return ED.top + m.frets * ED.fGap + (m.label ? 30 : 15);
}

const P = (arr) => arr.map(v => (v === null ? [] : [v]));
const BASE = {
  "Am": { traste: 1, frets: 5, pos: P([-1, 0, 2, 2, 1, 0]) },
  "A": { traste: 1, frets: 5, pos: P([-1, 0, 2, 2, 2, 0]) },
  "C": { traste: 1, frets: 5, pos: P([-1, 3, 2, 0, 1, 0]) },
  "D": { traste: 1, frets: 5, pos: P([-1, -1, 0, 2, 3, 2]) },
  "E": { traste: 1, frets: 5, pos: P([0, 2, 2, 1, 0, 0]) },
  "Em": { traste: 1, frets: 5, pos: P([0, 2, 2, 0, 0, 0]) },
  "F": { traste: 1, frets: 5, pos: P([1, 3, 3, 2, 1, 1]), cejillas: [{ traste: 1, desde: 1, hasta: 6 }] },
  "G": { traste: 1, frets: 5, pos: P([3, 2, 0, 0, 0, 3]) },
  "Bm": { traste: 1, frets: 5, pos: P([-1, 2, 4, 4, 3, 2]), cejillas: [{ traste: 2, desde: 2, hasta: 6 }] },
  "Dm": { traste: 1, frets: 5, pos: P([-1, -1, 0, 2, 3, 1]) },
  "F#m": { traste: 2, frets: 5, pos: P([2, 4, 4, 2, 2, 2]), cejillas: [{ traste: 2, desde: 1, hasta: 6 }] },
  "B7": { traste: 1, frets: 5, pos: P([-1, 2, 1, 2, 0, 2]) },
  "E7": { traste: 1, frets: 5, pos: P([0, 2, 0, 1, 0, 0]) },
  "A7": { traste: 1, frets: 5, pos: P([-1, 0, 2, 0, 2, 0]) },
  "D7": { traste: 1, frets: 5, pos: P([-1, -1, 0, 2, 1, 2]) },
  "G7": { traste: 1, frets: 5, pos: P([3, 2, 0, 0, 0, 1]) },
  "C7": { traste: 1, frets: 5, pos: P([-1, 3, 2, 3, 1, 0]) },
};
export const BASE_NAMES = new Set(Object.keys(BASE));
let custom = {};

export async function loadChordLibrary() { custom = await getCustomChords(); }
export function chordLibrary() {
  const out = {};
  for (const [k, v] of Object.entries(BASE)) out[k] = sanitizeChordModel({ ...v, name: k });
  for (const [k, v] of Object.entries(custom)) out[k] = sanitizeChordModel({ ...v, name: k });
  return out;
}
export function isCustomChord(name) { return Object.prototype.hasOwnProperty.call(custom, name); }
export async function saveChordToLibrary(model) {
  const m = sanitizeChordModel(model);
  if (!m.name) throw new Error("El acorde necesita nombre.");
  custom[m.name] = m;
  await saveCustomChords(custom);
}
export async function deleteChordFromLibrary(name) {
  delete custom[name];
  await saveCustomChords(custom);
}

/* ---------- Dibujo SVG en unidades internas ---------- */
export function buildChordContent(m, opts = {}) {
  const g = svg("g");
  const frets = m.frets, top = ED.top, left = ED.left, right = ED.right, fGap = ED.fGap, sGap = ED.sGap;
  const bottom = top + frets * fGap;
  const H = chordHeight(m);
  g.append(svg("rect", { x: 0, y: 0, width: ED.W, height: H, fill: "#fff" }));
  const T = (x, y, txt, size, anchor = "middle", weight = "bold", extra = {}) => {
    const t = svg("text", { x, y, "text-anchor": anchor, "font-family": "Courier New, Courier, monospace", "font-weight": weight, "font-size": size, fill: "#000", ...extra });
    t.textContent = txt; return t;
  };
  if (m.name) g.append(T((left + right) / 2, 15, m.name, 14));
  for (let i = 0; i < ED.strings; i++) {
    const x = left + i * sGap;
    g.append(svg("line", { x1: x, y1: top, x2: x, y2: bottom, stroke: "#000", "stroke-width": 1 }));
  }
  for (let i = 0; i <= frets; i++) {
    const y = top + i * fGap;
    g.append(svg("line", { x1: left, y1: y, x2: right, y2: y, stroke: "#000", "stroke-width": i === 0 && m.traste === 1 ? 3 : 1 }));
  }
  if (m.traste > 1) g.append(T(left - 4, top + fGap * 0.5, String(m.traste), 14, "end", "bold", { "dominant-baseline": "central" }));
  m.cejillas.forEach((cj, idx) => {
    const rel = cj.traste - m.traste;
    if (rel < 0 || rel >= frets) return;
    const yc = top + (rel + 0.5) * fGap;
    const x1 = left + (Math.min(cj.desde, cj.hasta) - 1) * sGap, x2 = left + (Math.max(cj.desde, cj.hasta) - 1) * sGap;
    g.append(svg("rect", { x: x1 - 4, y: yc - 5, width: x2 - x1 + 8, height: 10, rx: 5, fill: "#000", "data-cejilla-idx": opts.editor ? idx : null }));
  });
  for (let i = 0; i < ED.strings; i++) {
    const x = left + i * sGap;
    const arr = m.pos[i] || [];
    if (arr.includes(-1)) g.append(T(x, top - 5, "X", 11, "middle", "normal"));
    else if (arr.includes(0)) g.append(svg("circle", { cx: x, cy: top - 9, r: 3.5, fill: "none", stroke: "#000", "stroke-width": 1 }));
    const dot = (fret, hollow) => {
      if (fret <= 0) return;
      if (m.cejillas.some(cj => cj.traste === fret && i + 1 >= Math.min(cj.desde, cj.hasta) && i + 1 <= Math.max(cj.desde, cj.hasta))) return;
      const rel = fret - m.traste;
      if (rel < 0 || rel >= frets) return;
      const c = svg("circle", { cx: x, cy: top + (rel + 0.5) * fGap, r: 5, fill: hollow ? "#fff" : "#000" });
      if (hollow) { c.setAttribute("stroke", "#000"); c.setAttribute("stroke-width", 1.6); }
      g.append(c);
    };
    arr.forEach(f => dot(f, false));
    (m.hollowPos[i] || []).forEach(f => dot(f, true));
  }
  if (m.label) g.append(T((left + right) / 2, bottom + 20, m.label, 13, "middle", "normal"));
  return g;
}

export function chordPreviewSvg(m, width = 58) {
  const H = chordHeight(m);
  const s = svg("svg", { width, height: Math.round(width * H / ED.W), viewBox: `0 0 ${ED.W} ${H}` });
  s.append(buildChordContent(m));
  return s;
}

/* ---------- Editor de acordes ---------- */
// mode: "new" (guardar / colocar) o "edit" (aplicar). Devuelve { action, model } o null.
export function openChordEditor(initial, mode = "new") {
  let m = sanitizeChordModel(initial || { traste: 1, frets: 5 });
  let baseline = null;
  let tool = "dots";
  let drag = null;
  const capture = () => { baseline = JSON.parse(JSON.stringify(m)); };
  capture();

  const nameIn = el("input", { type: "text", maxlength: 16, value: m.name, placeholder: "Ej: Am7, SIm", style: { width: "110px" } });
  const labelIn = el("input", { type: "text", maxlength: 16, value: m.label, placeholder: "Ej: [E]-[C]", style: { width: "110px" } });
  const fretIn = el("input", { type: "number", min: 1, max: 24, value: m.traste, style: { width: "60px" } });
  const countIn = el("input", { type: "number", min: 1, max: 15, value: m.frets, style: { width: "60px" } });
  const bDots = el("button", { class: "btn small active", type: "button", text: "• Puntos" });
  const bCej = el("button", { class: "btn small", type: "button", text: "═ Cejilla" });
  const bClear = el("button", { class: "btn small", type: "button", text: "Vaciar" });
  const canvas = svg("svg", { class: "chord-editor-svg" });

  function render() {
    canvas.innerHTML = "";
    const H = chordHeight(m);
    canvas.setAttribute("viewBox", `0 0 ${ED.W} ${H}`);
    canvas.setAttribute("width", 270);
    canvas.setAttribute("height", Math.round(H * 270 / ED.W));
    const content = buildChordContent(m, { editor: true });
    canvas.append(content);
    // zonas de clic
    for (let i = 0; i < ED.strings; i++) {
      const x = ED.left + i * ED.sGap;
      canvas.append(svg("rect", { x: x - ED.sGap / 2, y: 0, width: ED.sGap, height: ED.top, fill: "transparent", "data-top": i }));
    }
    if (tool === "dots") {
      for (let s = 0; s < ED.strings; s++) for (let f = 0; f < m.frets; f++) {
        canvas.append(svg("rect", { x: ED.left + s * ED.sGap - ED.sGap / 2, y: ED.top + f * ED.fGap, width: ED.sGap, height: ED.fGap, fill: "transparent", "data-s": s, "data-f": f }));
      }
    } else {
      content.querySelectorAll("[data-cejilla-idx]").forEach(r => { r.style.cursor = "pointer"; canvas.append(r); });
    }
    if (drag) {
      const a = Math.min(drag.s0, drag.s1), b = Math.max(drag.s0, drag.s1);
      const yc = ED.top + (drag.f + 0.5) * ED.fGap;
      canvas.append(svg("rect", { x: ED.left + a * ED.sGap - 4, y: yc - 5, width: (b - a) * ED.sGap + 8, height: 10, rx: 5, fill: "rgba(20,125,104,.65)", "pointer-events": "none" }));
    }
  }
  function pt(evt) {
    const p = canvas.createSVGPoint(); p.x = evt.clientX; p.y = evt.clientY;
    return p.matrixTransform(canvas.getScreenCTM().inverse());
  }
  canvas.addEventListener("pointerdown", (evt) => {
    const t = evt.target;
    if (t.dataset.top !== undefined) {
      const i = Number(t.dataset.top), arr = m.pos[i];
      m.pos[i] = arr.includes(-1) ? [] : arr.includes(0) ? [-1] : [0];
      capture(); render(); return;
    }
    if (tool === "dots" && t.dataset.s !== undefined) {
      const s = Number(t.dataset.s), abs = m.traste + Number(t.dataset.f);
      const filled = m.pos[s], hollow = m.hollowPos[s];
      const fi = filled.indexOf(abs), hi = hollow.indexOf(abs);
      if (fi >= 0) { filled.splice(fi, 1); hollow.push(abs); }
      else if (hi >= 0) hollow.splice(hi, 1);
      else { filled.push(abs); m.pos[s] = filled.filter(v => v > 0); } // al poner un dedo se quita la X/O
      capture(); render(); return;
    }
    if (tool === "cejilla") {
      if (t.dataset.cejillaIdx !== undefined) { m.cejillas.splice(Number(t.dataset.cejillaIdx), 1); capture(); render(); return; }
      const p = pt(evt);
      if (p.y < ED.top || p.y > ED.top + m.frets * ED.fGap) return;
      const s = Math.max(0, Math.min(5, Math.round((p.x - ED.left) / ED.sGap)));
      const f = Math.max(0, Math.min(m.frets - 1, Math.floor((p.y - ED.top) / ED.fGap)));
      drag = { s0: s, s1: s, f };
      canvas.setPointerCapture(evt.pointerId);
      render();
    }
  });
  canvas.addEventListener("pointermove", (evt) => {
    if (!drag) return;
    const s = Math.max(0, Math.min(5, Math.round((pt(evt).x - ED.left) / ED.sGap)));
    if (s !== drag.s1) { drag.s1 = s; render(); }
  });
  canvas.addEventListener("pointerup", () => {
    if (!drag) return;
    if (drag.s0 !== drag.s1) {
      const desde = Math.min(drag.s0, drag.s1) + 1, hasta = Math.max(drag.s0, drag.s1) + 1, traste = m.traste + drag.f;
      if (!m.cejillas.some(c => c.traste === traste && c.desde === desde && c.hasta === hasta)) m.cejillas.push({ traste, desde, hasta });
    }
    drag = null; capture(); render();
  });
  const setTool = (t) => { tool = t; bDots.classList.toggle("active", t === "dots"); bCej.classList.toggle("active", t === "cejilla"); render(); };
  bDots.onclick = () => setTool("dots");
  bCej.onclick = () => setTool("cejilla");
  bClear.onclick = () => { m.pos = Array.from({ length: 6 }, () => []); m.hollowPos = Array.from({ length: 6 }, () => []); m.cejillas = []; capture(); render(); };
  nameIn.oninput = () => { m.name = nameIn.value.trim(); render(); };
  labelIn.oninput = () => { m.label = labelIn.value.trim(); render(); };
  fretIn.oninput = () => {
    const v = parseInt(fretIn.value, 10); if (!Number.isFinite(v)) return;
    const next = Math.max(1, Math.min(24, v)), d = next - baseline.traste;
    m.traste = next;
    m.pos = baseline.pos.map(a => a.map(p => (p > 0 ? Math.max(1, p + d) : p)));
    m.hollowPos = baseline.hollowPos.map(a => a.map(p => Math.max(1, p + d)));
    m.cejillas = baseline.cejillas.map(c => ({ ...c, traste: Math.max(1, c.traste + d) }));
    render();
  };
  fretIn.onblur = () => { fretIn.value = m.traste; capture(); };
  countIn.oninput = () => { const v = parseInt(countIn.value, 10); if (Number.isFinite(v)) { m.frets = Math.max(1, Math.min(15, v)); render(); } };

  const body = el("div", { class: "chord-editor" },
    el("div", { class: "row" },
      el("label", {}, "Nombre ", nameIn), el("label", {}, "Debajo ", labelIn)),
    el("div", { class: "row" },
      el("label", {}, "Traste inicial ", fretIn), el("label", {}, "Nº trastes ", countIn)),
    el("div", { class: "row" }, bDots, bCej, bClear),
    canvas,
    el("p", { class: "muted small center" },
      "Puntos: toca una casilla (negro → hueco → vacío). Encima de la cuerda: O / X / nada. ",
      "Cejilla: arrastra en horizontal sobre un traste; toca una cejilla para quitarla. ",
      "«Debajo» es un texto bajo el diagrama, p. ej. la forma CAGED."));
  render();

  const buttons = mode === "edit"
    ? [{ label: "Cancelar", value: null }, { label: "Aplicar cambios", primary: true, value: () => ({ action: "apply", model: m }) }]
    : [{ label: "Cancelar", value: null },
       { label: "Guardar en biblioteca", value: () => ({ action: "save", model: m }), validate: () => { if (!m.name) { toast("Ponle nombre para guardarlo en la biblioteca."); nameIn.focus(); return false; } return true; } },
       { label: "Colocar en la página", primary: true, value: () => ({ action: "place", model: m }) }];
  return dialog({ title: mode === "edit" ? "Editar acorde" : "Nuevo acorde", body, buttons });
}
