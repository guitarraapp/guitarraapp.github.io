// Fase 3: ventanas de pauta, mástil, fila de acordes y plantillas de hoja
import { el, svg, dialog, toast, uid, clamp } from "./util.js";
import { staffLayout, neckLayout, neckPrims, primsToSvg, staffPrims, SETS, ROOTS, cagedWindow, setMarks, MARK_FILL, MARK_LABEL, noteName, pcAt } from "./vector.js";
import { chordHeight, ED } from "./chords.js";
import { sanitizeChordModel, sanitizeObj } from "./model.js";

const MARGIN = 40;
const num = (v, d) => { const n = parseFloat(String(v).replace(",", ".")); return Number.isFinite(n) ? n : d; };
const field = (label, input, hint) => el("label", { class: "f3-field" }, el("span", { text: label }), input, hint ? el("small", { class: "muted", text: hint }) : null);
const numIn = (v, min, max, step = 1) => el("input", { type: "number", value: v, min, max, step });
const check = (v) => { const c = el("input", { type: "checkbox" }); c.checked = !!v; return c; };
const select = (opts, v) => { const s = el("select", {}); for (const [k, t] of opts) s.append(el("option", { value: k, text: t, selected: k === v })); return s; };

/* ================= Pauta ================= */
export function defaultStaff(kind = "tab", x = MARGIN, y = MARGIN, w = 515) {
  return sanitizeObj({ id: uid("o"), t: "staff", x, y, w, kind, systems: 1, measures: 4, gap: 7, sysGap: 34, clef: true, chordRow: false, chordH: 78 });
}
// Pautas que caben desde y hasta el final de la hoja
export function systemsToFill(o, pageH, bottomMargin = MARGIN) {
  const one = staffLayout({ ...o, systems: 1 }).height;
  return Math.max(1, Math.floor((pageH - bottomMargin - o.y + o.sysGap) / (one + o.sysGap)));
}

// Ventana para crear o editar una pauta. Devuelve el objeto (sin colocar) o null.
// ctx: { page:{w,h}, fill:boolean por defecto }
export function staffDialog(initial, ctx = {}) {
  const o = { ...initial };
  const kind = select([["tab", "Tablatura (6 líneas)"], ["std", "Pentagrama (5 líneas)"], ["both", "Pentagrama + tablatura"]], o.kind);
  const measures = numIn(o.measures, 0, 16);
  const systems = numIn(o.systems, 1, 40);
  const fill = check(false); // nunca marcado por defecto: así siempre se puede elegir el número de líneas
  const clef = check(o.clef);
  const chordRow = check(o.chordRow);
  const emptyCh = check(false);
  const gap = numIn(o.gap, 2, 30, 0.25);
  const sysGap = numIn(o.sysGap, 0, 400, 1);
  const width = numIn(Math.round(o.w), 40, 5000, 1);
  const prev = svg("svg", { class: "f3-prev" });
  const read = () => {
    o.kind = kind.value; o.measures = clamp(Math.round(num(measures.value, 4)), 0, 16);
    o.systems = clamp(Math.round(num(systems.value, 1)), 1, 40); o.clef = clef.checked; o.chordRow = chordRow.checked;
    o.gap = clamp(num(gap.value, 7), 2, 30); o.sysGap = clamp(num(sysGap.value, 34), 0, 400); o.w = clamp(num(width.value, o.w), 40, 5000);
    if (emptyCh.checked) { o.chordRow = true; chordRow.checked = true; }
    if (fill.checked && ctx.page) { o.systems = systemsToFill(o, ctx.page.h); systems.value = o.systems; }
    systems.disabled = fill.checked;
    return o;
  };
  const draw = () => {
    const v = read(), show = { ...v, x: 0, y: 0, systems: Math.min(v.systems, 3) };
    const h = staffLayout(show).height;
    prev.setAttribute("viewBox", `-6 -6 ${show.w + 12} ${h + 12}`);
    prev.innerHTML = ""; prev.append(primsToSvg(staffPrims(show)));
    if (emptyCh.checked) for (const c of emptyChordsFor(show, 55)) prev.append(chordPreview(c));
  };
  const body = el("div", { class: "f3-form" },
    el("div", { class: "f3-grid" },
      field("Tipo", kind), field("Compases por línea", measures, "0 = sin barras"),
      field("Número de líneas", systems), el("label", { class: "check f3-field" }, fill, " Llenar hasta abajo"),
      el("label", { class: "check f3-field" }, clef, " Clave / TAB al principio"), el("label", { class: "check f3-field" }, chordRow, " Hueco para acordes encima"),
      el("label", { class: "check f3-field" }, emptyCh, ctx.edit ? " Añadir diagramas de acordes vacíos (uno por compás)" : " Diagramas de acordes vacíos (uno por compás)"),
      field("Separación de las líneas (pt)", gap, "Ajusta para cuadrar con tu partitura"), field("Espacio entre líneas de pauta (pt)", sysGap),
      field("Ancho (pt)", width, ctx.page ? `La hoja mide ${Math.round(ctx.page.w)} pt` : null)),
    el("div", { class: "f3-prev-wrap" }, prev),
    el("p", { class: "muted small", text: "Después puedes ajustarla arrastrando la esquina: en horizontal cambia el ancho y en vertical la separación de las líneas. Con la herramienta «Traste» (N) escribes números sobre la tablatura." }));
  body.addEventListener("input", draw); body.addEventListener("change", draw);
  draw();
  return dialog({ title: initial.id && ctx.edit ? "Editar pauta" : "Pauta", body, wide: true,
    buttons: [{ label: "Cancelar", value: null }, { label: ctx.edit ? "Aplicar" : "Insertar", primary: true, value: () => ({ staff: sanitizeObj({ ...read(), id: initial.id || uid("o"), t: "staff" }), emptyChords: emptyCh.checked }) }] });
}
// Vista previa sencilla de un diagrama vacío (rectángulo con la rejilla)
function chordPreview(c) {
  const k = c.size / ED.W, h = chordHeight(c.model) * k;
  const g = svg("g");
  g.append(svg("rect", { x: c.x + c.size * 0.18, y: c.y + h * 0.25, width: c.size * 0.64, height: h * 0.65, fill: "#fff", stroke: "#888", "stroke-width": 0.8 }));
  return g;
}
// Un diagrama de acorde vacío, independiente, en cada compás de la pauta (dentro de su hueco para acordes)
export function emptyChordsFor(st, defaultSize = 55) {
  const blank = sanitizeChordModel({ name: "", label: "", traste: 1, frets: 5 });
  const L = staffLayout(st);
  const n = L.sys.length * Math.max(1, st.measures);
  return buildChordRow({ list: Array(n).fill(""), size: defaultSize, where: "staff", models: Array(n).fill(blank) }, {}, { staff: st }).objs;
}

/* ================= Mástil ================= */
export function defaultNeck(x = MARGIN, y = MARGIN, w = 515) {
  return sanitizeObj({ id: uid("o"), t: "neck", x, y, w, from: 0, to: 12, sg: 11, notes: false, names: false, nums: true, marks: [], title: "" });
}
// Editor del mástil: tocar casillas pone o quita marcas; también se rellena con acordes, escalas o formas CAGED
export function neckDialog(initial, { edit = false } = {}) {
  const o = JSON.parse(JSON.stringify(initial));
  o.marks ||= [];
  let color = "black";
  let last = null; // última marca tocada: el texto y el color que elijas se le aplican al momento
  const fromIn = numIn(o.from, 0, 23), toIn = numIn(o.to, 1, 24);
  const titleIn = el("input", { type: "text", value: o.title || "", maxlength: 60, placeholder: "Ej: Forma C · tríada de Do" });
  const notes = check(o.notes), names = check(o.names), nums = check(o.nums);
  const style = select([["en", "C D E"], ["es", "Do Re Mi"]], o.noteStyle || "en");
  const labelIn = el("input", { type: "text", value: "", maxlength: 4, placeholder: "R, 3, 1…", style: { width: "80px" } });
  labelIn.addEventListener("input", () => { if (last) { last.txt = labelIn.value.trim().slice(0, 4); draw(); } });
  const colorBox = el("span", { class: "f3-colors" });
  const drawColors = () => {
    colorBox.innerHTML = "";
    for (const [k, c] of Object.entries(MARK_FILL)) {
      const b = el("button", { type: "button", class: "f3-color" + (k === color ? " on" : ""), title: MARK_LABEL[k], style: { background: c } });
      b.onclick = () => { color = k; drawColors(); if (last) { last.fill = k; draw(); } };
      colorBox.append(b);
    }
  };
  // relleno automático
  const root = select(ROOTS.map(r => [String(r.pc), r.label]), "0");
  const setSel = select(Object.entries(SETS).map(([k, v]) => [k, v.label]), "triad-maj");
  const shape = select([["all", "En todo el tramo visible"], ["C", "Forma C"], ["A", "Forma A"], ["G", "Forma G"], ["E", "Forma E"], ["D", "Forma D"]], "all");
  const labels = select([["iv", "Intervalos (R 3 5)"], ["note", "Nombres de nota"], ["none", "Sin texto"]], "iv");
  const btnFill = el("button", { type: "button", class: "btn small primary", text: "Rellenar" });
  const btnAdd = el("button", { type: "button", class: "btn small", text: "Añadir a lo que hay" });
  const btnClear = el("button", { type: "button", class: "btn small", text: "Vaciar marcas" });
  const info = el("div", { class: "muted small f3-info", text: "Toca una casilla del mástil para poner una marca. Tócala otra vez para quitarla." });
  const host = svg("svg", { class: "f3-neck" });

  const read = () => {
    o.from = clamp(Math.round(num(fromIn.value, 0)), 0, 23);
    o.to = clamp(Math.round(num(toIn.value, 12)), o.from + 1, 24);
    o.title = titleIn.value.trim(); o.notes = notes.checked; o.names = names.checked; o.nums = nums.checked; o.noteStyle = style.value;
  };
  const draw = () => {
    read();
    const show = { ...o, x: 0, y: 0, w: 700, sg: 20 };
    const L = neckLayout(show);
    host.setAttribute("viewBox", `-4 -4 ${show.w + 8} ${L.height + 8}`);
    host.innerHTML = ""; host.append(primsToSvg(neckPrims(show, { cells: true })));
  };
  host.addEventListener("pointerdown", (e) => {
    const t = e.target; if (t.dataset.s === undefined) return;
    const s = Number(t.dataset.s), f = Number(t.dataset.f);
    const i = o.marks.findIndex(m => m.s === s && m.f === f);
    const txt = labelIn.value.trim().slice(0, 4);
    if (i >= 0 && o.marks[i] === last) { o.marks.splice(i, 1); last = null; info.textContent = `Marca quitada (cuerda ${s}, traste ${f}).`; }
    else if (i >= 0) { last = o.marks[i]; labelIn.value = last.txt; color = last.fill; drawColors(); info.textContent = "Marca elegida: cambia su texto o color arriba, o tócala otra vez para quitarla."; }
    else { last = { s, f, txt, fill: color }; o.marks.push(last); info.textContent = "Marca puesta. Puedes cambiar su texto o color arriba; tócala otra vez para quitarla."; }
    draw();
  });
  host.addEventListener("pointermove", (e) => {
    const t = e.target; if (t.dataset.s === undefined) return;
    const s = Number(t.dataset.s), f = Number(t.dataset.f);
    info.textContent = `Cuerda ${s} · traste ${f} · nota ${noteName(pcAt(s, f), style.value)}`;
  });
  const autoFill = (add) => {
    read();
    const r = Number(root.value);
    let a = o.from === 0 ? 0 : o.from + 1, b = o.to;
    if (shape.value !== "all") {
      const win = cagedWindow(shape.value, r);
      if (!win) { toast("Esa forma no cabe en los primeros trastes."); return; }
      a = win.a; b = win.b;
      o.from = Math.max(0, a - 1); if (a === 0) o.from = 0; o.to = Math.max(b, o.from + 1);
      fromIn.value = o.from; toIn.value = o.to;
      if (!titleIn.value.trim()) titleIn.value = `Forma ${shape.value} · ${noteName(r, style.value)}${setSel.value === "triad-min" ? "m" : ""}`;
    }
    const marks = setMarks(r, setSel.value, a, b, labels.value, style.value);
    if (add) { for (const m of marks) if (!o.marks.some(x => x.s === m.s && x.f === m.f)) o.marks.push(m); }
    else o.marks = marks;
    last = null;
    draw();
  };
  btnFill.onclick = () => autoFill(false);
  btnAdd.onclick = () => autoFill(true);
  btnClear.onclick = () => { o.marks = []; last = null; draw(); };
  drawColors();
  const body = el("div", { class: "f3-form" },
    el("div", { class: "f3-row" }, field("Desde traste", fromIn), field("Hasta traste", toIn), field("Título", titleIn)),
    el("div", { class: "f3-row" }, el("label", { class: "check" }, notes, " Ver todas las notas"), el("label", { class: "check" }, names, " Nombre de las cuerdas"), el("label", { class: "check" }, nums, " Números de traste"), field("Notas", style)),
    el("div", { class: "f3-row f3-markbar" }, el("strong", { class: "small", text: "Marca al tocar el mástil:" }), field("Texto dentro del círculo (opcional)", labelIn), el("div", { class: "f3-field" }, el("span", { text: "Color" }), colorBox)),
    el("div", { class: "f3-neck-wrap" }, host), info,
    el("fieldset", { class: "f3-auto" }, el("legend", { text: "Rellenar automáticamente" }),
      el("div", { class: "f3-row" }, field("Tónica", root), field("Qué", setSel), field("Dónde", shape), field("Texto", labels)),
      el("div", { class: "f3-row" }, btnFill, btnAdd, btnClear)));
  for (const i of [fromIn, toIn, titleIn, notes, names, nums, style]) { i.addEventListener("input", draw); i.addEventListener("change", draw); }
  draw();
  return dialog({ title: edit ? "Editar mástil" : "Diagrama de mástil", body, wide: true,
    buttons: [{ label: "Cancelar", value: null }, { label: edit ? "Aplicar" : "Insertar", primary: true, value: () => { read(); return sanitizeObj({ ...o, t: "neck" }); } }] });
}

/* ================= Fila de acordes ================= */
// Coloca varios diagramas a partir de un texto («Am G F E»): uno por compás de la pauta seleccionada o repartidos a lo ancho
export async function chordRowDialog({ library, staffCount, defaultSize }) {
  const names = el("input", { type: "text", placeholder: staffCount ? "Vacío = un diagrama en blanco en cada compás" : "Ej: Am G F E", class: "full" });
  const size = numIn(Math.round(defaultSize || 55), 15, 300);
  const where = select(staffCount ? [["staff", `Uno por compás de la${staffCount > 1 ? "s " + staffCount + " pautas seleccionadas" : " pauta seleccionada"}`], ["row", "Repartidos a lo ancho de la hoja"]] : [["row", "Repartidos a lo ancho de la hoja"]], staffCount ? "staff" : "row");
  const body = el("div", { class: "f3-form" },
    el("p", { class: "small", text: staffCount ? "Se pone un diagrama en cada compás, cada uno independiente (doble clic para rellenarlo). Si escribes nombres, se usan en orden." : "Consejo: selecciona antes una pauta para poner un diagrama en cada compás." }),
    field("Nombres de los acordes, separados por espacios (opcional)", names),
    el("div", { class: "f3-row" }, field("Tamaño máximo (pt)", size), field("Dónde", where)),
    el("p", { class: "muted small", text: `En tu biblioteca: ${Object.keys(library).join(", ")}. Un nombre que no esté sale vacío con ese nombre.` }));
  setTimeout(() => names.focus(), 50);
  return dialog({ title: "Fila de acordes", body, wide: true, buttons: [{ label: "Cancelar", value: null }, { label: "Colocar", primary: true,
    validate: () => { if (!names.value.trim() && where.value !== "staff") { toast("Escribe los acordes o selecciona antes una pauta."); return false; } return true; },
    value: () => ({ list: names.value.trim() ? names.value.trim().split(/[\s,;|]+/).filter(Boolean).slice(0, 200) : [], size: clamp(num(size.value, 55), 15, 300), where: where.value }) }] });
}
export function buildChordRow({ list, size, where, models: given }, library, ctx) {
  const lib = Object.fromEntries(Object.entries(library).map(([k, v]) => [k.toLowerCase(), v]));
  const missing = [];
  const models = given || list.map(n => {
    const m = lib[n.toLowerCase()];
    if (m) return m;
    missing.push(n);
    return sanitizeChordModel({ name: n, traste: 1, frets: 5 });
  });
  const objs = [];
  if (where === "staff" && ctx.staff) {
    const st = ctx.staff, L = staffLayout(st);
    const slots = [];
    for (const s of L.sys) {
      const ref = s.std ? s.std[0] : s.tab[0];
      const xs = st.measures > 0 ? L.bars.slice(0, -1).map((bx, i) => [bx, L.bars[i + 1]]) : [[st.x, st.x + st.w]];
      for (const [a, b] of xs) slots.push({ a, b, ref, top: s.top });
    }
    models.forEach((m, i) => {
      const sl = slots[i % slots.length];
      // en el hueco para acordes, el diagrama se ajusta para no pisar la pauta
      const sz = st.chordRow ? Math.min(size, (st.chordH - 4) * ED.W / chordHeight(m), (sl.b - sl.a) * 0.9) : Math.min(size, (sl.b - sl.a) * 0.9);
      const h = chordHeight(m) * sz / ED.W;
      const y = st.chordRow ? sl.top + Math.max(0, (st.chordH - 4 - h) / 2) : sl.ref - h - 4;
      objs.push({ id: uid("o"), t: "chord", x: (sl.a + sl.b) / 2 - sz / 2, y, size: Math.round(sz * 10) / 10, model: JSON.parse(JSON.stringify(m)) });
    });
  } else {
    const avail = ctx.page.w - 2 * MARGIN;
    const per = Math.max(1, Math.floor((avail + 10) / (size + 10)));
    models.forEach((m, i) => {
      const row = Math.floor(i / per), col = i % per;
      const n = Math.min(per, models.length - row * per);
      const step = n > 1 ? Math.min(size * 1.8, (avail - size) / (n - 1)) : 0;
      const x0 = MARGIN + (avail - (size + step * (n - 1))) / 2;
      objs.push({ id: uid("o"), t: "chord", x: x0 + col * step, y: ctx.y + row * (chordHeight(m) * size / ED.W + 12), size, model: JSON.parse(JSON.stringify(m)) });
    });
  }
  return { objs, missing };
}

/* ================= Plantillas de hoja (también para imprimir) ================= */
export const TEMPLATES = [
  ["blank", "En blanco"],
  ["tab", "Tablatura (llena la hoja)"],
  ["std", "Pentagrama (llena la hoja)"],
  ["both", "Pentagrama + tablatura"],
  ["tabchords", "Tablatura con hueco para acordes"],
  ["tabdiag", "Tablatura + diagramas de acordes vacíos (1 por compás)"],
  ["bothdiag", "Pentagrama + tablatura + diagramas vacíos (1 por compás)"],
  ["chords", "Diagramas de acordes en blanco"],
  ["necks", "Mástiles en blanco"],
];
export function templateObjs(kind, pg, opts = {}) {
  const W = pg.w, H = pg.h, objs = [];
  const top = opts.title ? MARGIN + 26 : MARGIN;
  if (opts.title) objs.push({ id: uid("o"), t: "text", x: MARGIN, y: MARGIN + 12, size: 16, text: opts.title, color: "#000000", font: "sans", bold: true });
  if (["tab", "std", "both", "tabchords", "tabdiag", "bothdiag"].includes(kind)) {
    const st = defaultStaff({ tabchords: "tab", tabdiag: "tab", bothdiag: "both" }[kind] || kind, MARGIN, top, W - 2 * MARGIN);
    st.measures = W > H ? 5 : 4;
    if (["tabchords", "tabdiag", "bothdiag"].includes(kind)) st.chordRow = true;
    if (kind === "both" || kind === "bothdiag") st.sysGap = 40;
    st.systems = systemsToFill(st, H);
    objs.push(st);
    if (kind === "tabdiag" || kind === "bothdiag") objs.push(...emptyChordsFor(st, 60));
  } else if (kind === "chords") {
    const size = 74, gapX = 22, gapY = 18;
    const m = sanitizeChordModel({ name: "", label: "", traste: 1, frets: 5 });
    const h = chordHeight(m) * size / ED.W + 16; // hueco para escribir el nombre
    const cols = Math.max(1, Math.floor((W - 2 * MARGIN + gapX) / (size + gapX)));
    const rows = Math.max(1, Math.floor((H - top - MARGIN + gapY) / (h + gapY)));
    const x0 = (W - (cols * size + (cols - 1) * gapX)) / 2;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      objs.push({ id: uid("o"), t: "line", x1: x0 + c * (size + gapX) + size * 0.25, y1: top + r * (h + gapY) + 12, x2: x0 + c * (size + gapX) + size * 0.93, y2: top + r * (h + gapY) + 12, w: 0.5, color: "#999999", arrow: 0 });
      objs.push({ id: uid("o"), t: "chord", x: x0 + c * (size + gapX), y: top + r * (h + gapY) + 16, size, model: JSON.parse(JSON.stringify(m)) });
    }
  } else if (kind === "necks") {
    const nk = defaultNeck(MARGIN, top, W - 2 * MARGIN);
    nk.to = W > H ? 15 : 12; nk.sg = 12;
    const h = neckLayout(nk).height, gap = 26;
    const n = Math.max(1, Math.floor((H - top - MARGIN + gap) / (h + gap)));
    for (let i = 0; i < n; i++) objs.push({ ...JSON.parse(JSON.stringify(nk)), id: uid("o"), y: top + i * (h + gap) });
  }
  return objs.map(sanitizeObj).filter(Boolean);
}
export async function templateDialog({ withTitle = false, title = "", withOrient = true } = {}) {
  const kind = select(TEMPLATES, withTitle ? "blank" : "tab");
  const orient = select([["v", "Vertical"], ["h", "Horizontal"]], "v");
  const titleIn = el("input", { type: "text", value: title, class: "full", placeholder: "Título de la pieza" });
  const head = el("input", { type: "text", value: "", class: "full", placeholder: "Opcional: texto en lo alto de la hoja" });
  const body = el("div", { class: "f3-form" },
    withTitle ? field("Título", titleIn) : null,
    el("div", { class: "f3-row" }, field("Plantilla", kind), withOrient ? field("Hoja", orient) : null),
    field("Encabezado", head),
    el("p", { class: "muted small", text: "Las pautas, diagramas y mástiles son elementos normales: se pueden mover, editar con doble clic o borrar. Exporta a PDF para imprimirla." }));
  return dialog({ title: withTitle ? "Nueva pieza" : "Hoja con plantilla", body,
    buttons: [{ label: "Cancelar", value: null }, { label: withTitle ? "Crear" : "Añadir hoja", primary: true, value: () => ({ title: titleIn.value.trim(), kind: kind.value, orient: orient.value, head: head.value.trim() }) }] });
}

/* ================= Panel de consulta del mástil ================= */
// Panel flotante (no bloquea): todas las notas, resaltar una nota, acorde o escala, e insertarlo como diagrama
export function buildNeckPanel(onInsert) {
  const st = { root: 0, set: "note", from: 0, to: 15, style: "en", on: false };
  const root = select(ROOTS.map(r => [String(r.pc), r.label]), "0");
  const setSel = select([["none", "Nada resaltado"], ...Object.entries(SETS).map(([k, v]) => [k, v.label])], "none");
  const style = select([["en", "C D E"], ["es", "Do Re Mi"]], "en");
  const host = svg("svg", { class: "f3-neck" });
  const info = el("div", { class: "muted small", text: "Pasa el ratón por el mástil para ver cuerda, traste y nota." });
  const ins = el("button", { class: "btn small primary", type: "button", text: "Insertar en la hoja" });
  const close = el("button", { class: "btn small", type: "button", text: "Cerrar" });
  const obj = () => ({ t: "neck", x: 0, y: 0, w: 760, from: 0, to: 15, sg: 18, notes: true, names: true, nums: true, noteStyle: style.value, title: "",
    marks: setSel.value === "none" ? [] : setMarks(Number(root.value), setSel.value, 0, 15, "note", style.value) });
  const draw = () => {
    const o = obj(), L = neckLayout(o);
    host.setAttribute("viewBox", `-4 -4 ${o.w + 8} ${L.height + 8}`);
    host.innerHTML = ""; host.append(primsToSvg(neckPrims(o, { cells: true })));
  };
  host.addEventListener("pointermove", (e) => {
    const t = e.target; if (t.dataset.s === undefined) return;
    const s = Number(t.dataset.s), f = Number(t.dataset.f);
    info.textContent = `Cuerda ${s} · traste ${f} · ${noteName(pcAt(s, f), style.value)}`;
  });
  for (const i of [root, setSel, style]) i.addEventListener("change", draw);
  const panel = el("div", { id: "neckPanel", class: "floating f3-panel", hidden: true },
    el("div", { class: "floating-head" }, el("strong", { text: "Mástil" }), field("Tónica", root), field("Resaltar", setSel), field("Notas", style), ins, close),
    el("div", { class: "f3-neck-wrap" }, host), info);
  ins.onclick = () => { const o = obj(); o.notes = false; o.names = false; o.to = 12; o.marks = o.marks.filter(m => m.f <= 12).map(m => ({ ...m, txt: m.txt })); onInsert(o); };
  close.onclick = () => { panel.hidden = true; };
  draw();
  return panel;
}
