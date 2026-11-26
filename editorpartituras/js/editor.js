// Editor de una pieza: vista continua de páginas, objetos, selección múltiple, portapapeles e historial
import { $, $$, el, svg, uid, clone, debounce, clamp, toast, dialog, promptDialog, openUrl, normalizeUrl, isHttpUrl } from "./util.js";
import { dbPut, bumpChanges, getSettings, saveSettings } from "./db.js";
import { getPdfDoc, renderToCanvas } from "./pdfjs.js";
import { renderObj, objBox, moveObj, resizeObj, simplify, styleOf, setClipResolver } from "./objects.js";
import { clipUrl } from "./clips.js";
import { chordLibrary, chordPreviewSvg, openChordEditor, saveChordToLibrary, isCustomChord, deleteChordFromLibrary, loadChordLibrary } from "./chords.js";
import { blankPage } from "./model.js";
import { exportPiecePdf } from "./exportpdf.js";

setClipResolver(clipUrl);

const S = {
  piece: null, settings: null, zoom: 1, fitMode: true, tool: "select", pending: null,
  sel: null,            // { pageId, ids: Set }
  drag: null, draw: null, lastPress: null, inline: null,
  undo: [], redo: [], locked: false,
  pageEls: new Map(),   // pageId -> { div, canvas, svgEl, objLayer, tmpLayer, selLayer, ... }
  observer: null, onClose: null,
};
let clipboard = null;   // { objs, pageId, pieceId } — se conserva al cambiar de pieza
const HISTORY_MAX = 120;
const TOOLS_DRAW = ["line", "arrow", "rect", "ellipse", "cutzone", "copyzone"];

/* ================= Apertura / cierre ================= */
export async function openEditor(piece, onClose) {
  S.piece = piece; S.onClose = onClose;
  S.settings = await getSettings();
  S.undo = []; S.redo = []; S.sel = null; S.pending = null; S.locked = false;
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
}

export async function closeEditor() {
  finishInline(true);
  saveDeb.flush();
  await saving;
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
  if (!S.piece) return saving;
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
    svgEl.append(objLayer, selLayer, tmpLayer);
    if (pg.src.kind === "pdf") div.append(canvas);
    const foot = el("div", { class: "page-foot" },
      el("span", { class: "muted small", text: `Hoja ${i + 1} de ${n}` }),
      el("button", { class: "btn small edit-only", type: "button", text: "+ Hoja en blanco debajo", onclick: () => addBlankAfter(pg.id) }),
      el("button", { class: "btn small danger edit-only", type: "button", text: "Eliminar hoja", onclick: () => deletePage(pg.id) }));
    div.append(svgEl, foot);
    host.append(div);
    const pe = { pageId: pg.id, div, canvas, svgEl, objLayer, tmpLayer, selLayer, renderedZoom: 0, task: null, visible: false };
    S.pageEls.set(pg.id, pe);
    attachPageEvents(pe);
    renderPageObjs(pg.id);
    S.observer.observe(div);
  });
  applyZoomSizes();
}

function addBlankAfter(pageId) {
  const i = pageIndex(pageId);
  const ref = pageById(pageId);
  const np = blankPage(ref?.src.kind === "blank" ? ref.w : undefined, ref?.src.kind === "blank" ? ref.h : undefined);
  commitPages(pages => pages.splice(i + 1, 0, np));
  requestAnimationFrame(() => S.pageEls.get(np.id)?.div.scrollIntoView({ behavior: "smooth", block: "start" }));
  toast("Hoja en blanco añadida (Ctrl+Z para deshacer)");
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
  refreshSelection();
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
  const doc = await getPdfDoc(S.piece.pdfId);
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
  const before = {};
  for (const id of ids) before[id] = clone(pageById(id).objs);
  mutate(...ids.map(id => pageById(id).objs));
  const after = {};
  let same = true;
  for (const id of ids) { after[id] = clone(pageById(id).objs); if (JSON.stringify(after[id]) !== JSON.stringify(before[id])) same = false; }
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
      pg.objs = clone(objs);
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
  if (o) {
    const b = boxOf(S.sel.pageId, o);
    const hx = o.t === "line" ? o.x2 : b.x + b.w + pad, hy = o.t === "line" ? o.y2 : b.y + b.h + pad;
    pe.selLayer.append(svg("circle", { class: "sel-handle", cx: hx, cy: hy, r: 7 / z, "stroke-width": 1.5 / z, "data-handle": "1" }));
  }
}
function updateSelUi() {
  const objs = selObjs(), o = objs.length === 1 ? objs[0] : null;
  $("#ctxBar .sel-actions").hidden = !objs.length;
  $("#ctxBar").hidden = !objs.length && !clipboard;
  $("#selCount").textContent = objs.length > 1 ? `${objs.length} elementos` : "";
  $("#selEdit").hidden = !o || !["text", "chord", "loop", "finger"].includes(o.t);
  $("#btnPaste").hidden = !clipboard;
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
  if (t !== "select") clearSel();
  if (t === "cutzone" || t === "copyzone") toast("Arrastra un rectángulo sobre la partitura");
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
    else if (S.tool === "ellipse") o = { id: uid("o"), t: "ellipse", x: p.x, y: p.y, w: 0.5, h: 0.5, sw: st.lineWidth, color: st.color };
    else o = { id: "zone", t: "zone", x: p.x, y: p.y, w: 0.5, h: 0.5 };
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
    } else if (dr.type === "marquee") {
      const x = Math.min(dr.start.x, p.x), y = Math.min(dr.start.y, p.y);
      dr.box = { x, y, w: Math.abs(p.x - dr.start.x), h: Math.abs(p.y - dr.start.y) };
      pe.tmpLayer.innerHTML = "";
      pe.tmpLayer.append(svg("rect", { class: "marquee", x, y, width: dr.box.w, height: dr.box.h, "stroke-width": 1 / S.zoom }));
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
    if (d.type === "move") {
      if (!d.moved) { refreshSelection(); return; }
      S.lastPress = null;
      const target = pageElAt(evt.clientX, evt.clientY);
      if (target && target.pageId !== pe.pageId) { moveSelectionToPage(pe, target, d, evt); return; }
      if (d.dx || d.dy) {
        const ids = new Set(S.sel.ids);
        commit(pe.pageId, objsArr => objsArr.filter(o => ids.has(o.id)).forEach(o => moveObj(o, d.dx, d.dy)));
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
    if (dr.type === "marquee") {
      if (!dr.box || dr.box.w * S.zoom < 4 || dr.box.h * S.zoom < 4) return;
      const b = dr.box;
      const hit = pageById(pe.pageId).objs.filter(o => {
        const ob = boxOf(pe.pageId, o);
        return ob.x < b.x + b.w && ob.x + ob.w > b.x && ob.y < b.y + b.h && ob.y + ob.h > b.y;
      }).map(o => o.id);
      if (hit.length) select(pe.pageId, hit, dr.add);
      return;
    }
    if (dr.type === "path") {
      const o = dr.o;
      o.pts = simplify(o.pts, 0.35 / Math.max(0.5, S.zoom / 1.33));
      commit(pe.pageId, arr => arr.push(o));
      return; // se puede seguir dibujando sin cambiar de herramienta
    }
    const o = dr.o;
    if (o.t === "zone") { makeClip(pe.pageId, o, S.tool === "cutzone"); return; }
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

/* ---------- Recortes de partitura ---------- */
function makeClip(pageId, zone, cut) {
  const pg = pageById(pageId);
  if (zone.w * S.zoom < 6 || zone.h * S.zoom < 6) return;
  if (pg.src.kind !== "pdf") { toast("Esta hoja no tiene partitura que recortar (es una hoja en blanco)."); return; }
  const x = clamp(zone.x, 0, pg.w), y = clamp(zone.y, 0, pg.h);
  const w = clamp(zone.x + zone.w, 0, pg.w) - x, h = clamp(zone.y + zone.h, 0, pg.h) - y;
  const clipO = {
    id: uid("o"), t: "clip", x, y, scale: 1, sx: x, sy: y, sw: w, sh: h,
    src: { pdfId: S.piece.pdfId, index: pg.src.index, view: pg.src.view, rotate: pg.src.rotate || 0 },
  };
  commit(pageId, arr => {
    if (cut) arr.push({ id: uid("o"), t: "rect", x, y, w, h, fill: "#ffffff" });
    arr.push(clipO);
  });
  setTool("select");
  select(pageId, clipO.id);
  toast(cut ? "Zona cortada: arrástrala donde quieras (también a otra hoja)" : "Zona copiada encima: arrástrala o usa Ctrl+C / Ctrl+V");
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
  const input = el("input", { type: "text", class: "inline-text", value: o.text || "", placeholder: isNew ? "Escribe aquí" : "" });
  const z = S.zoom;
  Object.assign(input.style, {
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
      const o = { ...st.o, text: value };
      commit(st.pageId, objs => objs.push(o));
      setTool("select");
      select(st.pageId, o.id);
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
function copySelected(cut = false) {
  const objs = selObjs(); if (!objs.length) return;
  clipboard = { objs: clone(objs), pageId: S.sel.pageId, pieceId: S.piece.id };
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
  $("#edTitle").addEventListener("click", async () => {
    const v = await promptDialog("Título de la pieza", "Título", S.piece.title);
    if (v !== null && v.trim()) { S.piece.title = v.trim(); $("#edTitle").textContent = S.piece.title; changed(); }
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
  if (!S.piece || document.querySelector(".modal-backdrop")) return;
  const t = e.target;
  const typing = t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
  if (typing) return;
  const mod = e.ctrlKey || e.metaKey;
  if (e.key === "Escape") {
    if (S.pending) { clearPending(); toast("Cancelado"); return; }
    if (!$("#chordPanel").hidden) { $("#chordPanel").hidden = true; return; }
    if (S.drag || S.draw) { cancelDrag(); return; }
    clearSel(); setTool("select"); return;
  }
  if (mod && (e.key === "+" || e.key === "=")) { e.preventDefault(); setZoom(S.zoom * 1.15); return; }
  if (mod && e.key === "-") { e.preventDefault(); setZoom(S.zoom / 1.15); return; }
  if (mod && e.key === "0") { e.preventDefault(); fitZoom(); return; }
  if (S.locked) return;
  const k = e.key.toLowerCase();
  if (mod && k === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
  if (mod && (k === "y" || (k === "z" && e.shiftKey))) { e.preventDefault(); redo(); return; }
  if (mod && k === "d") { e.preventDefault(); duplicateSelected(); return; }
  if (mod && k === "c") { if (S.sel) { e.preventDefault(); copySelected(false); } return; }
  if (mod && k === "x") { if (S.sel) { e.preventDefault(); copySelected(true); } return; }
  if (mod && k === "v") { if (clipboard) { e.preventDefault(); paste(); } return; }
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
    if (arrows[e.key]) { e.preventDefault(); nudge(...arrows[e.key]); return; }
  }
  const tools = { v: "select", t: "text", p: "pen", l: "line", f: "arrow", o: "ellipse", r: "rect", b: "eraser", x: "cutzone", c: "copyzone" };
  if (tools[k]) { clearPending(); setTool(tools[k]); }
}
