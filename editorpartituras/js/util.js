// Utilidades comunes
export const APP_VERSION = "11.1.0-f1";
export const NS = "http://www.w3.org/2000/svg";

export function uid(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function $(sel, root = document) { return root.querySelector(sel); }
export function $$(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
    else node.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

export function svg(tag, attrs = {}) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    node.setAttribute(k, v);
  }
  return node;
}

export function clone(o) { return JSON.parse(JSON.stringify(o)); }

export function debounce(fn, ms) {
  let t = null;
  const d = (...args) => { clearTimeout(t); t = setTimeout(() => { t = null; fn(...args); }, ms); };
  d.flush = (...args) => { if (t) { clearTimeout(t); t = null; fn(...args); } };
  return d;
}

export function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
export function num(v, def = 0) { const n = Number(v); return Number.isFinite(n) ? n : def; }

let toastTimer = null;
export function toast(msg, ms = 2600) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), ms);
}

export function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = el("a", { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function safeFileName(s) {
  return (s || "partitura").replace(/[\\/:*?"<>|]+/g, "_").trim().slice(0, 80) || "partitura";
}

export function fmtDate(ts) {
  if (!ts) return "nunca";
  return new Date(ts).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
}

export function isHttpUrl(u) {
  if (!u) return false;
  try { const p = new URL(u); return p.protocol === "http:" || p.protocol === "https:"; } catch { return false; }
}
export function normalizeUrl(raw) {
  const t = (raw || "").trim();
  if (!t) return "";
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}
export function openUrl(url) {
  const u = normalizeUrl(url);
  if (!isHttpUrl(u)) { toast("La dirección del vídeo no es válida."); return; }
  const a = el("a", { href: u, target: "_blank", rel: "noopener noreferrer" });
  document.body.append(a); a.click(); a.remove();
}

/* ---------- Diálogos sencillos (sin alert/confirm del navegador) ---------- */
export function dialog({ title, body, buttons = [{ label: "Cerrar", value: null }], wide = false, onOpen }) {
  return new Promise(resolve => {
    const back = el("div", { class: "modal-backdrop open" });
    const card = el("div", { class: "modal-card" + (wide ? " wide" : "") });
    const close = (v) => { back.remove(); document.removeEventListener("keydown", onKey, true); resolve(v); };
    const header = el("div", { class: "modal-header" }, el("h3", { text: title }),
      el("button", { class: "btn small", type: "button", text: "Cerrar", onclick: () => close(null) }));
    const content = el("div", { class: "modal-body" });
    if (typeof body === "string") content.innerHTML = body; else if (body) content.append(body);
    const footer = el("div", { class: "modal-footer" });
    for (const b of buttons) {
      footer.append(el("button", {
        class: "btn" + (b.primary ? " primary" : "") + (b.danger ? " danger" : ""), type: "button", text: b.label,
        onclick: () => {
          if (b.validate && !b.validate(content)) return;
          close(typeof b.value === "function" ? b.value(content) : b.value);
        }
      }));
    }
    card.append(header, content, footer);
    back.append(card);
    back.addEventListener("pointerdown", e => { if (e.target === back) close(null); });
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(null); }
      if (e.key === "Enter" && e.target.tagName === "INPUT") {
        const prim = buttons.find(b => b.primary);
        if (prim) { e.preventDefault(); if (prim.validate && !prim.validate(content)) return; close(typeof prim.value === "function" ? prim.value(content) : prim.value); }
      }
    }
    document.addEventListener("keydown", onKey, true);
    document.body.append(back);
    if (onOpen) onOpen(content);
    const first = content.querySelector("input,textarea,select");
    if (first) setTimeout(() => { first.focus(); if (first.select) first.select(); }, 30);
  });
}

export async function confirmDialog(title, message, okLabel = "Aceptar", danger = false) {
  const r = await dialog({
    title, body: el("p", { text: message }),
    buttons: [{ label: "Cancelar", value: false }, { label: okLabel, value: true, primary: !danger, danger }]
  });
  return r === true;
}

export async function promptDialog(title, label, value = "", placeholder = "") {
  const box = el("div", { class: "field" },
    el("label", { text: label }),
    el("input", { type: "text", value, placeholder, class: "full" }));
  return dialog({
    title, body: box,
    buttons: [{ label: "Cancelar", value: null }, { label: "Aceptar", primary: true, value: c => c.querySelector("input").value }]
  });
}
