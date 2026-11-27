// Organizador de hojas (fase 2): miniaturas, seleccionar, reordenar arrastrando, añadir, duplicar, girar, borrar,
// nueva pieza con hojas, dividir una recopilación en piezas y liberar espacio.
import { el, svg, uid, clone, toast, dialog, confirmDialog, fmtDate } from "./util.js";
import { renderObj } from "./objects.js";
import { pagePdfId, blankPageOriented, isLandscape, deletePiece } from "./model.js";
import { pdfThumbUrl, pieceThumb } from "./thumbs.js";
import { createPieceFromPages, suggestTitleFor, wasteInfo, compactPiece } from "./split.js";
import { dbPut } from "./db.js";

const TW = 132; // ancho de miniatura (px)
let O = null;   // estado del organizador abierto

export function organizerOpen() { return Boolean(O); }

export function openOrganizer(api, { mode = "pages" } = {}) {
  closeOrganizer();
  const root = el("div", { class: "org", role: "dialog", "aria-label": "Organizar hojas" });
  O = { api, root, sel: new Set(), cuts: new Set(), mode, anchor: null, drag: null, titles: new Map(), firstId: api.piece().pages[0]?.id, observer: null };
  document.body.append(root);
  document.body.classList.add("org-open");
  O.onKey = (e) => {
    if (document.querySelector(".modal-backdrop")) return;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
    if (e.key === "Escape") { e.preventDefault(); if (O.sel.size) { O.sel.clear(); render(); } else closeOrganizer(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") { e.preventDefault(); selectAll(); }
    else if ((e.key === "Delete" || e.key === "Backspace") && O.sel.size && O.mode === "pages") { e.preventDefault(); delSel(); }
    else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") { e.preventDefault(); api.undo(); render(); }
  };
  document.addEventListener("keydown", O.onKey, true);
  root.addEventListener("pointermove", onDragMove);
  root.addEventListener("pointerup", onDragUp);
  root.addEventListener("pointercancel", () => { if (O?.drag) { O.drag.ghost?.remove(); O.drag = null; render(); } });
  render();
}

export async function closeOrganizer() {
  if (!O) return;
  const o = O; O = null;
  document.removeEventListener("keydown", o.onKey, true);
  o.observer?.disconnect();
  o.root.remove();
  document.body.classList.remove("org-open");
  // si ha cambiado la primera hoja, se rehace la portada de la biblioteca
  const piece = o.api.piece();
  if (piece && piece.pages[0]?.id !== o.firstId) o.api.refreshThumb();
}

const pages = () => O.api.piece().pages;
const selPages = () => pages().filter(p => O.sel.has(p.id));
function selectAll() { pages().forEach(p => O.sel.add(p.id)); render(); }

/* ================= Dibujo ================= */
function render() {
  if (!O) return;
  const piece = O.api.piece();
  // tras deshacer o borrar, la selección y las marcas solo pueden apuntar a hojas que existen
  const live = new Set(piece.pages.map(p => p.id));
  for (const id of [...O.sel]) if (!live.has(id)) O.sel.delete(id);
  for (const id of [...O.cuts]) if (!live.has(id)) O.cuts.delete(id);
  if (O.anchor && !live.has(O.anchor)) O.anchor = null;
  const root = O.root;
  root.innerHTML = "";
  O.observer?.disconnect();
  O.observer = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { O?.observer.unobserve(e.target); e.target._load?.(); }
  }, { root, rootMargin: "300px" });

  const n = pages().length, ns = O.sel.size;
  const head = el("header", { class: "bar org-bar" },
    el("div", { class: "bar-left" },
      el("button", { class: "btn primary", type: "button", text: "✓ Listo", title: "Volver a la partitura (Esc)", onclick: () => closeOrganizer() }),
      el("div", { class: "bar-title", text: O.mode === "split" ? "Dividir en piezas" : "Hojas" }),
      el("span", { class: "muted small", text: `«${piece.title}» · ${n} hoja(s)${ns ? ` · ${ns} seleccionada(s)` : ""}` })),
    el("div", { class: "bar-actions" },
      O.mode === "split"
        ? el("button", { class: "btn", type: "button", text: "← Organizar hojas", onclick: () => { O.mode = "pages"; render(); } })
        : el("button", { class: "btn", type: "button", text: "✂ Dividir en piezas…", title: "Para recopilaciones: marca dónde empieza cada pieza", onclick: () => { O.mode = "split"; O.sel.clear(); render(); } }),
      el("button", { class: "btn icon", type: "button", text: "↶", title: "Deshacer (Ctrl+Z)", onclick: () => { O.api.undo(); render(); } })));
  root.append(head);

  if (O.mode === "split") root.append(splitPanel());
  else root.append(actionsBar());

  const grid = el("div", { class: "org-grid" + (O.mode === "split" ? " split" : "") });
  pages().forEach((pg, i) => grid.append(tile(pg, i)));
  if (O.mode === "pages") {
    grid.append(el("div", { class: "org-add" },
      el("button", { class: "btn", type: "button", text: "+ Hoja vertical", onclick: () => addBlank("v", true) }),
      el("button", { class: "btn", type: "button", text: "+ Hoja horizontal", onclick: () => addBlank("h", true) })));
  }
  root.append(grid);
  O.grid = grid;
  wireDrag(grid);
  if (O.mode === "pages") showWaste();
}

function tile(pg, i) {
  const piece = O.api.piece();
  const h = Math.round(TW * pg.h / pg.w);
  const wrap = el("div", { class: "org-thumb", style: { width: `${TW}px`, height: `${h}px` } });
  const pid = pagePdfId(piece, pg);
  const s = svg("svg", { viewBox: `0 0 ${pg.w} ${pg.h}`, preserveAspectRatio: "none", class: "org-svg" });
  wrap.append(s);
  wrap._load = async () => {
    if (pid) {
      try { const url = await pdfThumbUrl(pid, pg.src.index, TW); wrap.prepend(el("img", { src: url, alt: "", class: "org-bg" })); } catch { /* sin fondo */ }
    }
    for (const h of pg.holes || []) s.append(svg("rect", { x: h.x, y: h.y, width: h.w, height: h.h, fill: "#fff" }));
    for (const o of pg.objs) s.append(renderObj(o));
  };
  const selected = O.sel.has(pg.id), isCut = i > 0 && O.cuts.has(pg.id);
  const t = el("div", { class: "org-tile" + (selected ? " sel" : "") + (isCut ? " cut" : "") + (i === 0 && O.mode === "split" ? " cut first" : ""), "data-id": pg.id, title: O.mode === "split" ? "Toca para marcar o quitar «aquí empieza una pieza»" : "Toca para seleccionar · arrastra para mover · ↗ para verla" },
    wrap,
    el("div", { class: "org-cap" },
      el("b", { text: String(i + 1) }),
      el("span", { class: "muted small", text: `${isLandscape(pg) ? "▭ horiz." : "▯ vert."}${pid ? "" : " · en blanco"}${pg.objs.length ? ` · ${pg.objs.length} elem.` : ""}` }),
      O.mode === "pages" ? el("button", { class: "btn small org-go", type: "button", text: "↗", title: "Ver esta hoja en la partitura", onclick: (e) => { e.stopPropagation(); const id = pg.id, api = O.api; closeOrganizer(); setTimeout(() => api.goto(id), 0); } }) : null));
  if (O.mode === "split" && (i === 0 || isCut)) t.prepend(el("div", { class: "org-cutmark", text: `✂ Pieza ${pieceNumberAt(i)}` }));
  if (selected && O.mode === "pages") t.prepend(el("div", { class: "org-check", text: "✓" }));
  O.observer.observe(wrap);
  return t;
}
function pieceNumberAt(i) { let n = 1; pages().forEach((p, j) => { if (j > 0 && j <= i && O.cuts.has(p.id)) n++; }); return n; }

/* ================= Selección y arrastre ================= */
function onTileClick(id, e) {
  if (O.mode === "split") {
    if (pages()[0].id === id) { toast("La primera hoja siempre empieza la primera pieza."); return; }
    if (O.cuts.has(id)) O.cuts.delete(id); else O.cuts.add(id);
    render(); return;
  }
  const list = pages().map(p => p.id);
  if (e.shiftKey && O.anchor && list.includes(O.anchor)) {
    const a = list.indexOf(O.anchor), b = list.indexOf(id);
    for (let k = Math.min(a, b); k <= Math.max(a, b); k++) O.sel.add(list[k]);
  } else {
    if (O.sel.has(id)) O.sel.delete(id); else O.sel.add(id);
    O.anchor = id;
  }
  render();
}

function wireDrag(grid) {
  grid.addEventListener("pointerdown", (e) => {
    const t = e.target.closest(".org-tile");
    if (!t || e.button > 0 || e.target.closest("button")) return;
    O.drag = { id: t.dataset.id, x: e.clientX, y: e.clientY, started: false, mouse: e.pointerType === "mouse" };
  });
}
function onDragMove(e) {
    const d = O?.drag; if (!d) return;
    const grid = O.grid;
    if (!d.started) {
      if (!d.mouse || O.mode !== "pages" || Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
      d.started = true;
      d.ids = O.sel.has(d.id) ? selPages().map(p => p.id) : [d.id];
      d.ghost = el("div", { class: "org-ghost", text: d.ids.length > 1 ? `${d.ids.length} hojas` : "1 hoja" });
      document.body.append(d.ghost);
      grid.querySelectorAll(".org-tile").forEach(x => { if (d.ids.includes(x.dataset.id)) x.classList.add("dragging"); });
    }
    d.ghost.style.left = `${e.clientX + 12}px`; d.ghost.style.top = `${e.clientY + 12}px`;
    grid.querySelectorAll(".drop-before,.drop-after").forEach(x => x.classList.remove("drop-before", "drop-after"));
    const over = document.elementsFromPoint(e.clientX, e.clientY).map(n => n.closest?.(".org-tile")).find(Boolean);
    d.target = null;
    if (over && !d.ids.includes(over.dataset.id)) {
      const r = over.getBoundingClientRect();
      d.target = { id: over.dataset.id, after: e.clientX > r.left + r.width / 2 };
      over.classList.add(d.target.after ? "drop-after" : "drop-before");
    }
}
function onDragUp(e) {
    const d = O?.drag; if (!d) return;
    O.drag = null;
    d.ghost?.remove();
    if (!d.started) { const t = e.target.closest?.(".org-tile"); if (t && t.dataset.id === d.id) onTileClick(d.id, e); return; }
    if (d.target) moveTo(d.ids, d.target.id, d.target.after);
    else render();
}

/* ================= Acciones ================= */
function commit(mutate, msg) { O.api.commitPages(mutate); if (msg) toast(msg + " (Ctrl+Z para deshacer)"); render(); }

function moveTo(ids, targetId, after) {
  commit(pgs => {
    const moving = pgs.filter(p => ids.includes(p.id)), rest = pgs.filter(p => !ids.includes(p.id));
    let at = rest.findIndex(p => p.id === targetId);
    if (at < 0) at = rest.length; else if (after) at++;
    rest.splice(at, 0, ...moving);
    pgs.length = 0; pgs.push(...rest);
  });
}
function shift(dir) {
  if (!O.sel.size) return;
  const list = pages(), idx = list.map((p, i) => O.sel.has(p.id) ? i : -1).filter(i => i >= 0);
  if (dir < 0 && idx[0] === 0) return; if (dir > 0 && idx[idx.length - 1] === list.length - 1) return;
  commit(pgs => {
    const order = dir < 0 ? idx : [...idx].reverse();
    for (const i of order) { const j = i + dir; [pgs[i], pgs[j]] = [pgs[j], pgs[i]]; }
  });
}
function addBlank(orient, atEnd) {
  const np = blankPageOriented(orient);
  const list = pages();
  const idx = list.map((p, i) => O.sel.has(p.id) ? i : -1).filter(i => i >= 0);
  const last = atEnd || !idx.length ? list.length - 1 : Math.max(...idx);
  commit(pgs => pgs.splice(last + 1, 0, np), `Hoja ${orient === "h" ? "horizontal" : "vertical"} añadida`);
  O.sel = new Set([np.id]); render();
}
function dupSel() {
  if (!O.sel.size) return;
  const added = [];
  commit(pgs => {
    for (let i = pgs.length - 1; i >= 0; i--) {
      if (!O.sel.has(pgs[i].id)) continue;
      const c = clone(pgs[i]); c.id = uid("pg"); c.objs.forEach(o => { o.id = uid("o"); });
      pgs.splice(i + 1, 0, c); added.push(c.id);
    }
  }, `${added.length} hoja(s) duplicada(s)`);
  O.sel = new Set(added); render();
}
function rotSel() {
  const list = selPages();
  const ok = list.filter(p => p.src.kind === "blank" && !p.objs.length);
  if (!ok.length) { toast("Solo se pueden girar hojas en blanco y vacías. Las de partitura mantienen su orientación."); return; }
  const ids = new Set(ok.map(p => p.id));
  commit(pgs => pgs.forEach(p => { if (ids.has(p.id)) { const w = p.w; p.w = p.h; p.h = w; } }), `${ok.length} hoja(s) girada(s)${ok.length < list.length ? " (las que tienen contenido no se giran)" : ""}`);
}
function delSel() {
  if (!O.sel.size) return;
  if (O.sel.size >= pages().length) { toast("Una pieza necesita al menos una hoja."); return; }
  const n = O.sel.size, ids = new Set(O.sel);
  commit(pgs => { for (let i = pgs.length - 1; i >= 0; i--) if (ids.has(pgs[i].id)) pgs.splice(i, 1); }, `${n} hoja(s) eliminada(s)`);
  O.sel.clear(); render();
}
async function exportSel() {
  const list = selPages();
  if (!list.length) return;
  const all = pages(), nums = list.map(p => all.indexOf(p) + 1);
  try {
    toast("Generando PDF…", 10000);
    await O.api.exportPages(list, `${O.api.piece().title} (hojas ${nums.length > 3 ? nums[0] + "-" + nums[nums.length - 1] : nums.join(",")})`);
    toast("PDF exportado");
  } catch (e) { toast("No se pudo exportar: " + (e?.message || e)); }
}
async function newPieceFromSel() {
  const list = selPages();
  if (!list.length) return;
  const piece = O.api.piece();
  const sug = await suggestTitleFor(piece, list);
  const box = el("div", {},
    el("div", { class: "field" }, el("label", { text: "Título de la pieza nueva" }), el("input", { type: "text", id: "npTitle", class: "full", value: sug || `${piece.title} (parte)` })),
    el("div", { class: "field" }, el("label", { text: "Etiquetas (separadas por comas)" }), el("input", { type: "text", id: "npTags", class: "full", value: (piece.tags || []).join(", ") })),
    el("label", { class: "check" }, el("input", { type: "checkbox", id: "npRemove" }), ` Quitar estas ${list.length} hoja(s) de «${piece.title}»`),
    el("p", { class: "muted small", text: "La pieza nueva guarda solo sus páginas (un PDF propio y ligero) con todo lo que hayas anotado encima." }));
  const r = await dialog({ title: `Nueva pieza con ${list.length} hoja(s)`, body: box, buttons: [{ label: "Cancelar", value: null }, { label: "Crear pieza", primary: true, value: c => ({ t: c.querySelector("#npTitle").value.trim(), g: c.querySelector("#npTags").value, rm: c.querySelector("#npRemove").checked }) }] });
  if (!r) return;
  try {
    toast("Creando la pieza…", 20000);
    await O.api.saveNow();
    const np = await createPieceFromPages(piece, list, { title: r.t || sug || piece.title, tags: tagList(r.g) });
    if (r.rm && list.length < pages().length) {
      const ids = new Set(list.map(p => p.id));
      O.api.commitPages(pgs => { for (let i = pgs.length - 1; i >= 0; i--) if (ids.has(pgs[i].id)) pgs.splice(i, 1); });
      O.sel.clear();
    }
    render();
    const go = await dialog({ title: "Pieza creada", body: el("p", { text: `«${np.title}» ya está en la biblioteca con ${np.pages.length} hoja(s).` }), buttons: [{ label: "Seguir aquí", value: false }, { label: "Abrir la pieza nueva", primary: true, value: true }] });
    if (go) { const api = O.api; await closeOrganizer(); api.openPiece(np.id); }
  } catch (e) { console.error(e); toast("No se pudo crear: " + (e?.message || e), 6000); }
}
const tagList = (s) => String(s || "").split(",").map(x => x.trim()).filter(Boolean).slice(0, 30);

function actionsBar() {
  const ns = O.sel.size, none = !ns;
  const b = (text, fn, title, cls = "") => el("button", { class: "btn small " + cls, type: "button", text, title, disabled: none, onclick: fn });
  return el("div", { class: "toolbar org-tools" },
    el("div", { class: "group" },
      el("button", { class: "btn small", type: "button", text: ns === pages().length ? "Ninguna" : "Todas", onclick: () => { if (O.sel.size === pages().length) O.sel.clear(); else pages().forEach(p => O.sel.add(p.id)); render(); } }),
      el("span", { class: "muted small", text: ns ? `${ns} seleccionada(s)` : "Toca hojas para seleccionarlas (Mayús = rango)" })),
    el("div", { class: "group" },
      el("button", { class: "btn small", type: "button", text: "+ Vertical", title: "Hoja en blanco vertical (detrás de la selección o al final)", onclick: () => addBlank("v") }),
      el("button", { class: "btn small", type: "button", text: "+ Horizontal", title: "Hoja en blanco horizontal (detrás de la selección o al final)", onclick: () => addBlank("h") })),
    el("div", { class: "group" },
      b("◀ Antes", () => shift(-1), "Mover una posición hacia delante"),
      b("Después ▶", () => shift(1), "Mover una posición hacia atrás"),
      b("Duplicar", dupSel, "Duplicar las hojas seleccionadas"),
      b("⟳ Girar", rotSel, "Girar hojas en blanco vacías (vertical ↔ horizontal)"),
      b("Eliminar", delSel, "Eliminar las hojas seleccionadas (Supr)", "danger")),
    el("div", { class: "group" },
      b("Nueva pieza con estas…", newPieceFromSel, "Crear una pieza independiente con las hojas seleccionadas"),
      b("Exportar PDF de estas", exportSel, "Descargar un PDF solo con las hojas seleccionadas")),
    el("div", { class: "org-waste", id: "orgWaste" }));
}

async function showWaste() {
  const box = O?.root.querySelector("#orgWaste"); if (!box) return;
  const w = await wasteInfo(O.api.piece());
  if (!O || !w.unused) return;
  box.innerHTML = "";
  if (w.shared) {
    box.append(el("span", { class: "muted small", text: `El PDF original tiene ${w.unused} página(s) que esta pieza ya no usa, pero lo comparte con otra pieza (por ejemplo una duplicada).` }));
    return;
  }
  box.append(el("span", { class: "muted small", text: `💾 El PDF guardado de esta pieza tiene ${w.unused} página(s) que ya no usa (ahora ocupa ${w.bytes < 1048576 ? Math.max(1, Math.round(w.bytes / 1024)) + " KB" : (w.bytes / 1048576).toFixed(1) + " MB"}).` }),
    el("button", { class: "btn small", type: "button", text: "Liberar espacio", onclick: async () => {
      if (!(await confirmDialog("Liberar espacio", "Se rehace el PDF de esta pieza solo con las páginas que usa y se borran las que sobran. Lo que ves no cambia. Después no se podrá deshacer lo anterior (el historial de deshacer se vacía). ¿Seguir?", "Liberar espacio"))) return;
      try {
        toast("Rehaciendo el PDF…", 20000);
        await O.api.saveNow();
        const np = await compactPiece(O.api.piece());
        O.api.replacePiece(np);
        toast(`Hecho: quitadas ${w.unused} página(s) que no se usaban`);
        render();
      } catch (e) { console.error(e); toast("No se pudo: " + (e?.message || e), 6000); }
    } }));
}

/* ================= Dividir en piezas ================= */
function segments() {
  const segs = []; let cur = null;
  pages().forEach((p, i) => { if (i === 0 || O.cuts.has(p.id)) { cur = { first: p, pages: [] }; segs.push(cur); } cur.pages.push(p); });
  return segs;
}
function splitPanel() {
  const piece = O.api.piece();
  const segs = segments();
  const list = el("div", { class: "split-list" });
  segs.forEach((s, i) => {
    const all = pages(), a = all.indexOf(s.first) + 1, b = a + s.pages.length - 1;
    const inp = el("input", { type: "text", class: "full", value: O.titles.get(s.first.id) ?? "", placeholder: `${piece.title} ${i + 1}` });
    inp.addEventListener("input", () => O.titles.set(s.first.id, inp.value));
    if (!O.titles.has(s.first.id)) {
      O.titles.set(s.first.id, "");
      suggestTitleFor(piece, s.pages).then(t => { if (t && O && !O.titles.get(s.first.id)) { O.titles.set(s.first.id, t); inp.value = t; } });
    }
    list.append(el("div", { class: "split-row" }, el("span", { class: "muted small", text: `Pieza ${i + 1} · ${a === b ? "hoja " + a : `hojas ${a}–${b}`}` }), inp));
  });
  const tags = el("input", { type: "text", class: "full", id: "spTags", value: O.splitTags ?? piece.title, placeholder: "Ej: Recopilación verano" });
  tags.addEventListener("input", () => { O.splitTags = tags.value; });
  const del = el("input", { type: "checkbox", id: "spDel" });
  return el("div", { class: "split-panel" },
    el("p", { text: "Toca la primera hoja de cada pieza para marcar «aquí empieza» (✂). Los títulos salen del texto más grande de la hoja cuando el PDF lo tiene; puedes cambiarlos." }),
    el("div", { class: "row" },
      el("button", { class: "btn small", type: "button", text: "Cada hoja, una pieza", onclick: () => { pages().forEach((p, i) => { if (i) O.cuts.add(p.id); }); render(); } }),
      el("button", { class: "btn small", type: "button", text: "Quitar todas las marcas", onclick: () => { O.cuts.clear(); render(); } })),
    list,
    el("div", { class: "field" }, el("label", { text: "Etiquetas para todas las piezas nuevas" }), tags),
    el("label", { class: "check" }, del, ` Borrar «${piece.title}» cuando estén creadas (las piezas nuevas ya tienen sus páginas)`),
    el("div", { class: "row" }, el("button", { class: "btn primary", type: "button", text: `Crear ${segs.length} pieza(s)`, onclick: () => doSplit(segs, tagList(tags.value), del.checked) })));
}
async function doSplit(segs, tags, delOriginal) {
  const piece = O.api.piece();
  if (segs.length < 2 && !(await confirmDialog("Una sola pieza", "No has marcado dónde empieza cada pieza: se creará una sola copia con todas las hojas. ¿Seguir?", "Crear"))) return;
  try {
    await O.api.saveNow();
    const made = [];
    for (let i = 0; i < segs.length; i++) {
      toast(`Creando pieza ${i + 1} de ${segs.length}…`, 30000);
      const t = (O.titles.get(segs[i].first.id) || "").trim() || `${piece.title} ${i + 1}`;
      made.push(await createPieceFromPages(piece, segs[i].pages, { title: t, tags }));
    }
    toast(`${made.length} pieza(s) creadas`, 4000);
    if (delOriginal) {
      if (await confirmDialog("Borrar la recopilación", `Ya están creadas las ${made.length} piezas. ¿Borrar ahora «${piece.title}»? Si no tienes copia de seguridad, no se podrá recuperar.`, "Borrar", true)) {
        const api = O.api; await closeOrganizer();
        await api.discardAndClose(async () => { await deletePiece(piece); });
        toast(`Recopilación borrada · ${made.length} pieza(s) nuevas en la biblioteca`, 5000);
        return;
      }
    }
    const api = O.api;
    const go = await dialog({ title: "Piezas creadas", body: el("p", { text: `Se han creado ${made.length} pieza(s) en la biblioteca. «${piece.title}» sigue como estaba.` }), buttons: [{ label: "Seguir aquí", value: false }, { label: "Ir a la biblioteca", primary: true, value: true }] });
    if (go) { await closeOrganizer(); api.close(); }
  } catch (e) { console.error(e); toast("No se pudo dividir: " + (e?.message || e), 6000); }
}
