// Editor de una pieza: vista continua de páginas, objetos, selección e historial
import { $, $$, el, svg, uid, clone, debounce, clamp, toast, dialog, promptDialog, openUrl, normalizeUrl, isHttpUrl } from "./util.js";
import { dbPut, bumpChanges, getSettings, saveSettings } from "./db.js";
import { getPdfDoc, renderToCanvas } from "./pdfjs.js";
import { renderObj, objBox, moveObj, resizeObj, offsetCopy } from "./objects.js";
import { chordLibrary, chordPreviewSvg, openChordEditor, saveChordToLibrary, isCustomChord, deleteChordFromLibrary, loadChordLibrary } from "./chords.js";
import { blankPage } from "./model.js";
import { exportPiecePdf } from "./exportpdf.js";

const S = {
  piece: null, settings: null, zoom: 1, fitMode: true, tool: "select", pending: null,
  sel: null,            // { pageId, oid }
  drag: null, draw: null, lastPress: null, inline: null,
  undo: [], redo: [], locked: false,
  pageEls: new Map(),   // pageId -> { div, canvas, svgEl, objLayer, selLayer, renderedZoom, task }
  observer: null, onClose: null, dirtySince: 0,
};
const HISTORY_MAX = 100;

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
  S.fitMode = true;
  buildPages();
  requestAnimationFrame(() => { fitZoom(); });
  updateHistoryButtons();
  updateSelActions();
}

export async function closeEditor() {
  finishInline(true);
  await saveNow.flushAsync();
  if (S.observer) S.observer.disconnect();
  for (const pe of S.pageEls.values()) { try { pe.task?.cancel(); } catch {} }
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
async function doSave() {
  if (!S.piece) return;
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
const saveNow = {
  async flushAsync() { saveDeb.flush(); await saving; },
};
function changed() { setSaveState("Guardando…"); saveDeb(); }

/* ================= Páginas ================= */
function pageById(id) { return S.piece.pages.find(p => p.id === id); }

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

  S.piece.pages.forEach((pg, i) => {
    const div = el("div", { class: "page", "data-page": pg.id });
    const canvas = el("canvas", { class: "page-canvas" });
    const svgEl = svg("svg", { class: "page-svg", viewBox: `0 0 ${pg.w} ${pg.h}`, preserveAspectRatio: "none" });
    const objLayer = svg("g", { class: "obj-layer" });
    const tmpLayer = svg("g", { class: "tmp-layer" });
    const selLayer = svg("g", { class: "sel-layer" });
    svgEl.append(objLayer, tmpLayer, selLayer);
    if (pg.src.kind === "pdf") div.append(canvas);
    div.append(svgEl, el("div", { class: "page-num", text: `${i + 1} / ${S.piece.pages.length}` }));
    host.append(div);
    const pe = { pageId: pg.id, div, canvas, svgEl, objLayer, tmpLayer, selLayer, renderedZoom: 0, task: null, visible: false };
    S.pageEls.set(pg.id, pe);
    attachPageEvents(pe);
    renderPageObjs(pg.id);
    S.observer.observe(div);
  });
  applyZoomSizes();
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
  if (!S.piece || !S.pageEls.has(pe.pageId)) return;
  const pg = pageById(pe.pageId);
  const zoom = S.zoom;
  const dpr = window.devicePixelRatio || 1;
  let scale = zoom * dpr;
  const maxW = 5000, maxArea = 22e6;
  scale = Math.min(scale, maxW / pg.w, Math.sqrt(maxArea / (pg.w * pg.h)));
  const doc = await getPdfDoc(S.piece.pdfId);
  const page = await doc.getPage(pg.src.index + 1);
  const off = document.createElement("canvas");
  const task = await renderToCanvas(page, off, scale);
  pe.task = task;
  try { await task.promise; } catch (e) { if (e?.name === "RenderingCancelledException") return; throw e; }
  pe.task = null;
  if (!S.pageEls.has(pe.pageId)) return;
  pe.canvas.width = off.width; pe.canvas.height = off.height;
  pe.canvas.getContext("2d").drawImage(off, 0, 0);
  pe.renderedZoom = zoom;
  pe.pendingZoom = null;
  off.width = off.height = 0;
}

/* ================= Zoom ================= */
function fitZoom() {
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
  // mantener el punto central de la pantalla
  const cy = anchorEvt ? anchorEvt.clientY : window.innerHeight / 2;
  const docY = window.scrollY + cy;
  const topOfPages = $("#pages").getBoundingClientRect().top + window.scrollY;
  S.zoom = nz; S.fitMode = false;
  applyZoomSizes();
  const newDocY = topOfPages + (docY - topOfPages) * (nz / old);
  window.scrollTo({ top: newDocY - cy });
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
function rerenderObj(pageId, o) {
  const pe = S.pageEls.get(pageId);
  const old = pe.objLayer.querySelector(`[data-oid="${o.id}"]`);
  const n = renderObj(o);
  if (old) old.replaceWith(n); else pe.objLayer.append(n);
}
function findObj(pageId, oid) { return pageById(pageId)?.objs.find(o => o.id === oid); }

/* ---------- Historial (por pieza) ---------- */
function commit(pageId, mutate, label = "") {
  const pg = pageById(pageId);
  const before = clone(pg.objs);
  mutate(pg.objs);
  const after = clone(pg.objs);
  if (JSON.stringify(before) === JSON.stringify(after)) return;
  S.undo.push({ kind: "objs", pageId, before, after, label });
  if (S.undo.length > HISTORY_MAX) S.undo.shift();
  S.redo = [];
  renderPageObjs(pageId);
  updateHistoryButtons();
  changed();
}
function commitPages(mutate, label = "") {
  const before = clone(S.piece.pages);
  mutate(S.piece.pages);
  const after = clone(S.piece.pages);
  S.undo.push({ kind: "pages", before, after, label });
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
    const pg = pageById(entry.pageId);
    if (!pg) return;
    pg.objs = clone(state);
    if (S.sel && !findObj(S.sel.pageId, S.sel.oid)) clearSel();
    renderPageObjs(entry.pageId);
    scrollToPageIfHidden(entry.pageId);
  } else {
    S.piece.pages = clone(state);
    clearSel();
    buildPages();
  }
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
function select(pageId, oid) { S.sel = { pageId, oid }; refreshSelection(); updateSelActions(); }
function clearSel() {
  if (S.sel) { const pe = S.pageEls.get(S.sel.pageId); if (pe) pe.selLayer.innerHTML = ""; }
  S.sel = null; updateSelActions();
}
function selectedObj() { return S.sel ? findObj(S.sel.pageId, S.sel.oid) : null; }
function boxOf(pageId, o) {
  const pe = S.pageEls.get(pageId);
  return objBox(o, pe?.objLayer.querySelector(`[data-oid="${o.id}"]`));
}
function refreshSelection() {
  for (const pe of S.pageEls.values()) pe.selLayer.innerHTML = "";
  const o = selectedObj();
  if (!o) return;
  const pe = S.pageEls.get(S.sel.pageId);
  const b = boxOf(S.sel.pageId, o);
  const pad = 2 / S.zoom * 1.5;
  pe.selLayer.append(svg("rect", { class: "sel-rect", x: b.x - pad, y: b.y - pad, width: b.w + pad * 2, height: b.h + pad * 2, "stroke-width": 1.5 / S.zoom, "stroke-dasharray": `${5 / S.zoom} ${4 / S.zoom}` }));
  const hx = o.t === "line" ? o.x2 : b.x + b.w + pad, hy = o.t === "line" ? o.y2 : b.y + b.h + pad;
  pe.selLayer.append(svg("circle", { class: "sel-handle", cx: hx, cy: hy, r: 7 / S.zoom, "stroke-width": 1.5 / S.zoom, "data-handle": "1" }));
}
function updateSelActions() {
  const o = selectedObj();
  for (const id of ["selDup", "selDel", "selFront", "selBack"]) $("#" + id).disabled = !o;
  $("#edTools .sel-actions").hidden = !o;
  $("#selEdit").disabled = !o || !["text", "chord", "loop", "finger"].includes(o.t);
}

/* ================= Herramientas ================= */
function setTool(t) {
  S.tool = t;
  $$("#edTools [data-tool]").forEach(b => b.classList.toggle("active", b.dataset.tool === t));
  $("#pages").dataset.tool = t;
  if (t !== "select") clearSel();
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

function syncToolInputs() {
  $("#setFont").value = S.settings.fontSize;
  $("#setLine").value = S.settings.lineWidth;
  $("#setColor").value = S.settings.color;
  $("#setPatch").value = S.settings.patchColor;
}
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

function attachPageEvents(pe) {
  const s = pe.svgEl;
  s.addEventListener("pointerdown", (evt) => onDown(pe, evt));
  s.addEventListener("pointermove", (evt) => onMove(pe, evt));
  s.addEventListener("pointerup", (evt) => onUp(pe, evt));
  s.addEventListener("pointercancel", () => { cancelDrag(); });
}

function onDown(pe, evt) {
  if (!S.piece || evt.button > 0) return;
  const pg = pageById(pe.pageId);
  const p = svgPoint(pe.svgEl, evt);
  const oid = objIdFromTarget(evt.target);

  if (S.locked) {
    if (oid) { const o = findObj(pe.pageId, oid); if (o?.t === "loop") { openLoop(o); evt.preventDefault(); } }
    return;
  }
  if (S.inline) { finishInline(true); }
  evt.preventDefault();

  if (S.pending) { placePending(pe.pageId, p); return; }

  if (S.tool === "select") {
    if (evt.target.dataset?.handle && selectedObj()) {
      const o = selectedObj();
      S.drag = { type: "resize", pageId: pe.pageId, start: p, orig: clone(o), box0: boxOf(pe.pageId, o) };
      pe.svgEl.setPointerCapture(evt.pointerId);
      return;
    }
    if (oid) {
      const o = findObj(pe.pageId, oid);
      if (evt.ctrlKey || evt.metaKey) { if (o.t === "loop") { openLoop(o); return; } }
      const lp = S.lastPress;
      const dbl = lp && lp.oid === oid && performance.now() - lp.time < 450 && Math.hypot(evt.clientX - lp.x, evt.clientY - lp.y) < 8;
      if (dbl) { S.lastPress = null; select(pe.pageId, oid); editObject(pe.pageId, o); return; }
      select(pe.pageId, oid);
      S.lastPress = { oid, time: performance.now(), x: evt.clientX, y: evt.clientY };
      S.drag = { type: "move", pageId: pe.pageId, start: p, orig: clone(o), moved: false };
      pe.svgEl.setPointerCapture(evt.pointerId);
      return;
    }
    clearSel();
    return;
  }

  if (S.tool === "text") {
    const o = { id: uid("o"), t: "text", x: p.x, y: p.y + S.settings.fontSize * 0.35, size: S.settings.fontSize, text: "", color: S.settings.color, font: "sans", bold: true };
    startInline(pe.pageId, o, true);
    return;
  }
  if (S.tool === "line" || S.tool === "rect") {
    const o = S.tool === "line"
      ? { id: uid("o"), t: "line", x1: p.x, y1: p.y, x2: p.x, y2: p.y, w: S.settings.lineWidth, color: S.settings.color }
      : { id: uid("o"), t: "rect", x: p.x, y: p.y, w: 0.5, h: 0.5, fill: S.settings.patchColor };
    S.draw = { pageId: pe.pageId, o, start: p };
    pe.tmpLayer.innerHTML = "";
    pe.tmpLayer.append(renderObj(o));
    pe.svgEl.setPointerCapture(evt.pointerId);
  }
}

function onMove(pe, evt) {
  if (S.drag && S.drag.pageId === pe.pageId) {
    const p = svgPoint(pe.svgEl, evt);
    let dx = p.x - S.drag.start.x, dy = p.y - S.drag.start.y;
    const o = findObj(pe.pageId, S.sel?.oid);
    if (!o) return;
    if (S.drag.type === "move") {
      if (!S.drag.moved && Math.hypot(dx, dy) * S.zoom < 3) return;
      S.drag.moved = true;
      if (evt.shiftKey) { if (Math.abs(dx) > Math.abs(dy)) dy = 0; else dx = 0; }
      const g = pe.objLayer.querySelector(`[data-oid="${o.id}"]`);
      g?.setAttribute("transform", `translate(${dx},${dy})`);
      pe.selLayer.setAttribute("transform", `translate(${dx},${dy})`);
      S.drag.dx = dx; S.drag.dy = dy;
    } else {
      const tmp = clone(S.drag.orig);
      resizeObj(tmp, S.drag.orig, dx, dy, S.drag.box0);
      Object.assign(o, tmp);
      rerenderObj(pe.pageId, o);
      refreshSelection();
      S.drag.changed = true;
    }
    return;
  }
  if (S.draw && S.draw.pageId === pe.pageId) {
    const p = svgPoint(pe.svgEl, evt);
    const o = S.draw.o, a = S.draw.start;
    if (o.t === "line") {
      let x2 = p.x, y2 = p.y;
      if (evt.shiftKey) { if (Math.abs(x2 - a.x) > Math.abs(y2 - a.y)) y2 = a.y; else x2 = a.x; }
      o.x2 = x2; o.y2 = y2;
    } else {
      o.x = Math.min(a.x, p.x); o.y = Math.min(a.y, p.y);
      o.w = Math.max(0.5, Math.abs(p.x - a.x)); o.h = Math.max(0.5, Math.abs(p.y - a.y));
    }
    pe.tmpLayer.innerHTML = "";
    pe.tmpLayer.append(renderObj(o));
  }
}

function onUp(pe) {
  if (S.drag && S.drag.pageId === pe.pageId) {
    const d = S.drag; S.drag = null;
    const o = findObj(pe.pageId, S.sel?.oid);
    pe.selLayer.removeAttribute("transform");
    if (!o) return;
    if (d.type === "move") {
      const g = pe.objLayer.querySelector(`[data-oid="${o.id}"]`);
      g?.removeAttribute("transform");
      if (d.moved && (d.dx || d.dy)) {
        S.lastPress = null;
        commit(pe.pageId, objs => { const t = objs.find(x => x.id === o.id); moveObj(t, d.dx, d.dy); });
      }
    } else if (d.changed) {
      const final = clone(o);
      Object.assign(o, d.orig); // restaurar para que el historial guarde el "antes"
      commit(pe.pageId, objs => { const i = objs.findIndex(x => x.id === o.id); objs[i] = final; });
      rememberSize(final);
    }
    refreshSelection();
    return;
  }
  if (S.draw && S.draw.pageId === pe.pageId) {
    const { o } = S.draw; S.draw = null;
    pe.tmpLayer.innerHTML = "";
    const big = o.t === "line" ? Math.hypot(o.x2 - o.x1, o.y2 - o.y1) > 2 : (o.w > 2 && o.h > 2);
    if (!big) return;
    commit(pe.pageId, objs => objs.push(o));
    select(pe.pageId, o.id);
  }
}
function cancelDrag() {
  if (S.drag) {
    const pe = S.pageEls.get(S.drag.pageId);
    const o = findObj(S.drag.pageId, S.sel?.oid);
    if (o && S.drag.type === "resize") { Object.assign(o, S.drag.orig); rerenderObj(S.drag.pageId, o); }
    if (o) pe?.objLayer.querySelector(`[data-oid="${o.id}"]`)?.removeAttribute("transform");
    pe?.selLayer.removeAttribute("transform");
    S.drag = null; refreshSelection();
  }
  if (S.draw) { S.pageEls.get(S.draw.pageId)?.tmpLayer.replaceChildren(); S.draw = null; }
}

function rememberSize(o) {
  const map = { chord: "chordSize", finger: "fingerSize", loop: "loopSize" };
  if (map[o.t]) { S.settings[map[o.t]] = Math.round(o.size * 10) / 10; persistSettings(); }
  if (o.t === "text") { S.settings.fontSize = Math.round(o.size); $("#setFont").value = S.settings.fontSize; persistSettings(); }
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
  if (!isNew) pe.objLayer.querySelector(`[data-oid="${o.id}"]`)?.setAttribute("opacity", "0");
  S.inline = { pageId, o, isNew, input };
  input.addEventListener("keydown", e => {
    e.stopPropagation();
    if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); finishInline(true); }
    else if (e.key === "Escape") { e.preventDefault(); finishInline(false); }
  });
  input.addEventListener("blur", () => { if (S.inline?.input === input) finishInline(true); });
  input.focus(); input.select();
  setTimeout(() => { if (document.activeElement !== input && S.inline?.input === input) { input.focus(); } }, 0);
}
function finishInline(ok) {
  const st = S.inline; if (!st) return;
  S.inline = null;
  const value = st.input.value;
  st.input.remove();
  const pe = S.pageEls.get(st.pageId);
  pe?.objLayer.querySelector(`[data-oid="${st.o.id}"]`)?.removeAttribute("opacity");
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
  const o = selectedObj(); if (!o) return;
  const pid = S.sel.pageId;
  clearSel();
  commit(pid, objs => { const i = objs.findIndex(x => x.id === o.id); if (i >= 0) objs.splice(i, 1); });
}
function duplicateSelected() {
  const o = selectedObj(); if (!o) return;
  const c = offsetCopy(o, 12); c.id = uid("o");
  const pid = S.sel.pageId;
  commit(pid, objs => objs.push(c));
  select(pid, c.id);
}
function zOrder(front) {
  const o = selectedObj(); if (!o) return;
  const pid = S.sel.pageId;
  commit(pid, objs => { const i = objs.findIndex(x => x.id === o.id); const [x] = objs.splice(i, 1); if (front) objs.push(x); else objs.unshift(x); });
}
function nudge(dx, dy) {
  const o = selectedObj(); if (!o) return;
  commit(S.sel.pageId, objs => moveObj(objs.find(x => x.id === o.id), dx, dy));
}
function applyStyleToSelection(kind) {
  const o = selectedObj(); if (!o) return;
  const st = S.settings;
  commit(S.sel.pageId, objs => {
    const t = objs.find(x => x.id === o.id);
    if (kind === "color" && (t.t === "text" || t.t === "line")) t.color = st.color;
    if (kind === "font" && t.t === "text") t.size = st.fontSize;
    if (kind === "line" && t.t === "line") t.w = st.lineWidth;
    if (kind === "patch" && t.t === "rect") t.fill = st.patchColor;
  });
}

/* ================= Panel de acordes ================= */
function rebuildChordList() {
  const list = $("#chordList");
  const q = ($("#chordSearch").value || "").trim().toLowerCase();
  list.innerHTML = "";
  const lib = chordLibrary();
  for (const [name, m] of Object.entries(lib)) {
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
  $("#edAddPage").addEventListener("click", () => {
    commitPages(pages => pages.push(blankPage()), "hoja");
    requestAnimationFrame(() => S.pageEls.get(S.piece.pages[S.piece.pages.length - 1].id)?.div.scrollIntoView({ behavior: "smooth", block: "start" }));
    toast("Hoja A4 en blanco añadida al final");
  });
  $("#edExport").addEventListener("click", async () => {
    finishInline(true);
    try {
      toast("Generando PDF…", 10000);
      const res = await exportPiecePdf(S.piece, (pageId, oid) => S.pageEls.get(pageId)?.objLayer.querySelector(`[data-oid="${oid}"]`));
      toast(res.rasterObjs ? `PDF exportado (${res.rasterObjs} elemento(s) como imagen por sus símbolos)` : "PDF exportado (vectorial)");
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
      setTool("select");
      setPending({ kind: "chord", model: r.model }, "Toca la página para colocarlo (Esc cancela)");
    } else if (r.action === "place") {
      setTool("select");
      setPending({ kind: "chord", model: r.model }, "Toca la página para colocarlo (Esc cancela)");
    }
  });

  $("#setFont").addEventListener("change", e => { S.settings.fontSize = clamp(Number(e.target.value) || 12, 4, 120); persistSettings(); applyStyleToSelection("font"); });
  $("#setLine").addEventListener("change", e => { S.settings.lineWidth = clamp(Number(e.target.value) || 1, 0.2, 20); persistSettings(); applyStyleToSelection("line"); });
  $("#setColor").addEventListener("change", e => { S.settings.color = e.target.value; persistSettings(); applyStyleToSelection("color"); });
  $("#setPatch").addEventListener("change", e => { S.settings.patchColor = e.target.value; persistSettings(); applyStyleToSelection("patch"); });

  $("#selEdit").addEventListener("click", () => editObject(S.sel?.pageId, selectedObj()));
  $("#selDup").addEventListener("click", duplicateSelected);
  $("#selDel").addEventListener("click", deleteSelected);
  $("#selFront").addEventListener("click", () => zOrder(true));
  $("#selBack").addEventListener("click", () => zOrder(false));

  // Zoom con Ctrl + rueda
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
  if (mod) return;
  if (S.sel) {
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSelected(); return; }
    if (e.key === "Enter") { e.preventDefault(); editObject(S.sel.pageId, selectedObj()); return; }
    const step = e.shiftKey ? 5 : 1;
    const arrows = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (arrows[e.key]) { e.preventDefault(); nudge(...arrows[e.key]); return; }
  }
  const tools = { v: "select", t: "text", l: "line", r: "rect" };
  if (tools[k]) { clearPending(); setTool(tools[k]); }
}
