// Editor de una pieza: vista continua de páginas, objetos, selección múltiple, portapapeles e historial
import { $, $$, el, svg, uid, clone, debounce, clamp, toast, dialog, promptDialog, openUrl, normalizeUrl, isHttpUrl } from "./util.js";
import { dbPut, bumpChanges, getSettings, saveSettings } from "./db.js";
import { getPdfDoc, renderToCanvas } from "./pdfjs.js";
import { renderObj, objBox, moveObj, resizeObj, simplify, styleOf, setClipResolver, setImageResolver, cropToZone, boxInside, boxesTouch, pageToHole, interBox, isVcut } from "./objects.js";
import { storeImage, imageUrl, imageObj } from "./images.js";
import { openOrganizer, closeOrganizer, organizerOpen } from "./organizer.js";
import { pieceThumb } from "./thumbs.js";
import { clipUrl } from "./clips.js";
import { chordLibrary, chordPreviewSvg, openChordEditor, saveChordToLibrary, isCustomChord, deleteChordFromLibrary, loadChordLibrary } from "./chords.js";
import { blankPage, blankPageOriented, pagePdfId } from "./model.js";
import { exportPiecePdf } from "./exportpdf.js";
import { nearestTabLine } from "./vector.js";
import { staffDialog, emptyChordsFor, defaultStaff, neckDialog, defaultNeck, chordRowDialog, buildChordRow, templateDialog, templateObjs, buildNeckPanel } from "./tools3.js";

setClipResolver(clipUrl);
setImageResolver(imageUrl);
const MARK = "⟦partituras⟧"; // marca que se deja en el portapapeles del sistema al copiar dentro de la app

const S = {
  piece: null, settings: null, zoom: 1, fitMode: true, tool: "select", pending: null,
  sel: null,            // { pageId, ids: Set }
  zone: null,           // { pageId, x, y, w, h } — zona marcada con la herramienta «Zona»
  drag: null, draw: null, lastPress: null, inline: null,
  undo: [], redo: [], locked: false,
  pageEls: new Map(),   // pageId -> { div, canvas, svgEl, objLayer, tmpLayer, selLayer, ... }
  observer: null, onClose: null, opts: {}, noSave: false, pastedAt: 0,
};
let clipboard = null;   // { objs, pageId, pieceId } — se conserva al cambiar de pieza
const HISTORY_MAX = 120;
const TOOLS_DRAW = ["line", "arrow", "rect", "ellipse"];

/* ================= Apertura / cierre ================= */
export async function openEditor(piece, onClose, opts = {}) {
  S.piece = piece; S.onClose = onClose; S.opts = opts; S.noSave = false;
  S.settings = await getSettings();
  S.undo = []; S.redo = []; S.sel = null; S.zone = null; S.pending = null; S.locked = false;
  await loadChordLibrary();
  syncToolInputs();
  setTool("select");
  setLocked(false);
  $("#edTitle").textContent = piece.title;
  setSaveState("");
  buildPages();
  requestAnimationFrame(() => fitZoom());
  updateHistoryButtons();
  updateSelUi();
  if (opts.organizer) setTimeout(() => openPagesOrganizer(opts.organizer), 50);
}

export async function closeEditor() {
  await closeOrganizer();
  finishInline(true);
  saveDeb.flush();
  await saving;
  // portada actualizada si se ha cambiado algo (también en piezas en blanco con plantilla)
  if (S.piece && S.undo.length && !S.noSave) {
    try { S.piece.thumb = await pieceThumb(S.piece); await dbPut("pieces", S.piece); } catch (e) { console.warn("portada", e); }
  }
  if (S.observer) S.observer.disconnect();
  for (const pe of S.pageEls.values()) { try { pe.task?.cancel(); } catch { /* nada */ } }
  S.pageEls.clear();
  $("#pages").innerHTML = "";
  $("#chordPanel").hidden = true;
  const p = S.piece; S.piece = null;
  return p;
}
export function editorActive() { return Boolean(S.piece); }

/* ================= Guardado automático ================= */
function setSaveState(t) { $("#edSave").textContent = t; }
let saving = Promise.resolve();
function doSave() {
  if (!S.piece || S.noSave) return saving;
  const piece = S.piece;
  piece.updatedAt = Date.now();
  saving = saving.then(async () => {
    try {
      await dbPut("pieces", piece);
      await bumpChanges(1);
      setSaveState("Guardado ✓");
    } catch (e) {
      console.error(e);
      setSaveState("⚠ No se pudo guardar");
      toast("No se pudo guardar: " + (e?.message || e));
    }
  });
  return saving;
}
const saveDeb = debounce(doSave, 700);
function changed() { setSaveState("Guardando…"); saveDeb(); }

/* ================= Páginas ================= */
function pageById(id) { return S.piece.pages.find(p => p.id === id); }
function pageIndex(id) { return S.piece.pages.findIndex(p => p.id === id); }

function buildPages() {
  const host = $("#pages");
  host.innerHTML = "";
  if (S.observer) S.observer.disconnect();
  S.pageEls.clear();
  S.observer = new IntersectionObserver(entries => {
    for (const e of entries) {
      const pe = [...S.pageEls.values()].find(x => x.div === e.target);
      if (!pe) continue;
      pe.visible = e.isIntersecting;
      if (e.isIntersecting) scheduleRender(pe);
    }
  }, { rootMargin: "900px 0px" });

  const n = S.piece.pages.length;
  S.piece.pages.forEach((pg, i) => {
    const div = el("div", { class: "page", "data-page": pg.id });
    const canvas = el("canvas", { class: "page-canvas" });
    const svgEl = svg("svg", { class: "page-svg", viewBox: `0 0 ${pg.w} ${pg.h}`, preserveAspectRatio: "none" });
    const objLayer = svg("g", { class: "obj-layer" });
    const tmpLayer = svg("g", { class: "tmp-layer" });
    const selLayer = svg("g", { class: "sel-layer" });
    const baseLayer = svg("g", { class: "base-holes" }); // huecos cortados del fondo PDF
    const zoneLayer = svg("g", { class: "zone-layer" });
    svgEl.append(baseLayer, objLayer, selLayer, zoneLayer, tmpLayer);
    if (pg.src.kind === "pdf") div.append(canvas);
    const foot = el("div", { class: "page-foot" },
      el("span", { class: "muted small", text: `Hoja ${i + 1} de ${n}` }),
      el("button", { class: "btn small edit-only", type: "button", text: "+ Hoja vertical", title: "Añadir una hoja en blanco vertical debajo", onclick: () => addBlankAfter(pg.id, "v") }),
      el("button", { class: "btn small edit-only", type: "button", text: "+ Hoja horizontal", title: "Añadir una hoja en blanco horizontal debajo", onclick: () => addBlankAfter(pg.id, "h") }),
      el("button", { class: "btn small edit-only", type: "button", text: "+ Plantilla…", title: "Añadir debajo una hoja con tablatura, pentagrama, diagramas o mástiles en blanco", onclick: () => addTemplateAfter(pg.id) }),
      el("button", { class: "btn small danger edit-only", type: "button", text: "Eliminar hoja", onclick: () => deletePage(pg.id) }));
    div.append(svgEl, foot);
    host.append(div);
    const pe = { pageId: pg.id, div, canvas, svgEl, baseLayer, objLayer, tmpLayer, selLayer, zoneLayer, renderedZoom: 0, task: null, visible: false };
    S.pageEls.set(pg.id, pe);
    attachPageEvents(pe);
    renderPageObjs(pg.id);
    S.observer.observe(div);
  });
  applyZoomSizes();
}

function addBlankAfter(pageId, orient = "v") {
  const i = pageIndex(pageId);
  const np = blankPageOriented(orient);
  commitPages(pages => pages.splice(i + 1, 0, np));
  requestAnimationFrame(() => S.pageEls.get(np.id)?.div.scrollIntoView({ behavior: "smooth", block: "start" }));
  toast(`Hoja ${orient === "h" ? "horizontal" : "vertical"} añadida (Ctrl+Z para deshacer)`);
}
async function addTemplateAfter(pageId) {
  const r = await templateDialog();
  if (!r) return;
  const i = pageIndex(pageId);
  const np = blankPageOriented(r.orient);
  np.objs = templateObjs(r.kind, np, { title: r.head });
  commitPages(pages => pages.splice(i + 1, 0, np));
  requestAnimationFrame(() => S.pageEls.get(np.id)?.div.scrollIntoView({ behavior: "smooth", block: "start" }));
  toast("Hoja con plantilla añadida (Ctrl+Z para deshacer)");
}
function deletePage(pageId) {
  if (S.piece.pages.length <= 1) { toast("Una pieza necesita al menos una hoja."); return; }
  const i = pageIndex(pageId);
  commitPages(pages => pages.splice(i, 1));
  toast(`Hoja ${i + 1} eliminada (Ctrl+Z para deshacer)`);
}

function applyZoomSizes() {
  for (const pe of S.pageEls.values()) {
    const pg = pageById(pe.pageId);
    pe.div.style.width = `${pg.w * S.zoom}px`;
    pe.div.style.height = `${pg.h * S.zoom}px`;
  }
  $("#zoomLabel").textContent = `${Math.round(S.zoom * 100 / (96 / 72))}%`;
  refreshSelection(); drawZone();
  rerenderVisibleDeb();
}

const rerenderVisibleDeb = debounce(() => {
  for (const pe of S.pageEls.values()) if (pe.visible) scheduleRender(pe);
}, 180);

let renderChain = Promise.resolve();
function scheduleRender(pe) {
  const pg = pageById(pe.pageId);
  if (!pg || pg.src.kind !== "pdf") return;
  if (Math.abs(pe.renderedZoom - S.zoom) < 0.001 || pe.pendingZoom === S.zoom) return;
  pe.pendingZoom = S.zoom;
  renderChain = renderChain.then(() => renderPageCanvas(pe)).catch(err => console.error("Render", err));
}
async function renderPageCanvas(pe) {
  if (!S.piece || !S.pageEls.has(pe.pageId) || S.pageEls.get(pe.pageId) !== pe) return;
  const pg = pageById(pe.pageId);
  const zoom = S.zoom;
  const dpr = window.devicePixelRatio || 1;
  let scale = zoom * dpr;
  scale = Math.min(scale, 5000 / pg.w, Math.sqrt(22e6 / (pg.w * pg.h)));
  const doc = await getPdfDoc(pagePdfId(S.piece, pg));
  const page = await doc.getPage(pg.src.index + 1);
  const off = document.createElement("canvas");
  const task = await renderToCanvas(page, off, scale);
  pe.task = task;
  try { await task.promise; } catch (e) { if (e?.name === "RenderingCancelledException") return; throw e; }
  pe.task = null;
  if (S.pageEls.get(pe.pageId) !== pe) return;
  pe.canvas.width = off.width; pe.canvas.height = off.height;
  pe.canvas.getContext("2d").drawImage(off, 0, 0);
  pe.renderedZoom = zoom;
  pe.pendingZoom = null;
  off.width = off.height = 0;
}

/* ================= Zoom ================= */
function fitZoom() {
  if (!S.piece) return;
  const host = $("#pages");
  const maxW = Math.max(...S.piece.pages.map(p => p.w), 100);
  const avail = Math.max(200, host.clientWidth - 32);
  S.zoom = clamp(avail / maxW, 0.3, 1.7); // en pantallas anchas no se hace gigante
  S.fitMode = true;
  applyZoomSizes();
}
function setZoom(z, anchorEvt) {
  const old = S.zoom;
  const nz = clamp(z, 0.3, 6);
  if (Math.abs(nz - old) < 0.0001) return;
  const cy = anchorEvt ? anchorEvt.clientY : window.innerHeight / 2;
  const docY = window.scrollY + cy;
  const topOfPages = $("#pages").getBoundingClientRect().top + window.scrollY;
  S.zoom = nz; S.fitMode = false;
  applyZoomSizes();
  window.scrollTo({ top: topOfPages + (docY - topOfPages) * (nz / old) - cy });
}
window.addEventListener("resize", debounce(() => { if (S.piece && S.fitMode) fitZoom(); }, 150));

/* ================= Objetos ================= */
function renderPageObjs(pageId) {
  const pe = S.pageEls.get(pageId), pg = pageById(pageId);
  if (!pe || !pg) return;
  pe.objLayer.innerHTML = "";
  for (const o of pg.objs) pe.objLayer.append(renderObj(o));
  pe.baseLayer.innerHTML = "";
  for (const h of pg.holes || []) pe.baseLayer.append(svg("rect", { x: h.x, y: h.y, width: h.w, height: h.h, fill: "#fff" }));
  if (S.sel?.pageId === pageId) refreshSelection();
}
function gOf(pageId, oid) { return S.pageEls.get(pageId)?.objLayer.querySelector(`[data-oid="${oid}"]`); }
function rerenderObj(pageId, o) {
  const pe = S.pageEls.get(pageId);
  const old = gOf(pageId, o.id);
  const n = renderObj(o);
  if (old) old.replaceWith(n); else pe.objLayer.append(n);
}
function findObj(pageId, oid) { return pageById(pageId)?.objs.find(o => o.id === oid); }
function boxOf(pageId, o) { return objBox(o, gOf(pageId, o.id)); }
function unionBox(boxes) {
  const x = Math.min(...boxes.map(b => b.x)), y = Math.min(...boxes.map(b => b.y));
  return { x, y, w: Math.max(...boxes.map(b => b.x + b.w)) - x, h: Math.max(...boxes.map(b => b.y + b.h)) - y };
}

/* ---------- Historial (por pieza; una acción puede tocar varias hojas) ---------- */
function commit(pageIds, mutate, { key = null } = {}) {
  const ids = Array.isArray(pageIds) ? pageIds : [pageIds];
  const snap = (id) => { const pg = pageById(id); return clone({ objs: pg.objs, holes: pg.holes || [] }); };
  const before = {};
  for (const id of ids) before[id] = snap(id);
  mutate(...ids.map(id => pageById(id).objs));
  for (const id of ids) { const pg = pageById(id); if (pg.holes && !pg.holes.length) delete pg.holes; }
  const after = {};
  let same = true;
  for (const id of ids) { after[id] = snap(id); if (JSON.stringify(after[id]) !== JSON.stringify(before[id])) same = false; }
  if (same) return;
  const last = S.undo[S.undo.length - 1];
  const now = Date.now();
  if (key && last && last.key === key && now - last.time < 1500) {
    // cambios seguidos de estilo se agrupan en un solo paso de deshacer
    Object.assign(last.after, after); last.time = now;
  } else {
    S.undo.push({ kind: "objs", before, after, key, time: now });
    if (S.undo.length > HISTORY_MAX) S.undo.shift();
  }
  S.redo = [];
  for (const id of ids) renderPageObjs(id);
  updateHistoryButtons();
  changed();
}
function commitPages(mutate) {
  const before = clone(S.piece.pages);
  mutate(S.piece.pages);
  S.undo.push({ kind: "pages", before, after: clone(S.piece.pages), time: Date.now() });
  if (S.undo.length > HISTORY_MAX) S.undo.shift();
  S.redo = [];
  clearSel();
  buildPages();
  updateHistoryButtons();
  changed();
}
function applyHistory(entry, dir) {
  const state = dir === "undo" ? entry.before : entry.after;
  if (entry.kind === "objs") {
    let first = null;
    for (const [pid, objs] of Object.entries(state)) {
      const pg = pageById(pid); if (!pg) continue;
      pg.objs = clone(objs.objs);
      if (objs.holes?.length) pg.holes = clone(objs.holes); else delete pg.holes;
      renderPageObjs(pid);
      first = first || pid;
    }
    if (S.sel) { S.sel.ids = new Set([...S.sel.ids].filter(id => findObj(S.sel.pageId, id))); if (!S.sel.ids.size) clearSel(); else refreshSelection(); }
    if (first) scrollToPageIfHidden(first);
  } else {
    S.piece.pages = clone(state);
    clearSel();
    buildPages();
  }
  updateSelUi();
  changed();
}
function undo() { const e = S.undo.pop(); if (!e) return; applyHistory(e, "undo"); S.redo.push(e); updateHistoryButtons(); }
function redo() { const e = S.redo.pop(); if (!e) return; applyHistory(e, "redo"); S.undo.push(e); updateHistoryButtons(); }
function updateHistoryButtons() { $("#undoBtn").disabled = !S.undo.length; $("#redoBtn").disabled = !S.redo.length; }
function scrollToPageIfHidden(pageId) {
  const pe = S.pageEls.get(pageId); if (!pe) return;
  const r = pe.div.getBoundingClientRect();
  if (r.bottom < 60 || r.top > window.innerHeight) pe.div.scrollIntoView({ block: "center" });
}

/* ---------- Selección ---------- */
function selObjs() { return S.sel ? [...S.sel.ids].map(id => findObj(S.sel.pageId, id)).filter(Boolean) : []; }
function single() { const a = selObjs(); return a.length === 1 ? a[0] : null; }
function select(pageId, ids, add = false) {
  if (S.zone) clearZone(false);
  const arr = Array.isArray(ids) ? ids : [ids];
  if (add && S.sel && S.sel.pageId === pageId) arr.forEach(id => S.sel.ids.add(id));
  else S.sel = { pageId, ids: new Set(arr) };
  if (!S.sel.ids.size) S.sel = null;
  refreshSelection(); updateSelUi();
}
function toggleSel(pageId, id) {
  if (!S.sel || S.sel.pageId !== pageId) { select(pageId, id); return; }
  if (S.sel.ids.has(id)) S.sel.ids.delete(id); else S.sel.ids.add(id);
  if (!S.sel.ids.size) S.sel = null;
  refreshSelection(); updateSelUi();
}
function clearSel() {
  for (const pe of S.pageEls.values()) pe.selLayer.innerHTML = "";
  S.sel = null; updateSelUi();
}
function refreshSelection() {
  for (const pe of S.pageEls.values()) pe.selLayer.innerHTML = "";
  const objs = selObjs();
  if (!objs.length) return;
  const pe = S.pageEls.get(S.sel.pageId);
  if (!pe) return;
  const z = S.zoom, pad = 3 / z;
  const dash = `${5 / z} ${4 / z}`;
  for (const o of objs) {
    const b = boxOf(S.sel.pageId, o);
    pe.selLayer.append(svg("rect", { class: "sel-rect", x: b.x - pad, y: b.y - pad, width: b.w + pad * 2, height: b.h + pad * 2, "stroke-width": 1.5 / z, "stroke-dasharray": dash }));
  }
  const o = single();
  if (o && !(o.crop && isVcut(o))) { // un trozo de pauta o mástil no se redimensiona (se descuadraría)
    const b = boxOf(S.sel.pageId, o);
    const hx = o.t === "line" ? o.x2 : b.x + b.w + pad, hy = o.t === "line" ? o.y2 : b.y + b.h + pad;
    pe.selLayer.append(svg("circle", { class: "sel-handle", cx: hx, cy: hy, r: 7 / z, "stroke-width": 1.5 / z, "data-handle": "1" }));
  }
}
function updateSelUi() {
  const objs = selObjs(), o = objs.length === 1 ? objs[0] : null;
  $("#ctxBar .sel-actions").hidden = !objs.length;
  $("#zoneActions").hidden = !S.zone;
  $("#ctxBar").hidden = !objs.length && !clipboard && !S.zone;
  $("#selCount").textContent = objs.length > 1 ? `${objs.length} elementos` : "";
  $("#selEdit").hidden = !o || !["text", "chord", "loop", "finger", "staff", "neck"].includes(o.t);
  $("#btnPaste").hidden = !clipboard || !!S.zone;
  // los controles de estilo muestran los valores del elemento seleccionado
  const st = o ? styleOf(o) : null;
  $("#setFont").value = st?.font ?? S.settings.fontSize;
  $("#setLine").value = st?.width ?? S.settings.lineWidth;
  $("#setColor").value = st?.color ?? S.settings.color;
  $("#setPatch").value = st?.fill ?? S.settings.patchColor;
  $("#setEraser").value = st?.eraser ?? S.settings.eraserSize;
}

/* ================= Herramientas ================= */
function setTool(t) {
  S.tool = t;
  $$("#edTools [data-tool]").forEach(b => b.classList.toggle("active", b.dataset.tool === t));
  $("#pages").dataset.tool = t;
  for (const pe of S.pageEls.values()) pe.tmpLayer.innerHTML = "";
  if (t !== "zone" && S.zone) clearZone();
  if (t !== "select") clearSel(); // al entrar en «Zona» se suelta lo seleccionado: así el primer arrastre marca la zona
  if (t === "zone") toast("Zona: marca un rectángulo y arrástralo para moverlo (Ctrl = copia). Ctrl+C, Ctrl+X o Supr también valen.", 4500);
}
function setPending(p, msg) {
  S.pending = p;
  $("#pages").dataset.tool = "place";
  if (msg) toast(msg);
}
function clearPending() { S.pending = null; $("#pages").dataset.tool = S.tool; }

function setLocked(v) {
  S.locked = v;
  document.body.classList.toggle("locked", v);
  $("#lockBtn").textContent = v ? "🔒 Solo ver" : "🔓 Editando";
  $("#lockBtn").classList.toggle("active", v);
  if (v) { finishInline(true); clearSel(); clearPending(); $("#chordPanel").hidden = true; }
}

function syncToolInputs() { updateSelUi(); }
const persistSettings = debounce(() => saveSettings(S.settings), 400);

/* ================= Eventos de página ================= */
function svgPoint(svgEl, evt) {
  const p = svgEl.createSVGPoint(); p.x = evt.clientX; p.y = evt.clientY;
  const m = svgEl.getScreenCTM();
  return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 };
}
function objIdFromTarget(t) {
  const g = t?.closest?.("[data-oid]");
  return g ? g.dataset.oid : null;
}
function pageElAt(clientX, clientY) {
  for (const n of document.elementsFromPoint(clientX, clientY)) {
    const d = n.closest?.(".page");
    if (d) return [...S.pageEls.values()].find(pe => pe.div === d) || null;
  }
  return null;
}

function attachPageEvents(pe) {
  const s = pe.svgEl;
  s.addEventListener("pointerdown", (evt) => onDown(pe, evt));
  s.addEventListener("pointermove", (evt) => onMove(pe, evt));
  s.addEventListener("pointerup", (evt) => onUp(pe, evt));
  s.addEventListener("pointercancel", () => cancelDrag());
  s.addEventListener("pointerleave", () => { if (S.tool === "eraser" && !S.draw) pe.tmpLayer.innerHTML = ""; });
}

function onDown(pe, evt) {
  if (!S.piece || evt.button > 0) return;
  const p = svgPoint(pe.svgEl, evt);
  const oid = objIdFromTarget(evt.target);

  if (S.locked) {
    if (oid) { const o = findObj(pe.pageId, oid); if (o?.t === "loop") { openLoop(o); evt.preventDefault(); } }
    return;
  }
  if (S.inline) finishInline(true);
  evt.preventDefault();

  if (S.pending) { placePending(pe.pageId, p); return; }

  if (S.tool === "select") {
    if (evt.target.dataset?.handle && single()) {
      const o = single();
      S.drag = { type: "resize", pageId: pe.pageId, start: p, orig: clone(o), box0: boxOf(pe.pageId, o) };
      pe.svgEl.setPointerCapture(evt.pointerId);
      return;
    }
    // Alt+clic: selecciona lo que hay DEBAJO (cada Alt+clic baja una capa); útil con trozos superpuestos
    if (evt.altKey && oid) {
      const stack = [];
      for (const n of document.elementsFromPoint(evt.clientX, evt.clientY)) {
        const id = objIdFromTarget(n);
        if (id && !stack.includes(id) && n.closest(".page") === pe.div) stack.push(id);
      }
      const cur = S.sel?.pageId === pe.pageId && S.sel.ids.size === 1 ? [...S.sel.ids][0] : null;
      const i = stack.indexOf(cur);
      const next = stack[(i + 1) % stack.length];
      select(pe.pageId, next);
      toast(stack.length > 1 ? `Capa ${stack.indexOf(next) + 1} de ${stack.length} en ese punto (Alt+clic otra vez para la siguiente)` : "Ahí solo hay un elemento");
      return;
    }
    if (oid) {
      const o = findObj(pe.pageId, oid);
      if ((evt.ctrlKey || evt.metaKey) && o.t === "loop") { openLoop(o); return; }
      if (evt.shiftKey) { toggleSel(pe.pageId, oid); if (!S.sel?.ids.has(oid)) return; }
      else {
        const lp = S.lastPress;
        const dbl = lp && lp.oid === oid && performance.now() - lp.time < 450 && Math.hypot(evt.clientX - lp.x, evt.clientY - lp.y) < 8;
        if (dbl) { S.lastPress = null; select(pe.pageId, oid); editObject(pe.pageId, o); return; }
        if (!(S.sel && S.sel.pageId === pe.pageId && S.sel.ids.has(oid))) select(pe.pageId, oid);
        S.lastPress = { oid, time: performance.now(), x: evt.clientX, y: evt.clientY };
      }
      startMove(pe, p, evt);
      return;
    }
    // vacío: recuadro de selección
    if (!evt.shiftKey) clearSel();
    S.draw = { type: "marquee", pageId: pe.pageId, start: p, add: evt.shiftKey };
    pe.svgEl.setPointerCapture(evt.pointerId);
    return;
  }

  if (S.tool === "zone") {
    const z = S.zone;
    if (z && z.pageId === pe.pageId && p.x >= z.x && p.x <= z.x + z.w && p.y >= z.y && p.y <= z.y + z.h) { startZoneMove(pe, p, evt); return; }
    // lo que acabas de mover sigue seleccionado: se puede reajustar sin cambiar de herramienta
    if (oid && S.sel?.pageId === pe.pageId && S.sel.ids.has(oid)) { startMove(pe, p, evt); return; }
    clearZone(); if (S.sel) clearSel();
    S.draw = { type: "zonebox", pageId: pe.pageId, start: p };
    pe.svgEl.setPointerCapture(evt.pointerId);
    return;
  }
  if (S.tool === "tabnum") {
    const hitO = oid ? findObj(pe.pageId, oid) : null;
    if (hitO?.t === "text" && hitO.tab) { select(pe.pageId, hitO.id); startMove(pe, p, evt); S.drag.tabEdit = hitO; return; }
    const pg = pageById(pe.pageId);
    let line = null;
    for (let i = pg.objs.length - 1; i >= 0 && !line; i--) line = nearestTabLine(pg.objs[i], p);
    if (!line) { toast("Toca sobre una línea de tablatura (si no hay, ponla con «Pauta»)."); return; }
    const o = { id: uid("o"), t: "text", tab: 1, x: r2(p.x), y: r2(line.y), size: Math.round(line.gap * 1.25 * 10) / 10, text: "", color: S.settings.color, font: "sans", bold: false };
    startInline(pe.pageId, o, true);
    return;
  }
  if (S.tool === "text") {
    const o = { id: uid("o"), t: "text", x: p.x, y: p.y + S.settings.fontSize * 0.35, size: S.settings.fontSize, text: "", color: S.settings.color, font: "sans", bold: true };
    startInline(pe.pageId, o, true);
    return;
  }
  if (S.tool === "pen" || S.tool === "eraser") {
    const eraser = S.tool === "eraser";
    const o = { id: uid("o"), t: "path", pts: [[r2(p.x), r2(p.y)]], w: eraser ? S.settings.eraserSize : S.settings.lineWidth, color: eraser ? S.settings.patchColor : S.settings.color, kind: eraser ? "eraser" : "pen" };
    S.draw = { type: "path", pageId: pe.pageId, o };
    pe.tmpLayer.innerHTML = ""; pe.tmpLayer.append(renderObj(o));
    pe.svgEl.setPointerCapture(evt.pointerId);
    return;
  }
  if (TOOLS_DRAW.includes(S.tool)) {
    let o;
    const st = S.settings;
    if (S.tool === "line" || S.tool === "arrow") o = { id: uid("o"), t: "line", x1: p.x, y1: p.y, x2: p.x, y2: p.y, w: st.lineWidth, color: st.color, arrow: S.tool === "arrow" ? 1 : 0 };
    else if (S.tool === "rect") o = { id: uid("o"), t: "rect", x: p.x, y: p.y, w: 0.5, h: 0.5, fill: st.patchColor };
    else o = { id: uid("o"), t: "ellipse", x: p.x, y: p.y, w: 0.5, h: 0.5, sw: st.lineWidth, color: st.color };
    S.draw = { type: "shape", pageId: pe.pageId, o, start: p };
    drawTmp(pe, o);
    pe.svgEl.setPointerCapture(evt.pointerId);
  }
}
const r2 = v => Math.round(v * 100) / 100;

function drawTmp(pe, o) {
  pe.tmpLayer.innerHTML = "";
  if (o.t === "zone") {
    pe.tmpLayer.append(svg("rect", { class: "zone-rect", x: o.x, y: o.y, width: o.w, height: o.h, "stroke-width": 1.5 / S.zoom, "stroke-dasharray": `${6 / S.zoom} ${4 / S.zoom}` }));
  } else pe.tmpLayer.append(renderObj(o));
}

/* ---------- Mover (con guías y paso a otra hoja) ---------- */
function startMove(pe, p, evt) {
  const objs = selObjs();
  const box0 = unionBox(objs.map(o => boxOf(pe.pageId, o)));
  // líneas de referencia: bordes y centros de los demás elementos y de la hoja
  const pg = pageById(pe.pageId);
  const others = pg.objs.filter(o => !S.sel.ids.has(o.id)).map(o => boxOf(pe.pageId, o));
  const vx = [0, pg.w / 2, pg.w], vy = [0, pg.h / 2, pg.h];
  for (const b of others) { vx.push(b.x, b.x + b.w / 2, b.x + b.w); vy.push(b.y, b.y + b.h / 2, b.y + b.h); }
  S.drag = { type: "move", pageId: pe.pageId, start: p, box0, vx, vy, moved: false, dx: 0, dy: 0, client0: { x: evt.clientX, y: evt.clientY } };
  pe.svgEl.setPointerCapture(evt.pointerId);
}
function snapDelta(vals, cands, tol) {
  let best = null;
  for (const v of vals) for (const c of cands) {
    const d = c - v;
    if (Math.abs(d) <= tol && (best === null || Math.abs(d) < Math.abs(best.d))) best = { d, at: c };
  }
  return best;
}

function onMove(pe, evt) {
  if (S.drag && S.drag.pageId === pe.pageId) {
    const d = S.drag;
    const p = svgPoint(pe.svgEl, evt);
    let dx = p.x - d.start.x, dy = p.y - d.start.y;
    if (d.type === "zone") {
      if (!d.moved && Math.hypot(evt.clientX - d.client0.x, evt.clientY - d.client0.y) < 3) return;
      d.moved = true;
      if (evt.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      d.copy = d.copy || evt.ctrlKey || evt.metaKey || evt.altKey;
      d.dx = dx; d.dy = dy;
      pe.div.classList.add("dragging");
      zoneDragPreview(pe, d);
      return;
    }
    if (d.type === "move") {
      if (!d.moved && Math.hypot(evt.clientX - d.client0.x, evt.clientY - d.client0.y) < 3) return;
      d.moved = true;
      if (evt.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      pe.tmpLayer.innerHTML = "";
      if (!evt.altKey) {
        const tol = 6 / S.zoom, b = d.box0;
        const sx = snapDelta([b.x + dx, b.x + b.w / 2 + dx, b.x + b.w + dx], d.vx, tol);
        const sy = snapDelta([b.y + dy, b.y + b.h / 2 + dy, b.y + b.h + dy], d.vy, tol);
        const pg = pageById(pe.pageId);
        const guide = (x1, y1, x2, y2) => pe.tmpLayer.append(svg("line", { class: "guide", x1, y1, x2, y2, "stroke-width": 1 / S.zoom }));
        if (sx && !(evt.shiftKey && dx === 0)) { dx += sx.d; guide(sx.at, 0, sx.at, pg.h); }
        if (sy && !(evt.shiftKey && dy === 0)) { dy += sy.d; guide(0, sy.at, pg.w, sy.at); }
      }
      for (const id of S.sel.ids) gOf(pe.pageId, id)?.setAttribute("transform", `translate(${dx},${dy})`);
      pe.selLayer.setAttribute("transform", `translate(${dx},${dy})`);
      pe.div.classList.add("dragging");
      d.dx = dx; d.dy = dy;
    } else {
      const o = single(); if (!o) return;
      const tmp = clone(d.orig);
      resizeObj(tmp, d.orig, dx, dy, d.box0);
      Object.assign(o, tmp);
      rerenderObj(pe.pageId, o);
      refreshSelection();
      d.changed = true;
    }
    return;
  }
  if (S.draw && S.draw.pageId === pe.pageId) {
    const p = svgPoint(pe.svgEl, evt);
    const dr = S.draw;
    if (dr.type === "path") {
      const last = dr.o.pts[dr.o.pts.length - 1];
      if (Math.hypot(p.x - last[0], p.y - last[1]) * S.zoom >= 1.5) {
        dr.o.pts.push([r2(p.x), r2(p.y)]);
        pe.tmpLayer.innerHTML = ""; pe.tmpLayer.append(renderObj(dr.o));
      }
    } else if (dr.type === "marquee" || dr.type === "zonebox") {
      const x = Math.min(dr.start.x, p.x), y = Math.min(dr.start.y, p.y);
      dr.box = { x, y, w: Math.abs(p.x - dr.start.x), h: Math.abs(p.y - dr.start.y) };
      pe.tmpLayer.innerHTML = "";
      pe.tmpLayer.append(svg("rect", { class: dr.type === "zonebox" ? "zone-sel" : "marquee", x, y, width: dr.box.w, height: dr.box.h, "stroke-width": 1.5 / S.zoom, "stroke-dasharray": dr.type === "zonebox" ? `${6 / S.zoom} ${4 / S.zoom}` : null }));
    } else {
      const o = dr.o, a = dr.start;
      if (o.t === "line") {
        let x2 = p.x, y2 = p.y;
        if (evt.shiftKey) { if (Math.abs(x2 - a.x) > Math.abs(y2 - a.y)) y2 = a.y; else x2 = a.x; }
        o.x2 = x2; o.y2 = y2;
      } else {
        let w = Math.abs(p.x - a.x), h = Math.abs(p.y - a.y);
        if (evt.shiftKey && o.t === "ellipse") w = h = Math.max(w, h);
        o.x = p.x < a.x ? a.x - w : a.x; o.y = p.y < a.y ? a.y - h : a.y;
        o.w = Math.max(0.5, w); o.h = Math.max(0.5, h);
      }
      drawTmp(pe, o);
    }
    return;
  }
  // indicador del tamaño del borrador
  if (S.tool === "eraser" && !S.locked) {
    const p = svgPoint(pe.svgEl, evt);
    pe.tmpLayer.innerHTML = "";
    pe.tmpLayer.append(svg("circle", { class: "eraser-cursor", cx: p.x, cy: p.y, r: S.settings.eraserSize / 2, "stroke-width": 1 / S.zoom }));
  }
}

function onUp(pe, evt) {
  if (S.drag && S.drag.pageId === pe.pageId) {
    const d = S.drag; S.drag = null;
    pe.selLayer.removeAttribute("transform");
    pe.tmpLayer.innerHTML = "";
    pe.div.classList.remove("dragging");
    const objs = selObjs();
    for (const o of objs) gOf(pe.pageId, o.id)?.removeAttribute("transform");
    if (d.type === "zone") { finishZoneMove(pe, d, evt); return; }
    if (d.type === "move") {
      if (!d.moved) { if (d.tabEdit) startInline(pe.pageId, d.tabEdit, false); refreshSelection(); return; }
      S.lastPress = null;
      const target = pageElAt(evt.clientX, evt.clientY);
      if (target && target.pageId !== pe.pageId) { moveSelectionToPage(pe, target, d, evt); return; }
      if (d.dx || d.dy) {
        const ids = new Set(S.sel.ids);
        commit(pe.pageId, objsArr => objsArr.filter(o => ids.has(o.id)).forEach(o => { moveObj(o, d.dx, d.dy); if (o.tab) snapTab(pe.pageId, o); }));
      }
    } else if (d.changed) {
      const o = single();
      const final = clone(o);
      Object.assign(o, d.orig); // el historial guarda el «antes»
      commit(pe.pageId, arr => { const i = arr.findIndex(x => x.id === o.id); arr[i] = final; });
      rememberSize(final);
    }
    refreshSelection();
    return;
  }
  if (S.draw && S.draw.pageId === pe.pageId) {
    const dr = S.draw; S.draw = null;
    pe.tmpLayer.innerHTML = "";
    if (dr.type === "zonebox") {
      if (!dr.box || dr.box.w * S.zoom < 6 || dr.box.h * S.zoom < 6) return;
      const z = zoneOn(pe.pageId, dr.box);
      if (z) setZone(pe.pageId, z);
      return;
    }
    if (dr.type === "marquee") {
      if (!dr.box || dr.box.w * S.zoom < 4 || dr.box.h * S.zoom < 4) return;
      const b = dr.box;
      const hit = pageById(pe.pageId).objs.filter(o => {
        const ob = boxOf(pe.pageId, o);
        return ob.x < b.x + b.w && ob.x + ob.w > b.x && ob.y < b.y + b.h && ob.y + ob.h > b.y;
      }).map(o => o.id);
      if (hit.length) { select(pe.pageId, hit, dr.add); return; }
      // sobre la partitura sin elementos: el recuadro se convierte en una zona (para mover o recortar trozos)
      const pg = pageById(pe.pageId), z = zoneOn(pe.pageId, b);
      if (z && pagePdfId(S.piece, pg) && !dr.add) {
        setTool("zone"); setZone(pe.pageId, z);
        toast("Zona marcada: arrástrala para moverla · Ctrl+arrastrar copia · Ctrl+C / Ctrl+X / Supr");
      }
      return;
    }
    if (dr.type === "path") {
      const o = dr.o;
      o.pts = simplify(o.pts, 0.35 / Math.max(0.5, S.zoom / 1.33));
      commit(pe.pageId, arr => arr.push(o));
      return; // se puede seguir dibujando sin cambiar de herramienta
    }
    const o = dr.o;
    const big = o.t === "line" ? Math.hypot(o.x2 - o.x1, o.y2 - o.y1) > 2 : (o.w > 2 && o.h > 2);
    if (!big) return;
    commit(pe.pageId, arr => arr.push(o));
    if (o.t === "rect") select(pe.pageId, o.id);
  }
}
function cancelDrag() {
  if (S.drag) {
    const pe = S.pageEls.get(S.drag.pageId);
    const o = single();
    if (o && S.drag.type === "resize") { Object.assign(o, S.drag.orig); rerenderObj(S.drag.pageId, o); }
    for (const x of selObjs()) gOf(S.drag.pageId, x.id)?.removeAttribute("transform");
    pe?.selLayer.removeAttribute("transform");
    pe?.div.classList.remove("dragging");
    if (pe) pe.tmpLayer.innerHTML = "";
    if (S.drag.type === "zone") { for (const id of S.drag.ct.take) gOf(S.drag.pageId, id)?.removeAttribute("visibility"); drawZone(); }
    S.drag = null; refreshSelection();
  }
  if (S.draw) { S.pageEls.get(S.draw.pageId)?.tmpLayer.replaceChildren(); S.draw = null; }
}

function moveSelectionToPage(fromPe, toPe, d, evt) {
  const pt = svgPoint(toPe.svgEl, evt);
  const dx = pt.x - d.start.x, dy = pt.y - d.start.y;
  const ids = new Set(S.sel.ids);
  const moved = [];
  commit([fromPe.pageId, toPe.pageId], (src, dst) => {
    for (let i = src.length - 1; i >= 0; i--) if (ids.has(src[i].id)) moved.unshift(src.splice(i, 1)[0]);
    for (const o of moved) { moveObj(o, dx, dy); dst.push(o); }
  });
  select(toPe.pageId, moved.map(o => o.id));
  toast(`Movido a la hoja ${pageIndex(toPe.pageId) + 1}`);
}

function rememberSize(o) {
  const map = { chord: "chordSize", finger: "fingerSize", loop: "loopSize" };
  if (map[o.t]) { S.settings[map[o.t]] = Math.round(o.size * 10) / 10; persistSettings(); }
  if (o.t === "text") { S.settings.fontSize = Math.round(o.size); persistSettings(); updateSelUi(); }
}

/* ---------- Herramienta «Zona» (como la selección rectangular de Paint) ----------
   Marca un rectángulo sobre lo que se VE (fondo PDF, capturas, recortes y anotaciones) y luego:
   arrastrar = cortar y mover · Ctrl+arrastrar = copiar y mover · Ctrl+C / Ctrl+X · Supr = borrar.
   Cortar QUITA de verdad: deja un hueco en el original (antes se tapaba con un rectángulo blanco
   y se acumulaban copias superpuestas). */
function zoneOn(pageId, zone) {
  const pg = pageById(pageId);
  const x = clamp(zone.x, 0, pg.w), y = clamp(zone.y, 0, pg.h);
  const z = { x, y, w: clamp(zone.x + zone.w, 0, pg.w) - x, h: clamp(zone.y + zone.h, 0, pg.h) - y };
  return z.w >= 1 && z.h >= 1 ? z : null;
}
// Lo que contiene la zona: pieces (copias colocadas en el mismo sitio), take (ids que se llevan enteros
// al cortar), holes (huecos a abrir en objetos partidos) y base (hueco en el fondo PDF)
function zoneContent(pageId, z) {
  const pg = pageById(pageId);
  const pieces = [], take = new Set(), holes = [];
  let base = null;
  const pid = pagePdfId(S.piece, pg);
  if (pid) {
    const c = { id: uid("o"), t: "clip", x: z.x, y: z.y, scale: 1, sx: z.x, sy: z.y, sw: z.w, sh: z.h, src: { pdfId: pid, index: pg.src.index, view: pg.src.view, rotate: pg.src.rotate || 0 } };
    const hs = (pg.holes || []).filter(h => interBox(h, z)).map(h => ({ ...h })); // lo ya cortado del fondo no reaparece
    if (hs.length) c.holes = hs;
    pieces.push(c); base = { ...z };
  }
  for (const o of pg.objs) {
    const b = boxOf(pageId, o);
    if (!boxesTouch(b, z)) continue;
    if (!boxInside(b, z)) { // partido por la zona: se corta lo que queda dentro (sea lo que sea)
      const c = cropToZone(o, z);
      if (c) { c.id = uid("o"); pieces.push(c); holes.push({ id: o.id, hole: pageToHole(o, interBox(b, z)) }); }
      continue;
    }
    pieces.push(clone(o)); take.add(o.id);
  }
  return { pieces, take, holes, base };
}
// Quita del original lo que hay en la zona (dentro de un commit)
function applyCut(pageId, arr, ct) {
  for (let i = arr.length - 1; i >= 0; i--) if (ct.take.has(arr[i].id)) arr.splice(i, 1);
  for (const h of ct.holes) { const o = arr.find(x => x.id === h.id); if (o) (o.holes ||= []).push(h.hole); }
  if (ct.base) { const pg = pageById(pageId); (pg.holes ||= []).push(ct.base); }
}
const freshIds = (objs) => objs.map(o => { const c = clone(o); c.id = uid("o"); return c; });

function setZone(pageId, z) {
  clearZone(false);
  if (S.sel) clearSel();
  S.zone = { pageId, ...z };
  drawZone();
  updateSelUi();
}
function clearZone(ui = true) {
  for (const pe of S.pageEls.values()) pe.zoneLayer.innerHTML = "";
  S.zone = null;
  if (ui) updateSelUi();
}
function drawZone(dx = 0, dy = 0) {
  for (const pe of S.pageEls.values()) pe.zoneLayer.innerHTML = "";
  const z = S.zone; if (!z) return;
  const pe = S.pageEls.get(z.pageId); if (!pe) return;
  const sw = 1.5 / S.zoom, d = `${6 / S.zoom} ${4 / S.zoom}`;
  pe.zoneLayer.append(
    svg("rect", { class: "zone-sel-bg", x: z.x + dx, y: z.y + dy, width: z.w, height: z.h, "stroke-width": sw * 2 }),
    svg("rect", { class: "zone-sel", x: z.x + dx, y: z.y + dy, width: z.w, height: z.h, "stroke-width": sw, "stroke-dasharray": d }));
}
function zoneCopy() {
  const z = S.zone; if (!z) return;
  const ct = zoneContent(z.pageId, z);
  if (!ct.pieces.length) { toast("En esa zona no hay nada."); return; }
  setClipboard(freshIds(ct.pieces), z.pageId);
  toast("Zona copiada. Pega con Ctrl+V en cualquier hoja o pieza.");
}
function zoneCut(toClipboard = true) {
  const z = S.zone; if (!z) return;
  const ct = zoneContent(z.pageId, z);
  if (!ct.pieces.length) { toast("En esa zona no hay nada."); return; }
  if (toClipboard) setClipboard(freshIds(ct.pieces), z.pageId);
  commit(z.pageId, arr => applyCut(z.pageId, arr, ct));
  clearZone();
  toast(toClipboard ? "Zona cortada. Pega con Ctrl+V donde quieras." : "Zona borrada (Ctrl+Z para deshacer)");
}
function zoneDuplicate() {
  const z = S.zone; if (!z) return;
  const ct = zoneContent(z.pageId, z);
  if (!ct.pieces.length) { toast("En esa zona no hay nada."); return; }
  const copies = freshIds(ct.pieces);
  copies.forEach(c => moveObj(c, 12, 12));
  commit(z.pageId, arr => arr.push(...copies));
  clearZone(false);
  select(z.pageId, copies.map(c => c.id));
  toast("Copia de la zona creada encima: arrástrala a su sitio");
}
// Arrastrar la zona: mueve (o copia con Ctrl) lo que contiene, también a otra hoja
function startZoneMove(pe, p, evt) {
  const z = S.zone;
  const ct = zoneContent(z.pageId, z);
  if (!ct.pieces.length) { toast("En esa zona no hay nada que mover."); return; }
  S.drag = { type: "zone", pageId: pe.pageId, start: p, ct, copy: evt.ctrlKey || evt.metaKey || evt.altKey, moved: false, dx: 0, dy: 0, client0: { x: evt.clientX, y: evt.clientY } };
  pe.svgEl.setPointerCapture(evt.pointerId);
}
function zoneDragPreview(pe, d) {
  pe.tmpLayer.innerHTML = "";
  const z = S.zone;
  if (!d.copy) {
    pe.tmpLayer.append(svg("rect", { x: z.x, y: z.y, width: z.w, height: z.h, fill: "#fff" }));
    for (const id of d.ct.take) gOf(pe.pageId, id)?.setAttribute("visibility", "hidden");
  }
  const g = svg("g", { transform: `translate(${d.dx},${d.dy})`, opacity: "0.92" });
  for (const o of d.ct.pieces) g.append(renderObj(o));
  pe.tmpLayer.append(g);
  drawZone(d.dx, d.dy);
}
function finishZoneMove(pe, d, evt) {
  for (const id of d.ct.take) gOf(pe.pageId, id)?.removeAttribute("visibility");
  pe.tmpLayer.innerHTML = "";
  if (!d.moved) { drawZone(); return; }
  const target = pageElAt(evt.clientX, evt.clientY);
  const from = pe.pageId;
  let to = from, dx = d.dx, dy = d.dy;
  if (target && target.pageId !== from) { const pt = svgPoint(target.svgEl, evt); to = target.pageId; dx = pt.x - d.start.x; dy = pt.y - d.start.y; }
  // al copiar todo lleva id nuevo; al mover, lo que se lleva entero conserva el suyo
  const pieces = d.copy ? freshIds(d.ct.pieces) : d.ct.pieces.map(o => (d.ct.take.has(o.id) ? clone(o) : o));
  pieces.forEach(o => moveObj(o, dx, dy));
  if (to === from) {
    commit(from, arr => { if (!d.copy) applyCut(from, arr, d.ct); arr.push(...pieces); });
  } else {
    commit([from, to], (src, dst) => { if (!d.copy) applyCut(from, src, d.ct); dst.push(...pieces); });
  }
  clearZone(false);
  select(to, pieces.map(o => o.id));
  if (to !== from) toast(`Llevado a la hoja ${pageIndex(to) + 1}`);
}

/* ---------- Colocar objetos pendientes ---------- */
function placePending(pageId, p) {
  const pend = S.pending; clearPending();
  let o = null;
  const st = S.settings;
  if (pend.kind === "chord") o = { id: uid("o"), t: "chord", x: p.x - st.chordSize / 2, y: p.y - 10, size: st.chordSize, model: clone(pend.model) };
  else if (pend.kind === "finger") o = { id: uid("o"), t: "finger", x: p.x - st.fingerSize / 2, y: p.y - st.fingerSize / 2, size: st.fingerSize, n: pend.n };
  else if (pend.kind === "loop") o = { id: uid("o"), t: "loop", x: p.x - st.loopSize / 2, y: p.y - st.loopSize * 0.3, size: st.loopSize, text: pend.text, url: pend.url || "" };
  else if (pend.kind === "text") o = { id: uid("o"), t: "text", x: p.x, y: p.y + st.fontSize * 0.35, size: st.fontSize, text: pend.text, color: st.color, font: "sans", bold: true };
  if (!o) return;
  commit(pageId, objs => objs.push(o));
  setTool("select");
  select(pageId, o.id);
}

/* ---------- Texto en línea ---------- */
function startInline(pageId, o, isNew) {
  finishInline(true);
  const pe = S.pageEls.get(pageId);
  const input = el("input", { type: "text", class: o.tab ? "inline-text inline-tab" : "inline-text", value: o.text || "", placeholder: isNew ? (o.tab ? "" : "Escribe aquí") : "", maxlength: o.tab ? 8 : null });
  const z = S.zoom;
  // número de traste: una cajita del tamaño del número, centrada en el traste (no tapa los de al lado)
  const fitTab = () => {
    const w = Math.max(1, input.value.length) * o.size * 0.62 * z + 6, h = o.size * 1.15 * z + 2;
    Object.assign(input.style, { width: `${w}px`, height: `${h}px`, left: `${o.x * z - w / 2}px`, top: `${o.y * z - h / 2}px` });
  };
  if (o.tab) { Object.assign(input.style, { fontSize: `${o.size * z}px`, color: o.color, fontFamily: "Helvetica, Arial, sans-serif" }); fitTab(); input.addEventListener("input", fitTab); }
  else Object.assign(input.style, {
    left: `${o.x * z - 4}px`, top: `${(o.y - o.size * 1.05) * z - 3}px`,
    fontSize: `${o.size * z}px`, color: o.color, fontWeight: o.bold ? "bold" : "normal",
    fontFamily: o.font === "mono" ? "Courier New, monospace" : "Helvetica, Arial, sans-serif",
    minWidth: `${Math.max(120, (boxOf(pageId, o).w + 40) * z)}px`,
  });
  pe.div.append(input);
  if (!isNew) gOf(pageId, o.id)?.setAttribute("opacity", "0");
  S.inline = { pageId, o, isNew, input };
  input.addEventListener("keydown", e => {
    e.stopPropagation();
    if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); finishInline(true); }
    else if (e.key === "Escape") { e.preventDefault(); finishInline(false); }
  });
  input.addEventListener("blur", () => { if (S.inline?.input === input) finishInline(true); });
  input.focus(); input.select();
  setTimeout(() => { if (document.activeElement !== input && S.inline?.input === input) input.focus(); }, 0);
}
function finishInline(ok) {
  const st = S.inline; if (!st) return;
  S.inline = null;
  const value = st.input.value;
  st.input.remove();
  gOf(st.pageId, st.o.id)?.removeAttribute("opacity");
  if (st.isNew) {
    if (ok && value.trim()) {
      const o = { ...st.o, text: st.o.tab ? value.trim() : value };
      commit(st.pageId, objs => objs.push(o));
      if (!st.o.tab) { setTool("select"); select(st.pageId, o.id); } // con «Traste» se sigue escribiendo números
    }
  } else if (ok && value !== st.o.text) {
    if (!value.trim()) commit(st.pageId, objs => { const i = objs.findIndex(x => x.id === st.o.id); if (i >= 0) objs.splice(i, 1); });
    else commit(st.pageId, objs => { const t = objs.find(x => x.id === st.o.id); if (t) t.text = value; });
  }
}

/* ---------- Editar objeto ---------- */
async function editObject(pageId, o) {
  if (!o) return;
  if (o.t === "text") { startInline(pageId, o, false); return; }
  if (o.t === "chord") {
    const r = await openChordEditor(o.model, "edit");
    if (r?.action === "apply") commit(pageId, objs => { const t = objs.find(x => x.id === o.id); if (t) t.model = clone(r.model); });
    return;
  }
  if (o.t === "loop") {
    const r = await loopDialog(o.text, o.url);
    if (r) commit(pageId, objs => { const t = objs.find(x => x.id === o.id); if (t) { t.text = r.text; t.url = r.url; } });
    return;
  }
  if (o.t === "staff") {
    const r = await staffDialog(o, { edit: true, page: pageById(pageId) });
    if (!r) return;
    const st = { ...r.staff, id: o.id, x: o.x, y: o.y, ...(o.crop ? { crop: o.crop } : {}), ...(o.holes ? { holes: o.holes } : {}) };
    const chords = r.emptyChords ? emptyChordsFor(st, S.settings.chordSize) : [];
    commit(pageId, objs => { const i = objs.findIndex(x => x.id === o.id); if (i >= 0) objs[i] = st; objs.push(...chords); });
    return;
  }
  if (o.t === "neck") {
    const r = await neckDialog(o, { edit: true });
    if (r) commit(pageId, objs => { const i = objs.findIndex(x => x.id === o.id); if (i >= 0) objs[i] = { ...r, id: o.id, x: o.x, y: o.y, w: o.w, sg: o.sg }; });
    return;
  }
  if (o.t === "finger") {
    const v = await promptDialog("Número de dedo", "Dedo (0-9)", String(o.n));
    const n = parseInt(v, 10);
    if (Number.isInteger(n) && n >= 0 && n <= 9) commit(pageId, objs => { const t = objs.find(x => x.id === o.id); if (t) t.n = n; });
  }
}

function formatLoop(raw) {
  const c = (raw || "").trim().toUpperCase();
  if (!c) return "";
  return /^\d+$/.test(c) ? "L" + c : c.slice(0, 12);
}
async function loopDialog(text = "", url = "") {
  const box = el("div", {},
    el("div", { class: "field" }, el("label", { text: "Número o etiqueta (23 → L23)" }), el("input", { type: "text", id: "lpText", value: text, maxlength: 12, class: "full" })),
    el("div", { class: "field" }, el("label", { text: "Otro vídeo solo para esta etiqueta (opcional)" }),
      el("input", { type: "url", id: "lpUrl", value: url, placeholder: S.piece.videoUrl ? "Vacío = vídeo de la pieza" : "Vacío = sin enlace", class: "full" })),
    el("p", { class: "muted small", text: S.piece.videoUrl ? `Vídeo de la pieza: ${S.piece.videoUrl}` : "Esta pieza aún no tiene vídeo (botón «Vídeo» arriba)." }));
  return dialog({
    title: "Etiqueta de bucle", body: box,
    buttons: [{ label: "Cancelar", value: null }, {
      label: "Aceptar", primary: true,
      validate: c => {
        if (!formatLoop(c.querySelector("#lpText").value)) { toast("Escribe un número o texto."); return false; }
        const u = c.querySelector("#lpUrl").value.trim();
        if (u && !isHttpUrl(normalizeUrl(u))) { toast("La dirección del vídeo no es válida."); return false; }
        return true;
      },
      value: c => ({ text: formatLoop(c.querySelector("#lpText").value), url: normalizeUrl(c.querySelector("#lpUrl").value) }),
    }],
  });
}
function openLoop(o) {
  const url = o.url || S.piece.videoUrl;
  if (!url) { toast("Esta pieza no tiene vídeo asignado (botón «Vídeo»)."); return; }
  openUrl(url);
}

/* ---------- Acciones sobre la selección ---------- */
function deleteSelected() {
  if (!S.sel) return;
  const pid = S.sel.pageId, ids = new Set(S.sel.ids);
  clearSel();
  commit(pid, objs => { for (let i = objs.length - 1; i >= 0; i--) if (ids.has(objs[i].id)) objs.splice(i, 1); });
}
function duplicateSelected() {
  const objs = selObjs(); if (!objs.length) return;
  const pid = S.sel.pageId;
  const copies = objs.map(o => { const c = clone(o); c.id = uid("o"); moveObj(c, 12, 12); return c; });
  commit(pid, arr => arr.push(...copies));
  select(pid, copies.map(c => c.id));
}
function setClipboard(objs, pageId) {
  clipboard = { objs: clone(objs), pageId, pieceId: S.piece.id, mark: `${MARK}${uid("c")}` };
  // así, si luego copias algo fuera de la app, Ctrl+V pegará eso y no esto
  // Con Ctrl+C / Ctrl+X la marca la escribe el evento «copy» (más fiable); con los botones, writeText.
  const cb = clipboard; cb.at = Date.now();
  const writeMark = () => {
    if (cb.markWritten || clipboard !== cb) return;
    try { navigator.clipboard?.writeText?.(cb.mark).then(() => { cb.markWritten = true; }, () => { cb.noMark = true; }); } catch { cb.noMark = true; }
  };
  if (S.keyCopy) setTimeout(writeMark, 0); // por si el navegador no lanza el evento «copy»
  else writeMark();
  updateSelUi();
}
function copySelected(cut = false) {
  const objs = selObjs(); if (!objs.length) return;
  setClipboard(objs, S.sel.pageId);
  if (cut) deleteSelected();
  updateSelUi();
  toast(`${objs.length} elemento(s) ${cut ? "cortado(s)" : "copiado(s)"}. Pega con Ctrl+V en cualquier hoja o pieza.`);
}
function visiblePageId() {
  let best = null, bestArea = -1;
  for (const pe of S.pageEls.values()) {
    const r = pe.div.getBoundingClientRect();
    const area = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
    if (area > bestArea) { bestArea = area; best = pe.pageId; }
  }
  return best;
}
function paste() {
  if (!clipboard) return;
  const pid = S.sel?.pageId || visiblePageId();
  const pg = pageById(pid); if (!pg) return;
  const copies = clipboard.objs.map(o => { const c = clone(o); c.id = uid("o"); return c; });
  const samePlace = clipboard.pieceId === S.piece.id && clipboard.pageId === pid;
  const b = unionBox(copies.map(o => objBox(o)));
  let dx = samePlace ? 12 : 0, dy = samePlace ? 12 : 0;
  // que quede dentro de la hoja
  if (b.x + dx + b.w > pg.w) dx = pg.w - b.w - b.x - 4;
  if (b.y + dy + b.h > pg.h) dy = pg.h - b.h - b.y - 4;
  if (b.x + dx < 0) dx = -b.x + 4;
  if (b.y + dy < 0) dy = -b.y + 4;
  copies.forEach(c => moveObj(c, dx, dy));
  commit(pid, arr => arr.push(...copies));
  setTool("select");
  select(pid, copies.map(c => c.id));
  if (samePlace) { clipboard.objs = clone(copies); } // pegados sucesivos en escalera
  scrollToPageIfHidden(pid);
}
/* ---------- Pegar desde fuera de la app: imágenes y texto ---------- */
function clientToPage(pe, cx, cy) {
  const m = pe.svgEl.getScreenCTM();
  if (!m) return { x: 0, y: 0 };
  const p = pe.svgEl.createSVGPoint(); p.x = cx; p.y = cy;
  return p.matrixTransform(m.inverse());
}
// centro de la parte visible de una hoja (en puntos)
function visibleCenter(pageId) {
  const pe = S.pageEls.get(pageId), pg = pageById(pageId);
  const r = pe.div.getBoundingClientRect();
  const top = Math.max(r.top, 0), bot = Math.min(r.bottom, window.innerHeight);
  if (bot <= top) return { x: pg.w / 2, y: pg.h / 2 };
  return clientToPage(pe, r.left + r.width / 2, (top + bot) / 2);
}
function keepInside(pg, objs) {
  const b = unionBox(objs.map(o => objBox(o)));
  let dx = 0, dy = 0;
  if (b.x + b.w > pg.w) dx = pg.w - b.w - b.x - 4;
  if (b.y + b.h > pg.h) dy = pg.h - b.h - b.y - 4;
  if (b.x + dx < 0) dx = -b.x + 4;
  if (b.y + dy < 0) dy = -b.y + 4;
  if (dx || dy) objs.forEach(o => moveObj(o, dx, dy));
}
async function insertImageBlob(blob, pageId, at) {
  if (S.locked) return;
  const pid = pageId || S.sel?.pageId || visiblePageId();
  const pg = pageById(pid); if (!pg) return;
  try {
    toast("Añadiendo imagen…", 8000);
    const info = await storeImage(blob, blob.name || "imagen");
    const c = at || visibleCenter(pid);
    const o = imageObj(info, c.x, c.y, pg.w * 0.8, pg.h * 0.6);
    keepInside(pg, [o]);
    commit(pid, arr => arr.push(o));
    setTool("select"); select(pid, o.id);
    toast("Imagen añadida: muévela o cambia su tamaño desde la esquina");
  } catch (e) { console.error(e); toast("No se pudo añadir la imagen: " + (e?.message || e)); }
}
function insertText(text) {
  const pid = S.sel?.pageId || visiblePageId();
  const pg = pageById(pid); if (!pg) return;
  const lines = String(text).replace(/\r/g, "").split("\n").map(l => l.replace(/\t/g, "    ")).filter((l, i, a) => l.trim() || (i > 0 && i < a.length - 1)).slice(0, 40);
  if (!lines.length) return;
  const st = S.settings, c = visibleCenter(pid);
  const objs = lines.map((l, i) => ({ id: uid("o"), t: "text", x: c.x - 120, y: c.y + i * st.fontSize * 1.3, size: st.fontSize, text: l.slice(0, 500), color: st.color, font: "sans", bold: false }));
  keepInside(pg, objs);
  commit(pid, arr => arr.push(...objs));
  setTool("select"); select(pid, objs.map(o => o.id));
  toast(lines.length > 1 ? `${lines.length} líneas de texto pegadas` : "Texto pegado");
}
// Decide qué pegar: lo copiado DENTRO de la app (si es lo último que copiaste) o lo de fuera (imagen o texto)
async function pasteFrom(files, text) {
  // ¿Lo último que copiaste fue de la app? Sí si el portapapeles trae nuestra marca.
  // Si no se pudo dejar la marca, una imagen o un texto de fuera ganan siempre (antes ganaba lo de la app y no se podían pegar capturas).
  const mine = !!clipboard && (text === clipboard.mark || (clipboard.noMark && !files.length && (!text.trim() || text.startsWith(MARK))));
  if (mine) { paste(); return; }
  if (files.length) { for (const f of files) await insertImageBlob(f); return; }
  if (text.trim() && !text.startsWith(MARK)) { insertText(text); return; }
  if (clipboard) paste();
  else toast("No hay nada para pegar: copia una imagen o un texto y vuelve a intentarlo.");
}
function onPasteEvent(e) {
  if (!S.piece || S.locked || organizerOpen() || document.querySelector(".modal-backdrop")) return;
  const t = e.target;
  if (t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA"].includes(t.tagName))) return;
  e.preventDefault();
  S.pastedAt = Date.now();
  const dt = e.clipboardData;
  const files = [...(dt?.items || [])].filter(i => i.kind === "file" && /^image\//.test(i.type)).map(i => i.getAsFile()).filter(Boolean);
  pasteFrom(files, dt?.getData("text/plain") || "");
}
// Botón «Pegar»: lee el portapapeles del sistema (el navegador puede pedir permiso la primera vez)
async function pasteButton() {
  try {
    if (navigator.clipboard?.read) {
      const items = await navigator.clipboard.read();
      const files = []; let text = "";
      for (const it of items) {
        const im = it.types.find(t => t.startsWith("image/"));
        if (im) files.push(await it.getType(im));
        if (it.types.includes("text/plain")) text = await (await it.getType("text/plain")).text();
      }
      await pasteFrom(files, text);
      return;
    }
  } catch (e) { console.warn("portapapeles", e); }
  if (clipboard) paste();
  else toast("No se puede leer el portapapeles. Prueba con Ctrl+V, o usa «🖼 Imagen» para elegir un archivo.", 5000);
}

/* ---------- Fase 3: insertar pauta, mástil y fila de acordes ---------- */
// Dónde colocar algo nuevo: debajo de lo seleccionado (con su mismo ancho) o en la parte visible
function placement(pageId) {
  const pg = pageById(pageId);
  const sel = S.sel?.pageId === pageId ? selObjs() : [];
  if (sel.length) { const b = unionBox(sel.map(o => boxOf(pageId, o))); return { x: b.x, y: b.y + b.h + 10, w: b.w, under: true }; }
  const c = visibleCenter(pageId);
  return { x: 40, y: clamp(c.y - 140, 30, pg.h - 120), w: pg.w - 80, under: false };
}
// Número de traste soltado cerca de una cuerda: se coloca justo en ella
function snapTab(pageId, o) {
  const pg = pageById(pageId);
  let best = null;
  for (const st of pg.objs) {
    if (st.t !== "staff") continue;
    const l = nearestTabLine(st, { x: o.x, y: o.y }, 1.6);
    if (l && (!best || l.d < best.d)) best = l;
  }
  if (best) o.y = r2(best.y);
}
// Busca hueco libre (sin tapar nada) bajando desde donde iba a ir; si no hay, lo deja donde estaba
function freeSpot(pageId, o) {
  const pg = pageById(pageId);
  const others = pg.objs.filter(x => x.id !== o.id).map(x => boxOf(pageId, x));
  const b0 = objBox(o), y0 = b0.y;
  const fits = (dy) => { const b = { ...b0, y: b0.y + dy }; return b.y + b.h <= pg.h - 10 && !others.some(ob => boxesTouch(b, ob)); };
  for (let dy = 0; y0 + dy + b0.h <= pg.h - 10; dy += 6) if (fits(dy)) { moveObj(o, 0, dy); return; }
  for (let y = 20; y < y0; y += 6) if (fits(y - y0)) { moveObj(o, 0, y - y0); return; }
}
async function insertStaff() {
  finishInline(true);
  const pid = S.sel?.pageId || visiblePageId(); const pg = pageById(pid); if (!pg) return;
  const at = placement(pid);
  const res = await staffDialog(defaultStaff("tab", at.x, at.y, Math.max(120, at.w)), { page: pg });
  if (!res) return;
  const r = res.staff;
  r.x = at.x; r.y = at.y;
  if (!at.under) freeSpot(pid, r);
  const chords = res.emptyChords ? emptyChordsFor(r, S.settings.chordSize) : [];
  commit(pid, arr => arr.push(r, ...chords));
  setTool("select"); select(pid, [r.id, ...chords.map(c => c.id)]);
  toast("Pauta colocada. Arrastra la esquina para cuadrarla; con «Traste» (N) escribes los números.", 5000);
}
async function insertNeck(preset) {
  finishInline(true);
  const pid = S.sel?.pageId || visiblePageId(); const pg = pageById(pid); if (!pg) return;
  const at = placement(pid);
  const r = preset ? { ...preset } : await neckDialog(defaultNeck(at.x, at.y, Math.min(Math.max(120, at.w), 515)));
  if (!r) return;
  const o = { ...defaultNeck(at.x, at.y, Math.min(Math.max(120, at.w), 515)), ...r, id: uid("o"), x: at.x, y: at.y };
  // ancho según los trastes que se ven (un mástil de 4 trastes no se estira a toda la hoja)
  o.w = Math.min(Math.max(120, at.w), 515, 40 + (o.to - o.from) * 46);
  keepInside(pg, [o]);
  if (!at.under) freeSpot(pid, o);
  commit(pid, arr => arr.push(o));
  setTool("select"); select(pid, o.id);
  toast("Mástil colocado: doble clic para editarlo; la esquina cambia ancho y alto.");
}
async function insertChordRow() {
  finishInline(true);
  const pid = S.sel?.pageId || visiblePageId(); const pg = pageById(pid); if (!pg) return;
  const staffs = (S.sel?.pageId === pid ? selObjs() : []).filter(o => o.t === "staff").sort((a, b) => a.y - b.y);
  const r = await chordRowDialog({ library: chordLibrary(), staffCount: staffs.length, defaultSize: S.settings.chordSize });
  if (!r) return;
  let objs = [], missing = [];
  if (r.where === "staff" && staffs.length) {
    // uno por compás en cada pauta; los nombres (si hay) se reparten en orden
    let k = 0;
    for (const st of staffs) {
      const slots = emptyChordsFor(st, r.size);
      const res = r.list.length
        ? buildChordRow({ ...r, list: slots.map((_, i) => r.list[k + i]).filter(Boolean) }, chordLibrary(), { staff: st, page: pg })
        : { objs: slots, missing: [] };
      k += slots.length;
      objs.push(...res.objs); missing.push(...res.missing);
      if (r.list.length && k >= r.list.length) break;
    }
  } else {
    ({ objs, missing } = buildChordRow(r, chordLibrary(), { page: pg, y: placement(pid).y }));
  }
  if (!objs.length) return;
  commit(pid, arr => arr.push(...objs));
  setTool("select"); select(pid, objs.map(o => o.id));
  S.settings.chordSize = r.size; persistSettings();
  toast(missing.length ? `Colocados. Vacíos para rellenar (doble clic): ${missing.join(", ")}` : `${objs.length} diagramas colocados: doble clic en cada uno para rellenarlo`, 5000);
}

/* ---------- Mover la selección a otra hoja ---------- */
async function moveToPageDialog() {
  if (!S.sel) return;
  const from = S.sel.pageId, fi = pageIndex(from);
  const sel = el("select", { id: "mvTarget", class: "full" });
  S.piece.pages.forEach((p, i) => { if (p.id !== from) sel.append(el("option", { value: p.id, text: `Hoja ${i + 1}${p.w > p.h ? " (horizontal)" : ""}`, selected: i === fi + 1 })); });
  sel.append(el("option", { value: "new:v", text: "Una hoja nueva vertical (debajo de esta)" }), el("option", { value: "new:h", text: "Una hoja nueva horizontal (debajo de esta)" }));
  const r = await dialog({ title: "Mover a otra hoja", body: el("div", { class: "field" }, el("label", { text: "Llevar lo seleccionado a…" }), sel),
    buttons: [{ label: "Cancelar", value: null }, { label: "Mover", primary: true, value: c => c.querySelector("#mvTarget").value }] });
  if (!r) return;
  const ids = new Set(S.sel.ids);
  let to = r;
  if (r.startsWith("new:")) {
    const np = blankPageOriented(r.slice(4));
    to = np.id;
    commitPages(pages => {
      const src = pages.find(p => p.id === from);
      const moved = src.objs.filter(o => ids.has(o.id));
      src.objs = src.objs.filter(o => !ids.has(o.id));
      np.objs.push(...moved); keepInside(np, moved);
      pages.splice(pages.findIndex(p => p.id === from) + 1, 0, np);
    });
  } else {
    const dst = pageById(to);
    commit([from, to], (src, d) => {
      const moved = src.filter(o => ids.has(o.id));
      for (let i = src.length - 1; i >= 0; i--) if (ids.has(src[i].id)) src.splice(i, 1);
      keepInside(dst, moved); d.push(...moved);
    });
  }
  select(to, [...ids]);
  S.pageEls.get(to)?.div.scrollIntoView({ behavior: "smooth", block: "start" });
  toast(`Movido a la hoja ${pageIndex(to) + 1}`);
}

/* ---------- Organizador de hojas ---------- */
function openPagesOrganizer(mode = "pages") {
  finishInline(true); clearSel(); clearPending();
  openOrganizer({
    piece: () => S.piece,
    commitPages,
    undo: () => undo(),
    saveNow: async () => { saveDeb.flush(); await saving; },
    goto: (id) => S.pageEls.get(id)?.div.scrollIntoView({ block: "start" }),
    exportPages: (pages, fileName) => exportPiecePdf(S.piece, { pages, fileName }),
    replacePiece: (np) => { S.piece = np; S.undo = []; S.redo = []; clearSel(); buildPages(); updateHistoryButtons(); setSaveState("Guardado ✓"); },
    refreshThumb: async () => { try { S.piece.thumb = await pieceThumb(S.piece); changed(); } catch (e) { console.warn(e); } },
    openPiece: async (id) => { const p = await closeEditor(); S.onClose?.(p, { open: id }); },
    close: async () => { const p = await closeEditor(); S.onClose?.(p); },
    discardAndClose: async (fn) => { S.noSave = true; await closeEditor(); await fn(); S.onClose?.(null); },
  }, { mode });
}

/* ---------- Título y etiquetas ---------- */
async function titleDialog() {
  const box = el("div", {},
    el("div", { class: "field" }, el("label", { text: "Título" }), el("input", { type: "text", id: "tTitle", value: S.piece.title, class: "full" })),
    el("div", { class: "field" }, el("label", { text: "Etiquetas (separadas por comas)" }), el("input", { type: "text", id: "tTags", value: (S.piece.tags || []).join(", "), class: "full", placeholder: "Ej: clásica, CAGED, estudiando" })));
  const v = await dialog({ title: "Título y etiquetas", body: box, buttons: [{ label: "Cancelar", value: null }, { label: "Guardar", primary: true, value: c => ({ t: c.querySelector("#tTitle").value, g: c.querySelector("#tTags").value }) }] });
  if (!v) return;
  S.piece.title = v.t.trim() || S.piece.title;
  S.piece.tags = v.g.split(",").map(x => x.trim()).filter(Boolean).slice(0, 30);
  $("#edTitle").textContent = S.piece.title;
  changed();
}

function zOrder(front) {
  if (!S.sel) return;
  const ids = new Set(S.sel.ids);
  commit(S.sel.pageId, objs => {
    const moving = objs.filter(o => ids.has(o.id)), rest = objs.filter(o => !ids.has(o.id));
    objs.length = 0;
    objs.push(...(front ? [...rest, ...moving] : [...moving, ...rest]));
  });
}
function nudge(dx, dy) {
  if (!S.sel) return;
  const ids = new Set(S.sel.ids);
  commit(S.sel.pageId, objs => objs.filter(o => ids.has(o.id)).forEach(o => moveObj(o, dx, dy)), { key: "nudge:" + [...ids].join(",") });
}
function applyStyle(kind, value) {
  if (!S.sel) return;
  const ids = new Set(S.sel.ids);
  commit(S.sel.pageId, objs => {
    for (const t of objs) {
      if (!ids.has(t.id)) continue;
      const eraser = t.t === "path" && t.kind === "eraser";
      if (kind === "color" && (t.t === "text" || t.t === "line" || t.t === "ellipse" || (t.t === "path" && !eraser))) t.color = value;
      if (kind === "font" && t.t === "text") t.size = value;
      if (kind === "line") { if (t.t === "line" || (t.t === "path" && !eraser)) t.w = value; if (t.t === "ellipse") t.sw = value; }
      if (kind === "eraser" && eraser) t.w = value;
      if (kind === "patch") { if (t.t === "rect") t.fill = value; if (eraser) t.color = value; }
    }
  }, { key: `style:${kind}:${[...ids].join(",")}` });
}

/* ================= Panel de acordes ================= */
function rebuildChordList() {
  const list = $("#chordList");
  const q = ($("#chordSearch").value || "").trim().toLowerCase();
  list.innerHTML = "";
  for (const [name, m] of Object.entries(chordLibrary())) {
    if (q && !name.toLowerCase().includes(q)) continue;
    const item = el("button", { class: "chord-item", type: "button", title: name }, chordPreviewSvg(m, 52), el("span", { text: name }));
    item.addEventListener("click", () => {
      $("#chordPanel").hidden = true;
      setTool("select");
      setPending({ kind: "chord", model: m }, `Toca la página para colocar ${name} (Esc cancela)`);
    });
    if (isCustomChord(name)) {
      const del = el("span", { class: "chord-del", title: `Quitar ${name} de la biblioteca`, text: "×" });
      del.addEventListener("click", async (e) => {
        e.stopPropagation();
        await deleteChordFromLibrary(name);
        rebuildChordList();
        toast(`«${name}» quitado de la biblioteca`);
      });
      item.append(del);
    }
    list.append(item);
  }
}

/* ================= Conexión de la barra ================= */
export function wireEditorUi() {
  $("#edBack").addEventListener("click", async () => { const p = await closeEditor(); S.onClose?.(p); });
  $("#edTitle").addEventListener("click", titleDialog);
  $("#edPages").addEventListener("click", () => openPagesOrganizer("pages"));
  $("#btnImage").addEventListener("click", () => $("#fileImage").click());
  $("#fileImage").addEventListener("change", async (e) => { const fs = [...e.target.files]; e.target.value = ""; for (const f of fs) await insertImageBlob(f); });
  $("#btnPasteAny").addEventListener("click", pasteButton);
  $("#btnStaff").addEventListener("click", insertStaff);
  $("#btnNeck").addEventListener("click", () => insertNeck());
  $("#btnChordRow").addEventListener("click", insertChordRow);
  const neckPanel = buildNeckPanel((o) => insertNeck(o));
  $("#view-editor").append(neckPanel);
  $("#btnNeckPanel").addEventListener("click", () => { neckPanel.hidden = !neckPanel.hidden; });
  $("#selMove").addEventListener("click", moveToPageDialog);
  $("#zoneCopy").addEventListener("click", zoneCopy);
  $("#zoneCut").addEventListener("click", () => zoneCut(true));
  $("#zoneDup").addEventListener("click", zoneDuplicate);
  $("#zoneDel").addEventListener("click", () => zoneCut(false));
  document.addEventListener("paste", onPasteEvent);
  const onCopyEvent = (e) => {
    if (!S.piece || !clipboard || clipboard.markWritten || Date.now() - (clipboard.at || 0) > 1000) return; // solo justo tras copiar en la app
    const t = e.target;
    if (t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA"].includes(t.tagName))) return;
    if (window.getSelection()?.toString()) return; // copiando texto de la página: lo normal
    try { e.clipboardData.setData("text/plain", clipboard.mark); e.preventDefault(); clipboard.markWritten = true; }
    catch { clipboard.noMark = true; }
  };
  document.addEventListener("copy", onCopyEvent);
  document.addEventListener("cut", onCopyEvent);
  // arrastrar imágenes (desde el escritorio o desde otra web) sobre una hoja
  $("#pages").addEventListener("dragover", (e) => { if (S.piece && !S.locked && [...(e.dataTransfer?.types || [])].includes("Files")) e.preventDefault(); });
  $("#pages").addEventListener("drop", async (e) => {
    if (!S.piece || S.locked) return;
    const files = [...(e.dataTransfer?.files || [])].filter(f => /^image\//.test(f.type));
    if (!files.length) return;
    e.preventDefault();
    const pe = pageElAt(e.clientX, e.clientY);
    for (const f of files) await insertImageBlob(f, pe?.pageId, pe ? clientToPage(pe, e.clientX, e.clientY) : null);
  });
  $("#zoomIn").addEventListener("click", () => setZoom(S.zoom * 1.15));
  $("#zoomOut").addEventListener("click", () => setZoom(S.zoom / 1.15));
  $("#zoomFit").addEventListener("click", () => fitZoom());
  $("#lockBtn").addEventListener("click", () => setLocked(!S.locked));
  $("#undoBtn").addEventListener("click", undo);
  $("#redoBtn").addEventListener("click", redo);
  $("#edVideo").addEventListener("click", async () => {
    const v = await promptDialog("Vídeo de la pieza", "Dirección del vídeo para las etiquetas de bucle (vacío = ninguno)", S.piece.videoUrl, "https://…");
    if (v === null) return;
    const u = normalizeUrl(v);
    if (u && !isHttpUrl(u)) { toast("La dirección no es válida."); return; }
    S.piece.videoUrl = u; changed();
    toast(u ? "Vídeo asignado a la pieza" : "Vídeo quitado");
  });
  $("#edExport").addEventListener("click", async () => {
    finishInline(true);
    try {
      toast("Generando PDF…", 10000);
      const res = await exportPiecePdf(S.piece);
      toast(res.rasterObjs ? `PDF exportado (${res.rasterObjs} elemento(s) como imagen por sus símbolos o por estar en hoja girada)` : "PDF exportado (vectorial)");
    } catch (e) { console.error(e); toast("No se pudo exportar: " + (e?.message || e)); }
  });

  $$("#edTools [data-tool]").forEach(b => b.addEventListener("click", () => { clearPending(); setTool(b.dataset.tool); }));
  $$("#edTools .finger").forEach(b => b.addEventListener("click", () => { setTool("select"); setPending({ kind: "finger", n: Number(b.dataset.finger) }, `Toca la página para colocar el dedo ${b.dataset.finger}`); }));
  $("#btnLoop").addEventListener("click", async () => {
    const r = await loopDialog("", "");
    if (r) { setTool("select"); setPending({ kind: "loop", text: r.text, url: r.url }, `Toca la página para colocar ${r.text}`); }
  });
  $("#techSelect").addEventListener("change", (e) => {
    const v = e.target.value; e.target.value = "";
    if (v) { setTool("select"); setPending({ kind: "text", text: v }, `Toca la página para colocar «${v}»`); }
  });
  $("#btnChords").addEventListener("click", () => {
    const p = $("#chordPanel"); p.hidden = !p.hidden;
    if (!p.hidden) { rebuildChordList(); $("#chordSearch").focus(); }
  });
  $("#chordPanelClose").addEventListener("click", () => { $("#chordPanel").hidden = true; });
  $("#chordSearch").addEventListener("input", rebuildChordList);
  $("#btnNewChord").addEventListener("click", async () => {
    const r = await openChordEditor(null, "new");
    if (!r) return;
    if (r.action === "save") {
      await saveChordToLibrary(r.model);
      toast(`«${r.model.name}» guardado en tu biblioteca de acordes`);
    }
    setTool("select");
    setPending({ kind: "chord", model: r.model }, "Toca la página para colocarlo (Esc cancela)");
  });

  // Estilo: se aplica al momento (al escribir o con las flechitas) a lo seleccionado y queda como valor por defecto
  const bindStyle = (id, kind, settingKey, parse) => {
    const inp = $("#" + id);
    const handler = () => {
      const v = parse(inp.value);
      if (v === null) return;
      if (S.sel) applyStyle(kind, v);
      S.settings[settingKey] = v; persistSettings();
    };
    inp.addEventListener("input", handler);
    inp.addEventListener("change", handler);
  };
  const numParse = (min, max) => (raw) => { const n = parseFloat(String(raw).replace(",", ".")); return Number.isFinite(n) ? clamp(n, min, max) : null; };
  bindStyle("setFont", "font", "fontSize", numParse(4, 120));
  bindStyle("setLine", "line", "lineWidth", numParse(0.2, 20));
  bindStyle("setEraser", "eraser", "eraserSize", numParse(2, 80));
  bindStyle("setColor", "color", "color", v => v);
  bindStyle("setPatch", "patch", "patchColor", v => v);

  $("#selEdit").addEventListener("click", () => editObject(S.sel?.pageId, single()));
  $("#selDup").addEventListener("click", duplicateSelected);
  $("#selCopy").addEventListener("click", () => copySelected(false));
  $("#selCut").addEventListener("click", () => copySelected(true));
  $("#btnPaste").addEventListener("click", paste);
  $("#selDel").addEventListener("click", deleteSelected);
  $("#selFront").addEventListener("click", () => zOrder(true));
  $("#selBack").addEventListener("click", () => zOrder(false));

  $("#pages").addEventListener("wheel", (e) => {
    if (!S.piece || !(e.ctrlKey || e.metaKey)) return;
    e.preventDefault();
    setZoom(S.zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1), e);
  }, { passive: false });

  document.addEventListener("keydown", onKey);
}

function onKey(e) {
  if (!S.piece || organizerOpen() || document.querySelector(".modal-backdrop")) return;
  const t = e.target;
  const typing = t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
  if (typing) return;
  const mod = e.ctrlKey || e.metaKey;
  if (e.key === "Escape") {
    if (S.pending) { clearPending(); toast("Cancelado"); return; }
    if (!$("#chordPanel").hidden) { $("#chordPanel").hidden = true; return; }
    if (S.drag || S.draw) { cancelDrag(); return; }
    if (S.zone) { clearZone(); return; }
    clearSel(); setTool("select"); return;
  }
  if (mod && (e.key === "+" || e.key === "=")) { e.preventDefault(); setZoom(S.zoom * 1.15); return; }
  if (mod && e.key === "-") { e.preventDefault(); setZoom(S.zoom / 1.15); return; }
  if (mod && e.key === "0") { e.preventDefault(); fitZoom(); return; }
  if (S.locked) return;
  const k = e.key.toLowerCase();
  if (mod && k === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
  if (mod && (k === "y" || (k === "z" && e.shiftKey))) { e.preventDefault(); redo(); return; }
  if (S.zone) {
    if (mod && k === "c") { S.keyCopy = true; zoneCopy(); S.keyCopy = false; return; }
    if (mod && k === "x") { S.keyCopy = true; zoneCut(true); S.keyCopy = false; return; }
    if (mod && k === "d") { e.preventDefault(); zoneDuplicate(); return; }
    if (!mod && (e.key === "Delete" || e.key === "Backspace")) { e.preventDefault(); zoneCut(false); return; }
  }
  if (mod && k === "d") { e.preventDefault(); duplicateSelected(); return; }
  // Ctrl+C / Ctrl+X: no se cancela la tecla, así llega el evento «copy» y deja la marca en el portapapeles
  if (mod && k === "c") { if (S.sel) { S.keyCopy = true; copySelected(false); S.keyCopy = false; } return; }
  if (mod && k === "x") { if (S.sel) { S.keyCopy = true; copySelected(true); S.keyCopy = false; } return; }
  // Ctrl+V: lo resuelve el evento «paste» (puede traer una imagen o un texto de fuera); si no llega, se pega lo interno
  if (mod && k === "v") { const t0 = Date.now(); setTimeout(() => { if (S.pastedAt < t0 && clipboard && S.piece) paste(); }, 180); return; }
  if (mod && k === "a") {
    e.preventDefault();
    const pid = S.sel?.pageId || visiblePageId();
    const ids = pageById(pid)?.objs.map(o => o.id) || [];
    setTool("select");
    if (ids.length) select(pid, ids);
    return;
  }
  if (mod) return;
  if (S.sel) {
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSelected(); return; }
    if (e.key === "Enter") { e.preventDefault(); editObject(S.sel.pageId, single()); return; }
    const step = e.shiftKey ? 5 : 1;
    const arrows = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    // números de traste: ↑ ↓ los pasan a la cuerda de arriba / abajo
    const sel = selObjs();
    if ((e.key === "ArrowUp" || e.key === "ArrowDown") && sel.length && sel.every(o => o.tab)) {
      e.preventDefault();
      const pid = S.sel.pageId, dir = e.key === "ArrowUp" ? -1 : 1;
      commit(pid, arr => arr.filter(o => S.sel.ids.has(o.id)).forEach(o => {
        for (const st of pageById(pid).objs) {
          if (st.t !== "staff") continue;
          const l = nearestTabLine(st, { x: o.x, y: o.y }, 0.3);
          if (l && l.string + dir >= 1 && l.string + dir <= 6) { o.y = r2(l.y + dir * l.gap); break; }
        }
      }));
      refreshSelection();
      return;
    }
    if (arrows[e.key]) { e.preventDefault(); nudge(...arrows[e.key]); return; }
  }
  const tools = { v: "select", m: "zone", t: "text", n: "tabnum", p: "pen", l: "line", f: "arrow", o: "ellipse", r: "rect", b: "eraser" };
  if (tools[k]) { clearPending(); setTool(tools[k]); }
}
