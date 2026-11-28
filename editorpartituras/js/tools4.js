// Fase 4b: ventanas de marcas de compás, rasgueos y cajas de acordes
import { el, svg, dialog, toast, promptDialog, clamp } from "./util.js";
import { primsToSvg } from "./vector.js";
import {
  JUMPS, TS_RE, parseTs, slotsFor, strumToText, textToStrum, STRUM_PRESETS, strumPrims,
  BOX_KINDS, BOX_KIND_LABEL, sanitizeCell, boxesPrims, boxesLayout, parseBoxesText, boxesToText, sanitizeEntry,
} from "./music.js";

const num = (v, d) => { const n = parseFloat(String(v).replace(",", ".")); return Number.isFinite(n) ? n : d; };
const field = (label, input, hint) => el("label", { class: "f3-field" }, el("span", { text: label }), input, hint ? el("small", { class: "muted", text: hint }) : null);
const numIn = (v, min, max, step = 1, w) => el("input", { type: "number", value: v, min, max, step, style: w ? { width: w } : null });
const check = (v, label) => { const c = el("input", { type: "checkbox" }); c.checked = !!v; return { c, l: el("label", { class: "check f3-field" }, c, " " + label) }; };
const select = (opts, v) => { const s = el("select", {}); for (const [k, t] of opts) s.append(el("option", { value: k, text: t, selected: k === v })); return s; };
const preview = (P, box, cls = "f3-prev") => {
  const s = svg("svg", { class: cls, viewBox: `${box.x - 4} ${box.y - 4} ${box.w + 8} ${box.h + 8}` });
  s.append(primsToSvg(P));
  return s;
};

/* ================= Marcas de un compás ================= */
// entry: lo que ya tiene el compás · info: { ts, bpm } efectivos ahora
export function marksForm(entry, info) {
  const c = entry || {};
  const ts = el("input", { type: "text", value: c.ts || "", placeholder: info?.ts || "4/4", maxlength: 5, style: { width: "70px" } });
  const bpm = numIn(c.bpm || "", 20, 400, 1, "80px"); bpm.placeholder = String(info?.bpm || 80);
  const rs = check(c.rs, "‖: Empieza la repetición (al principio del compás)");
  const re = check(c.re, ":‖ Termina la repetición (al final)");
  const times = numIn(c.re || 2, 2, 9, 1, "56px");
  const volta = el("input", { type: "text", value: c.v || "", placeholder: "1, 2 o 1,2", maxlength: 12, style: { width: "90px" } });
  const segno = check(c.segno, "𝄋 Segno (aquí vuelve el D.S.)");
  const coda = check(c.coda, "𝄌 Coda: aquí empieza la coda");
  const toCoda = check(c.toCoda, "To Coda: al final de este compás, salta a la coda (tras D.C./D.S.)");
  const fine = check(c.fine, "Fine: aquí termina (tras D.C./D.S.)");
  const jump = select([["", "Ninguno"], ...Object.entries(JUMPS)], c.jump || "");
  const ferm = check(c.ferm, "𝄐 Calderón: alarga el final del compás");
  const fermN = numIn(c.ferm || 2, 1, 16, 1, "56px");
  const rit = select([["", "No"], ["rit", "rit. (más lento poco a poco)"], ["acc", "accel. (más rápido poco a poco)"]], c.rit?.k || "");
  const ritN = numIn(c.rit?.n || 2, 1, 16, 1, "56px"), ritP = numIn(c.rit?.p || 75, 20, 200, 1, "64px");
  const sim = check(c.sim, "% Igual que el anterior (solo se dibuja)");
  rit.addEventListener("change", () => { if (rit.value === "acc" && num(ritP.value, 75) < 100) ritP.value = 120; if (rit.value === "rit" && num(ritP.value, 75) > 100) ritP.value = 75; });
  const box = el("div", { class: "f3-form mk-form" },
    el("fieldset", { class: "f3-auto" }, el("legend", { text: "Compás y tempo" }),
      el("p", { class: "muted small", text: `Ahora: ${info?.ts} · ♩=${info?.bpm}. Rellena solo si cambia a partir de este compás.` }),
      el("div", { class: "f3-row" }, field("Desde aquí, compás", ts), field("Desde aquí, tempo", bpm))),
    el("fieldset", { class: "f3-auto" }, el("legend", { text: "Repeticiones" }),
      el("div", { class: "mk-grid" }, rs.l, el("div", { class: "f3-row" }, re.l, el("label", { class: "f3-field check" }, "veces ", times)),
        field("Casilla de vez (1.ª, 2.ª…): número o números", volta, "Pon «1» en los compases de la 1.ª vez y «2» en los de la 2.ª. Vacío = sin casilla."), sim.l)),
    el("fieldset", { class: "f3-auto" }, el("legend", { text: "Saltos" }),
      el("div", { class: "mk-grid" }, segno.l, coda.l, toCoda.l, fine.l, field("Al final de este compás", jump, "D.C. vuelve al principio; D.S., al segno."))),
    el("fieldset", { class: "f3-auto" }, el("legend", { text: "Calderón y cambios de tempo graduales" }),
      el("div", { class: "f3-row" }, ferm.l, el("label", { class: "f3-field check" }, fermN, " pulsos más")),
      el("div", { class: "f3-row" }, field("rit. / accel. desde aquí", rit), field("durante (compases)", ritN), field("hasta el (%)", ritP, "Después vuelve al tempo («a tempo»)"))));
  const read = () => sanitizeEntry({
    ts: TS_RE.test(ts.value.trim()) ? ts.value.trim() : undefined, bpm: bpm.value === "" ? undefined : bpm.value,
    rs: rs.c.checked, re: re.c.checked ? times.value : 0, v: volta.value, segno: segno.c.checked, coda: coda.c.checked, toCoda: toCoda.c.checked,
    fine: fine.c.checked, jump: jump.value, ferm: ferm.c.checked ? fermN.value : 0, sim: sim.c.checked,
    rit: rit.value ? { k: rit.value, n: ritN.value, p: ritP.value } : null,
  });
  const badTs = () => ts.value.trim() && !TS_RE.test(ts.value.trim());
  return { el: box, read, badTs };
}

/* ================= Rasgueo ================= */
const GLYPH = { "": "·", d: "↓", u: "↑", x: "✕" };
const NEXT = { "": "d", d: "u", u: "x", x: "" };
const PREV = { "": "x", d: "", u: "d", x: "u" };
// Editor de un patrón de rasgueo (casillas que se tocan) · ctx: { ts, lib, saveLib(lib) }
export function strumEditor(init, ctx = {}) {
  const st = { ts: init?.ts || ctx.ts || "4/4", sub: init?.sub || 2, slots: [...(init?.slots || [])] };
  if (!st.slots.length) st.slots = textToStrum("D-DU-UDU").slice(0, slotsFor(st.ts, st.sub));
  const tsIn = el("input", { type: "text", value: st.ts, maxlength: 5, style: { width: "56px" }, title: "Compás: 4/4, 3/4, 2/4, 6/8…" });
  const subSel = select([["1", "Negras (1 por pulso)"], ["2", "Corcheas (↓↑ por pulso)"], ["3", "Tresillos (3 por pulso)"], ["4", "Semicorcheas (4 por pulso)"]], String(st.sub));
  const grid = el("div", { class: "st-grid" });
  const text = el("input", { type: "text", value: "", class: "st-text", title: "D = abajo, U = arriba, X = apagado, - = nada" });
  const lib = () => [...(ctx.lib || [])];
  const presetSel = el("select", {});
  const fillPresets = () => {
    presetSel.innerHTML = "";
    presetSel.append(el("option", { value: "", text: "Patrones ▾" }));
    const N = st.slots.length;
    const mine = lib();
    if (mine.length) { const og = el("optgroup", { label: "Mis rasgueos" }); mine.forEach((p, i) => og.append(el("option", { value: "m" + i, text: `${p.name} · ${p.t}` }))); presetSel.append(og); }
    const og2 = el("optgroup", { label: "Habituales" });
    STRUM_PRESETS.forEach((p, i) => og2.append(el("option", { value: "p" + i, text: p.name + (p.t.length === N ? "" : ` (${p.t.length} casillas)`) })));
    presetSel.append(og2);
  };
  const prev = svg("svg", { class: "st-prev" });
  const per = () => { const n = parseTs(st.ts).n; return st.slots.length % n === 0 ? st.slots.length / n : st.sub; };
  const draw = () => {
    grid.innerHTML = "";
    const p = per();
    st.slots.forEach((v, i) => {
      const b = el("button", { type: "button", class: "st-cell" + (i % p === 0 ? " st-beat" : "") + (v ? " on" : ""), title: "Clic: ↓ → ↑ → ✕ → nada · clic derecho: al revés" },
        el("small", { text: i % p === 0 ? String(i / p + 1) : (p === 2 ? "y" : "") }), el("span", { text: GLYPH[v] }));
      b.addEventListener("click", () => { st.slots[i] = NEXT[st.slots[i]]; sync(); });
      b.addEventListener("contextmenu", (e) => { e.preventDefault(); st.slots[i] = PREV[st.slots[i]]; sync(); });
      grid.append(b);
    });
    if (document.activeElement !== text) text.value = strumToText(st.slots);
    const W = Math.max(60, st.slots.length * 14), H = 34;
    prev.setAttribute("viewBox", `-2 -2 ${W + 4} ${H + 4}`);
    prev.innerHTML = "";
    prev.append(primsToSvg(strumPrims({ slots: st.slots, sub: st.sub }, 0, 0, W, H, { count: true, beats: parseTs(st.ts).n })));
  };
  const sync = () => { draw(); ctx.onChange?.(); };
  const resize = () => {
    const N = slotsFor(st.ts, st.sub), old = st.slots, out = new Array(N).fill("");
    old.forEach((v, i) => { if (!v) return; const j = Math.round(i * N / old.length); if (j < N && !out[j]) out[j] = v; });
    st.slots = out;
  };
  tsIn.addEventListener("change", () => { const v = tsIn.value.trim(); if (!TS_RE.test(v)) { toast("Escribe el compás como 4/4, 3/4, 6/8…"); tsIn.value = st.ts; return; } st.ts = v; resize(); fillPresets(); sync(); });
  subSel.addEventListener("change", () => { st.sub = Number(subSel.value); resize(); fillPresets(); sync(); });
  text.addEventListener("input", () => { const a = textToStrum(text.value); if (a.length) { st.slots = a; draw(); ctx.onChange?.(); } });
  text.addEventListener("blur", () => draw());
  presetSel.addEventListener("change", () => {
    const v = presetSel.value; presetSel.value = "";
    const p = v[0] === "m" ? lib()[Number(v.slice(1))] : STRUM_PRESETS[Number(v.slice(1))];
    if (!p) return;
    st.slots = textToStrum(p.t);
    if (p.ts && TS_RE.test(p.ts)) { st.ts = p.ts; tsIn.value = p.ts; }
    if (p.sub) { st.sub = p.sub; subSel.value = String(p.sub); }
    sync();
  });
  const saveBtn = el("button", { type: "button", class: "btn small", text: "Guardar en mis rasgueos" });
  saveBtn.addEventListener("click", async () => {
    const name = await promptDialog("Guardar rasgueo", "Nombre del patrón", "", "Ej.: Bolero, Rumba…");
    if (!name?.trim()) return;
    const l = lib().filter(p => p.name !== name.trim());
    l.push({ name: name.trim().slice(0, 40), t: strumToText(st.slots), ts: st.ts, sub: st.sub });
    ctx.lib = l; await ctx.saveLib?.(l); fillPresets(); toast(`«${name.trim()}» guardado`);
  });
  const clearBtn = el("button", { type: "button", class: "btn small", text: "Vaciar", onclick: () => { st.slots = st.slots.map(() => ""); sync(); } });
  const node = el("div", { class: "st-editor" },
    el("div", { class: "f3-row" }, field("Compás", tsIn), field("Casillas", subSel), field("Escribir (D U X -)", text), presetSel, clearBtn, ctx.saveLib ? saveBtn : null),
    grid, el("div", { class: "st-prev-wrap" }, prev),
    el("p", { class: "muted small", text: "Toca cada casilla para elegir ↓ abajo, ↑ arriba, ✕ apagado o nada. Solo se dibujan las flechas que se tocan." }));
  fillPresets(); draw();
  return { el: node, get: () => ({ slots: [...st.slots], sub: st.sub, b: parseTs(st.ts).n, ts: st.ts }) };
}

// Figura de rasgueo suelta: crear o editar. Devuelve { slots, sub, b, ts, count } o null
export async function strumDialog(init, ctx = {}) {
  const ed = strumEditor(init, ctx);
  const cnt = check(init ? init.count : true, "Poner el conteo debajo (1 y 2 y…)");
  return dialog({
    title: init?.slots ? "Rasgueo" : "Nuevo rasgueo", wide: true, body: el("div", { class: "f3-form" }, ed.el, cnt.l),
    buttons: [{ label: "Cancelar", value: null }, { label: init?.slots ? "Guardar" : "Colocar", primary: true, value: () => ({ ...ed.get(), count: cnt.c.checked }) }],
  });
}

/* ================= Cajas de acordes ================= */
function kindIcon(k) {
  const s = svg("svg", { viewBox: "0 0 40 26", class: "bx-icon" });
  s.append(svg("rect", { x: 1, y: 1, width: 38, height: 24, fill: "#fff", stroke: "#222", "stroke-width": 1.4 }));
  if (k === "2d") s.append(svg("line", { x1: 1, y1: 25, x2: 39, y2: 1, stroke: "#222", "stroke-width": 1.2 }));
  const n = BOX_KINDS[k];
  if (k !== "2d") for (let j = 1; j < n; j++) s.append(svg("line", { x1: 1 + 38 * j / n, y1: 5, x2: 1 + 38 * j / n, y2: 21, stroke: "#777", "stroke-width": 1 }));
  return s;
}
// Ventana de una caja: tipo (1 acorde, diagonal, columnas), acordes, nota y rasgueo debajo
// Devuelve { cell, applyStrumAll, nav } o null
export async function boxCellDialog(row, i, ctx = {}) {
  const cell = sanitizeCell(row.cells[i]);
  let kind = cell.k;
  const kinds = el("div", { class: "bx-kinds" });
  const inputs = el("div", { class: "f3-row bx-chords" });
  const dl = el("datalist", { id: "bxChordNames" }, ...(ctx.chordNames || []).map(n => el("option", { value: n })));
  const vals = [...cell.c];
  const drawInputs = () => {
    inputs.innerHTML = "";
    const n = BOX_KINDS[kind];
    const labels = kind === "2d" ? ["Arriba a la izquierda (primero)", "Abajo a la derecha (después)"] : n === 1 ? ["Acorde"] : Array.from({ length: n }, (_, j) => `${j + 1}.º`);
    for (let j = 0; j < n; j++) {
      const inp = el("input", { type: "text", value: vals[j] || "", maxlength: 14, list: "bxChordNames", style: { width: "110px" }, "data-j": j });
      inp.addEventListener("input", () => { vals[j] = inp.value; });
      inputs.append(field(labels[j], inp));
    }
    kinds.querySelectorAll(".bx-kind").forEach(b => b.classList.toggle("on", b.dataset.k === kind));
    setTimeout(() => inputs.querySelector("input")?.focus(), 20);
  };
  for (const k of Object.keys(BOX_KINDS)) {
    const b = el("button", { type: "button", class: "bx-kind", "data-k": k, title: BOX_KIND_LABEL[k] }, kindIcon(k), el("span", { text: BOX_KIND_LABEL[k] }));
    b.addEventListener("click", () => { kind = k; drawInputs(); });
    kinds.append(b);
  }
  const note = el("input", { type: "text", value: cell.note || "", maxlength: 24, placeholder: "Ej.: (1 vez), ×2…", style: { width: "160px" } });
  const hasSt = check(Boolean(cell.st), "Poner un rasgueo debajo de esta caja");
  const allSt = check(false, "Usar este rasgueo en todas las cajas de la fila");
  const firstSt = row.cells.find(c => c.st)?.st;
  const ed = strumEditor(cell.st || firstSt || null, { ...ctx, ts: ctx.ts });
  const stBox = el("div", { class: "bx-st" }, ed.el, allSt.l);
  const toggle = () => { stBox.hidden = !hasSt.c.checked; };
  hasSt.c.addEventListener("change", toggle);
  const body = el("div", { class: "f3-form" }, dl,
    el("p", { class: "muted small", text: `Caja ${i + 1} de ${row.cells.length}${ctx.measNo ? ` · compás ${ctx.measNo}` : ""}. Con dos acordes, la diagonal reparte el compás: el de arriba suena primero.` }),
    kinds, inputs, field("Nota pequeña (opcional)", note), hasSt.l, stBox);
  toggle(); drawInputs();
  const value = (nav) => () => ({
    nav, applyStrumAll: hasSt.c.checked && allSt.c.checked,
    cell: sanitizeCell({ k: kind, c: vals.slice(0, BOX_KINDS[kind]), note: note.value.trim(), st: hasSt.c.checked ? ed.get() : null }),
  });
  return dialog({
    title: `Caja ${i + 1}`, wide: true, body,
    buttons: [{ label: "Cancelar", value: null },
      ...(i > 0 ? [{ label: "◀ Anterior", value: value("prev") }] : []),
      ...(i < row.cells.length - 1 ? [{ label: "Siguiente ▶", value: value("next") }] : []),
      { label: "Aceptar", primary: true, value: value(null) }],
  });
}

// Fila de cajas: crear o editar. init: fila existente o { w } · Devuelve los campos de la fila o null
export async function boxesRowDialog(init, ctx = {}) {
  const editing = Boolean(init?.cells);
  const cells0 = editing ? init.cells.map(sanitizeCell) : Array.from({ length: ctx.n || 8 }, () => sanitizeCell({}));
  const label = el("input", { type: "text", value: init?.label || "", maxlength: 80, placeholder: "Ej.: ESTROFA I (Mujer…)", class: "full" });
  const nIn = numIn(cells0.length, 1, 64, 1, "70px");
  const text = el("textarea", { rows: 2, class: "full bx-text", placeholder: "Do/Lam Rem/Sol7 Do/Lam Rem Mi Mi" });
  text.value = editing ? boxesToText(cells0) : "";
  const hIn = numIn(init?.h || ctx.h || 36, 12, 200, 1, "70px");
  const meas = check(init ? init.meas !== false : true, "Las cajas cuentan como compases para practicar (cursor y metrónomo)");
  const stMode = select(editing ? [["keep", "Dejar los rasgueos como están"], ["all", "El mismo rasgueo en todas las cajas"], ["none", "Sin rasgueos"]] : [["none", "Sin rasgueos"], ["all", "El mismo rasgueo en todas las cajas"]], editing ? "keep" : "none");
  const cnt = check(init?.stCount, "Conteo debajo de los rasgueos (1 y 2 y…)");
  const ed = strumEditor(cells0.find(c => c.st)?.st || null, ctx);
  const stBox = el("div", {}, ed.el);
  const prevWrap = el("div", { class: "f3-prev-wrap" });
  const build = () => {
    let cells = parseBoxesText(text.value, cells0);
    const n = clamp(Math.round(num(nIn.value, cells.length || 8)), 1, 64);
    while (cells.length < n) cells.push(sanitizeCell({ st: cells0[cells.length]?.st }));
    cells = cells.slice(0, n);
    if (stMode.value === "all") { const st = ed.get(); cells.forEach(c => { c.st = st; }); }
    if (stMode.value === "none") cells.forEach(c => { delete c.st; });
    return { label: label.value.trim(), cells, h: clamp(num(hIn.value, 36), 12, 200), meas: meas.c.checked, stCount: cnt.c.checked };
  };
  const draw = () => {
    stBox.hidden = stMode.value !== "all";
    const r = build(), row = { ...r, x: 0, y: 0, w: init?.w || ctx.w || 480, ch: init?.ch || {}, nomk: init?.nomk };
    const L = boxesLayout(row);
    prevWrap.innerHTML = "";
    prevWrap.append(preview(boxesPrims(row), { x: 0, y: 0, w: row.w, h: L.height }));
  };
  text.addEventListener("input", () => { const k = text.value.trim().split(/\s+/).filter(Boolean).length; if (k) nIn.value = k; draw(); });
  nIn.addEventListener("change", () => {
    const n = clamp(Math.round(num(nIn.value, 8)), 1, 64), toks = text.value.trim().split(/\s+/).filter(Boolean);
    if (toks.length > n) text.value = toks.slice(0, n).join(" ");
    draw();
  });
  const body = el("div", { class: "f3-form" },
    field("Texto encima (opcional)", label),
    el("div", { class: "f3-row" }, field("Número de cajas (compases)", nIn), field("Alto de las cajas (pt)", hIn)),
    field("Acordes, una caja tras otra", text, "Separa las cajas con espacios. Dos acordes en la misma caja: Do/Lam (diagonal). Tres o cuatro: Do/Rem/Mi (columnas). «-» = caja vacía, «%» = igual que la anterior. Luego, doble clic en una caja para retocarla."),
    meas.l, el("div", { class: "f3-row" }, field("Rasgueos debajo", stMode), cnt.l), stBox,
    el("div", { class: "muted small", text: "Vista previa" }), prevWrap);
  body.addEventListener("input", draw); body.addEventListener("change", draw); body.addEventListener("click", () => setTimeout(draw, 0));
  draw();
  return dialog({
    title: editing ? "Fila de cajas de acordes" : "Nueva fila de cajas de acordes", wide: true, body,
    buttons: [{ label: "Cancelar", value: null }, ...(editing ? [{ label: "Editar caja a caja", value: () => ({ ...build(), cellByCell: true }) }] : []), { label: editing ? "Guardar" : "Colocar", primary: true, value: () => build() }],
  });
}
