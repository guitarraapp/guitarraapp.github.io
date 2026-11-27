// Arranque, biblioteca y página «Más»
import { $, $$, el, toast, fmtDate, dialog, confirmDialog, promptDialog, APP_VERSION, clamp } from "./util.js";
import { dbAll, dbPut, getSettings, saveSettings, getBackupState, saveBackupState } from "./db.js";
import { importPdfFile, createBlankPiece, listPieces, deletePiece, duplicatePiece, getPiece } from "./model.js";
import { openEditor, wireEditorUi, closeEditor, editorActive } from "./editor.js";
import { exportFullBackup, exportPieceFile, readBackupFile, applyBackup, backupNeeded } from "./backup.js";
import { exportPiecePdf } from "./exportpdf.js";
import { renderIdeas } from "./ideas.js";
import { HELP_HTML } from "./help.js";
import { templateDialog, templateObjs } from "./tools3.js";

/* ================= Vistas ================= */
function show(view) {
  for (const v of ["library", "editor", "more"]) $(`#view-${v}`).hidden = v !== view;
  document.body.dataset.view = view;
  window.scrollTo(0, 0);
}

/* ================= Biblioteca ================= */
let libTag = null;
async function renderLibrary() {
  const all = await listPieces();
  const q = ($("#libSearch").value || "").trim().toLowerCase();
  const fav = $("#libFav").checked;
  // etiquetas: chips para filtrar con un toque
  const counts = new Map();
  for (const p of all) for (const t of p.tags || []) counts.set(t, (counts.get(t) || 0) + 1);
  if (libTag && !counts.has(libTag)) libTag = null;
  const tagsBox = $("#libTags");
  tagsBox.innerHTML = "";
  if (counts.size) {
    tagsBox.append(el("span", { class: "muted small", text: "Etiquetas:" }));
    for (const [t, n] of [...counts].sort((a, b) => a[0].localeCompare(b[0], "es"))) {
      tagsBox.append(el("button", { class: "tag tag-btn" + (libTag === t ? " on" : ""), type: "button", text: `${t} ${n}`, onclick: () => { libTag = libTag === t ? null : t; renderLibrary(); } }));
    }
  }
  const norm = (s) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const nq = norm(q);
  let list = all.filter(p => (!fav || p.favorite) && (!libTag || (p.tags || []).includes(libTag)) && (!nq || norm(`${p.title} ${(p.tags || []).join(" ")}`).includes(nq)));
  const sort = $("#libSort").value;
  if (sort === "title") list = list.sort((a, b) => a.title.localeCompare(b.title, "es", { numeric: true }));
  else if (sort === "created") list = list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  $("#libStats").textContent = `${all.length} pieza(s)`;
  const grid = $("#libGrid");
  grid.innerHTML = "";
  if (!list.length) {
    grid.append(el("div", { class: "empty" },
      el("h2", { text: all.length ? "Nada coincide con la búsqueda" : "Tu biblioteca está vacía" }),
      all.length ? null : el("p", { text: "Importa un PDF de partitura o crea una hoja en blanco para empezar." })));
    return;
  }
  for (const p of list) {
    const thumb = p.thumb ? el("img", { src: p.thumb, alt: "", class: "thumb" }) : el("div", { class: "thumb blank", text: "𝄞" });
    const star = el("button", { class: "star" + (p.favorite ? " on" : ""), type: "button", title: p.favorite ? "Quitar de favoritas" : "Marcar favorita", text: p.favorite ? "★" : "☆" });
    star.addEventListener("click", async (e) => { e.stopPropagation(); p.favorite = !p.favorite; await dbPut("pieces", p); renderLibrary(); });
    const menu = el("button", { class: "btn small", type: "button", text: "⋯", title: "Más acciones" });
    menu.addEventListener("click", (e) => { e.stopPropagation(); pieceMenu(p); });
    const card = el("div", { class: "card", tabindex: 0 },
      thumb,
      el("div", { class: "card-body" },
        el("div", { class: "card-title" }, star, el("span", { text: p.title })),
        el("div", { class: "muted small", text: `${p.pages.length} pág. · ${fmtDate(p.updatedAt)}` }),
        (p.tags || []).length ? el("div", { class: "tags" }, p.tags.map(t => el("span", { class: "tag", text: t }))) : null),
      el("div", { class: "card-actions" }, menu));
    card.addEventListener("click", () => openPiece(p.id));
    card.addEventListener("keydown", (e) => { if (e.key === "Enter") openPiece(p.id); });
    grid.append(card);
  }
}

async function openPiece(id, opts = {}) {
  const p = await getPiece(id);
  if (!p) { toast("No se encuentra la pieza."); return; }
  show("editor");
  await openEditor(p, (_closed, next) => {
    show("library"); renderLibrary(); refreshBackupBanner();
    if (next?.open) openPiece(next.open);
  }, opts);
}

async function pieceMenu(p) {
  const r = await dialog({
    title: p.title,
    body: el("p", { class: "muted", text: `${p.pages.length} página(s). Creada: ${fmtDate(p.createdAt)}.` }),
    buttons: [
      { label: "Título y etiquetas", value: "meta" },
      { label: "Hojas…", value: "pages" },
      { label: "Separar en piezas…", value: "split" },
      { label: "Duplicar", value: "dup" },
      { label: "Exportar PDF", value: "pdf" },
      { label: "Exportar pieza (.ptbak)", value: "file" },
      { label: "Eliminar", value: "del", danger: true },
    ],
  });
  if (r === "meta") {
    const box = el("div", {},
      el("div", { class: "field" }, el("label", { text: "Título" }), el("input", { type: "text", id: "mTitle", value: p.title, class: "full" })),
      el("div", { class: "field" }, el("label", { text: "Etiquetas (separadas por comas)" }), el("input", { type: "text", id: "mTags", value: (p.tags || []).join(", "), class: "full", placeholder: "Ej: clásica, CAGED, estudiando" })));
    const v = await dialog({ title: "Título y etiquetas", body: box, buttons: [{ label: "Cancelar", value: null }, { label: "Guardar", primary: true, value: c => ({ t: c.querySelector("#mTitle").value, g: c.querySelector("#mTags").value }) }] });
    if (v) {
      p.title = v.t.trim() || p.title;
      p.tags = v.g.split(",").map(s => s.trim()).filter(Boolean).slice(0, 30);
      p.updatedAt = Date.now();
      await dbPut("pieces", p); await bumpAndRefresh();
    }
  } else if (r === "pages") {
    openPiece(p.id, { organizer: "pages" });
  } else if (r === "split") {
    openPiece(p.id, { organizer: "split" });
  } else if (r === "dup") {
    await duplicatePiece(p); await bumpAndRefresh(); toast("Pieza duplicada");
  } else if (r === "pdf") {
    try { toast("Generando PDF…", 10000); await exportPiecePdf(p); toast("PDF exportado"); }
    catch (e) { toast("No se pudo exportar: " + e.message); }
  } else if (r === "file") {
    const size = await exportPieceFile(p);
    toast(`Pieza exportada (${(size / 1048576).toFixed(1)} MB)`);
  } else if (r === "del") {
    if (await confirmDialog("Eliminar pieza", `¿Eliminar «${p.title}» de la biblioteca? Si no tienes copia, no se podrá recuperar.`, "Eliminar", true)) {
      await deletePiece(p); await bumpAndRefresh(); toast("Pieza eliminada");
    }
  }
}
async function bumpAndRefresh() {
  const st = await getBackupState(); st.changes = (st.changes || 0) + 1; await saveBackupState(st);
  renderLibrary(); refreshBackupBanner();
}

let bannerDone = false; // el aviso solo se propone al entrar; luego solo se oculta
async function refreshBackupBanner(atStart = false) {
  const b = $("#backupBanner");
  const need = await backupNeeded();
  if (!need) { b.hidden = true; bannerDone = true; return; }
  if (!atStart && (bannerDone || b.hidden)) return;
  const why = need.lastBackup ? `Última copia: ${fmtDate(need.lastBackup)} · ${need.changes} cambio(s) sin copiar.` : "Aún no has hecho ninguna copia de seguridad.";
  b.innerHTML = "";
  b.append(el("span", { text: `💾 ${why}` }),
    el("button", { class: "btn small primary", type: "button", text: "Hacer copia ahora", onclick: async () => { await doFullBackup(); refreshBackupBanner(); } }),
    el("button", { class: "btn small", type: "button", text: "Más tarde", onclick: () => { b.hidden = true; bannerDone = true; } }));
  b.hidden = false;
}

async function doFullBackup() {
  try {
    toast("Preparando copia…", 10000);
    const r = await exportFullBackup();
    toast(`Copia descargada: ${r.pieces} pieza(s), ${(r.size / 1048576).toFixed(1)} MB`);
    if (!$("#view-more").hidden) renderBackupTab();
  } catch (e) { console.error(e); toast("No se pudo hacer la copia: " + e.message); }
}

async function importFiles(files) {
  let ok = 0, last = null;
  for (const f of files) {
    try { toast(`Importando ${f.name}…`, 20000); last = await importPdfFile(f); ok++; }
    catch (e) { console.error(e); toast(`No se pudo importar ${f.name}: ${e.message}`); }
  }
  if (ok) {
    try { await navigator.storage?.persist?.(); } catch {}
    await bumpAndRefresh();
    toast(`${ok} PDF importado(s)`);
    if (ok === 1 && last) openPiece(last.id);
  }
}

/* ================= Más: Copias ================= */
async function renderBackupTab() {
  const box = $("#tab-backup");
  const st = await getBackupState();
  const pieces = await dbAll("pieces");
  let usage = "";
  try {
    const est = await navigator.storage?.estimate?.();
    if (est) usage = `Espacio usado por la app en este navegador: ${(est.usage / 1048576).toFixed(1)} MB.`;
  } catch {}
  let persisted = null;
  try { persisted = await navigator.storage?.persisted?.(); } catch {}
  box.innerHTML = "";
  const fileIn = el("input", { type: "file", accept: ".ptbak", hidden: true });
  fileIn.addEventListener("change", async () => { const f = fileIn.files[0]; fileIn.value = ""; if (f) restoreFlow(f); });
  box.append(
    el("section", { class: "panel" },
      el("h3", { text: "Copia de seguridad" }),
      el("p", { text: `${pieces.length} pieza(s). Última copia: ${fmtDate(st.lastBackup)}. Cambios desde entonces: ${st.changes}.` }),
      el("p", { class: "muted small", text: usage }),
      el("p", { class: "muted small", text: persisted === true ? "✓ El navegador ha marcado los datos como persistentes (no los borrará para liberar espacio)." : "El navegador aún no ha marcado los datos como persistentes. Instalar la app ayuda a que lo haga." }),
      el("div", { class: "row" },
        el("button", { class: "btn primary", type: "button", text: "Descargar copia completa (.ptbak)", onclick: doFullBackup }),
        el("button", { class: "btn", type: "button", text: "Restaurar o importar .ptbak", onclick: () => fileIn.click() }), fileIn),
      el("p", { class: "muted small", text: "La copia guarda todas las piezas con sus PDF, tus acordes, las ideas y los ajustes. Al restaurar se añaden o actualizan piezas; no se borra ninguna. Antes de restaurar se descarga automáticamente una copia previa de lo que tienes ahora. Más adelante se añadirá la copia cifrada a Drive (puente)." })),
  );
}

async function restoreFlow(file) {
  let data;
  try { data = await readBackupFile(file); }
  catch (e) { toast(e.message); return; }
  const existing = new Set((await dbAll("pieces")).map(p => p.id));
  const updates = data.pieces.filter(p => existing.has(p.id)).length;
  const news = data.pieces.length - updates;
  const box = el("div", {},
    el("p", { text: `Copia del ${fmtDate(data.createdAt)}: ${data.pieces.length} pieza(s) → ${news} nueva(s), ${updates} que ya tienes (se sustituirán por la versión de la copia).` }),
    data.ideas ? el("label", { class: "check" }, el("input", { type: "checkbox", id: "rMeta", checked: true }), " Restaurar también ideas, acordes personalizados y ajustes") : null,
    el("p", { class: "muted small", text: "Primero se descargará una copia previa de lo que tienes ahora, por si quieres volver atrás." }));
  const go = await dialog({ title: "Restaurar copia", body: box, buttons: [{ label: "Cancelar", value: null }, { label: "Restaurar", primary: true, value: c => ({ meta: Boolean(c.querySelector("#rMeta")?.checked) }) }] });
  if (!go) return;
  try {
    if (existing.size) { toast("Descargando copia previa…", 10000); await exportFullBackup(); }
    await applyBackup(data, { withMeta: go.meta });
    toast(`Restauradas ${data.pieces.length} pieza(s)`);
    renderBackupTab(); renderLibrary(); refreshBackupBanner();
  } catch (e) { console.error(e); toast("No se pudo restaurar: " + e.message); }
}

/* ================= Más: Ajustes ================= */
async function renderSettingsTab() {
  const s = await getSettings();
  const box = $("#tab-settings");
  box.innerHTML = "";
  const numField = (key, label, min, max, step = 1) => {
    const inp = el("input", { type: "number", min, max, step, value: s[key] });
    inp.addEventListener("change", async () => { s[key] = clamp(Number(inp.value) || 0, min, max); inp.value = s[key]; await saveSettings(s); toast("Ajuste guardado"); refreshBackupBanner(); });
    return el("label", { class: "field-inline" }, el("span", { text: label }), inp);
  };
  box.append(
    el("section", { class: "panel" },
      el("h3", { text: "Aviso de copia al entrar" }),
      el("p", { class: "muted small", text: "Al abrir la app te propondrá hacer copia si se cumple cualquiera de las dos condiciones (0 = desactivada)." }),
      numField("backupDays", "Días desde la última copia", 0, 365),
      numField("backupChanges", "Cambios sin copiar", 0, 1000)),
    el("section", { class: "panel" },
      el("h3", { text: "Tamaños iniciales al insertar (en puntos; A4 mide 595 de ancho)" }),
      el("p", { class: "muted small", text: "También se actualizan solos cuando redimensionas un elemento." }),
      numField("chordSize", "Ancho del diagrama de acorde", 10, 600),
      numField("fingerSize", "Círculo de dedo", 4, 200),
      numField("loopSize", "Etiqueta de bucle", 8, 300),
      numField("fontSize", "Texto", 4, 120)),
    el("section", { class: "panel" },
      el("h3", { text: "Versión" }),
      el("p", { text: `Partituras ${APP_VERSION}` }),
      el("p", { class: "muted small", text: "Si después de subir una versión nueva ves la antigua o algo no responde, pulsa aquí. Se vuelven a descargar los archivos de la app; tus piezas, copias e ideas no se tocan." }),
      el("button", { class: "btn", type: "button", text: "Forzar actualización", onclick: repairApp })),
  );
}

/* ================= Más ================= */
function switchTab(name) {
  $$(".tabs .tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  $$(".tab-panel").forEach(p => { p.hidden = p.id !== `tab-${name}`; });
  if (name === "backup") renderBackupTab();
  if (name === "settings") renderSettingsTab();
  if (name === "ideas") renderIdeas($("#tab-ideas"));
  if (name === "help") $("#tab-help").innerHTML = HELP_HTML;
}

/* ================= Arranque ================= */
async function init() {
  $("#verLabel").textContent = APP_VERSION;
  wireEditorUi();
  $("#btnImport").addEventListener("click", () => $("#fileImport").click());
  $("#fileImport").addEventListener("change", (e) => { const files = [...e.target.files]; e.target.value = ""; if (files.length) importFiles(files); });
  $("#btnNewBlank").addEventListener("click", async () => {
    const r = await templateDialog({ withTitle: true, title: "Apuntes" });
    if (!r) return;
    const p = await createBlankPiece(r.title || "Apuntes", 1, r.orient);
    if (r.kind !== "blank" || r.head) {
      p.pages[0].objs = templateObjs(r.kind, p.pages[0], { title: r.head });
      await dbPut("pieces", p);
    }
    await bumpAndRefresh();
    openPiece(p.id);
  });
  $("#btnMore").addEventListener("click", () => { show("more"); switchTab("backup"); });
  $("#moreBack").addEventListener("click", () => { show("library"); renderLibrary(); refreshBackupBanner(); });
  $$(".tabs .tab").forEach(t => t.addEventListener("click", () => switchTab(t.dataset.tab)));
  $("#libSearch").addEventListener("input", renderLibrary);
  $("#libFav").addEventListener("change", renderLibrary);
  $("#libSort").addEventListener("change", renderLibrary);

  // Arrastrar PDFs sobre la biblioteca
  document.addEventListener("dragover", (e) => { if (!$("#view-library").hidden) e.preventDefault(); });
  document.addEventListener("drop", (e) => {
    if ($("#view-library").hidden) return;
    e.preventDefault();
    const files = [...(e.dataTransfer?.files || [])].filter(f => /\.pdf$/i.test(f.name) || f.type === "application/pdf");
    if (files.length) importFiles(files);
  });

  window.addEventListener("beforeunload", () => { if (editorActive()) closeEditor(); });

  show("library");
  await renderLibrary();
  await refreshBackupBanner(true);
  registerSw();
}

function registerSw() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  navigator.serviceWorker.register("sw.js").then(reg => {
    const onWaiting = () => { if (reg.waiting && navigator.serviceWorker.controller) $("#updateBanner").hidden = false; };
    onWaiting();
    reg.addEventListener("updatefound", () => {
      const nw = reg.installing;
      nw?.addEventListener("statechange", () => { if (nw.state === "installed") onWaiting(); });
    });
    $("#btnReload").addEventListener("click", async () => {
      if (editorActive()) await closeEditor();
      reg.waiting?.postMessage("skipWaiting");
    });
  }).catch(err => console.warn("SW", err));
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (!reloaded) { reloaded = true; location.reload(); } });
  // Comprobación: la versión del service worker debe ser la misma que la de los archivos que se están usando.
  navigator.serviceWorker.addEventListener("message", (e) => {
    const v = e.data?.swVersion;
    if (v && v !== APP_VERSION) showRepairBanner(v);
  });
  navigator.serviceWorker.ready.then(() => navigator.serviceWorker.controller?.postMessage("version")).catch(() => {});
}

function showRepairBanner(swVersion) {
  const b = $("#updateBanner");
  b.innerHTML = "";
  b.append(el("span", { text: `La actualización se quedó a medias (archivos ${APP_VERSION}, versión publicada ${swVersion}). ` }),
    el("button", { class: "btn small primary", type: "button", text: "Reparar ahora", onclick: repairApp }));
  b.hidden = false;
}

// Borra solo las cachés de esta app y su service worker, y recarga pidiendo todo al servidor.
// No toca la base de datos (piezas, imágenes, ideas, ajustes).
async function repairApp() {
  try {
    if (editorActive()) await closeEditor();
    toast("Descargando de nuevo la app…", 8000);
    const scope = new URL("./", location.href).pathname.replace(/[^a-z0-9]+/gi, "_");
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith(`partituras-app-${scope}-`)).map(k => caches.delete(k)));
    // refresca también la caché del navegador, para que la recarga no traiga archivos antiguos
    const files = ["index.html", "manifest.webmanifest", "css/app.css", "sw.js",
      ...["app", "util", "db", "pdfjs", "model", "chords", "objects", "clips", "editor", "exportpdf", "backup", "ideas", "help", "images", "thumbs", "split", "organizer", "vector", "tools3"].map(n => `js/${n}.js`)];
    await Promise.all(files.map(f => fetch(f, { cache: "reload" }).catch(() => {})));
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.unregister();
  } catch (e) { console.warn("reparar", e); }
  location.replace(location.pathname + "?r=" + Date.now());
}

init().catch(e => { console.error(e); toast("Error al iniciar: " + e.message, 8000); });
