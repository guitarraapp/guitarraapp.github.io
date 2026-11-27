// Copias de seguridad locales (.ptbak): JSON + PDFs en binario, sin convertir a texto
import { dbAll, dbGet, dbPutMany, getBackupState, saveBackupState, getSettings, getCustomChords, saveCustomChords, saveSettings, DEFAULT_SETTINGS } from "./db.js";
import { sanitizePiece, sanitizeChordModel, pdfIdsOf, imgIdsOf } from "./model.js";
import { downloadBlob, safeFileName, APP_VERSION, clamp, num } from "./util.js";

const MAGIC = "PTBAK1\n";
const enc = new TextEncoder(), dec = new TextDecoder();

async function buildBackup(pieces, { includeMeta }) {
  const pdfIds = [...new Set(pieces.flatMap(pdfIdsOf))];
  const pdfRecs = [];
  for (const id of pdfIds) { const r = await dbGet("pdfs", id); if (r) pdfRecs.push(r); }
  const imgIds = [...new Set(pieces.flatMap(imgIdsOf))];
  const imgRecs = [];
  for (const id of imgIds) { const r = await dbGet("imgs", id); if (r) imgRecs.push(r); }
  let offset = 0;
  const pdfIndex = pdfRecs.map(r => { const e = { id: r.id, name: r.name, pageCount: r.pageCount, offset, length: r.blob.size }; offset += r.blob.size; return e; });
  const imgIndex = imgRecs.map(r => { const e = { id: r.id, name: r.name, type: r.blob.type, w: r.w, h: r.h, offset, length: r.blob.size }; offset += r.blob.size; return e; });
  const header = {
    format: "partituras-backup", version: 2, app: APP_VERSION, createdAt: Date.now(),
    pieces, pdfs: pdfIndex, imgs: imgIndex,
  };
  if (includeMeta) {
    header.ideas = await dbAll("ideas");
    header.settings = await getSettings();
    header.customChords = await getCustomChords();
  }
  const json = enc.encode(JSON.stringify(header));
  const len = enc.encode(String(json.length).padStart(12, "0") + "\n");
  return new Blob([MAGIC, len, json, ...pdfRecs.map(r => r.blob), ...imgRecs.map(r => r.blob)], { type: "application/octet-stream" });
}

export async function exportFullBackup() {
  const pieces = await dbAll("pieces");
  const blob = await buildBackup(pieces, { includeMeta: true });
  const d = new Date();
  const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}_${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
  downloadBlob(blob, `partituras_copia_${stamp}.ptbak`);
  await saveBackupState({ lastBackup: Date.now(), changes: 0 });
  return { pieces: pieces.length, size: blob.size };
}

export async function exportPieceFile(piece) {
  const blob = await buildBackup([piece], { includeMeta: false });
  downloadBlob(blob, `${safeFileName(piece.title)}.ptbak`);
  return blob.size;
}

// Lee y valida un archivo .ptbak; no escribe nada
export async function readBackupFile(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  if (dec.decode(buf.subarray(0, MAGIC.length)) !== MAGIC) throw new Error("No es una copia de Partituras (.ptbak).");
  const lenStr = dec.decode(buf.subarray(MAGIC.length, MAGIC.length + 12));
  const jsonLen = parseInt(lenStr, 10);
  const jsonStart = MAGIC.length + 13;
  if (!Number.isFinite(jsonLen) || jsonLen <= 0 || jsonStart + jsonLen > buf.length) throw new Error("La copia está dañada (cabecera).");
  let header;
  try { header = JSON.parse(dec.decode(buf.subarray(jsonStart, jsonStart + jsonLen))); } catch { throw new Error("La copia está dañada (datos)."); }
  if (header.format !== "partituras-backup" || ![1, 2].includes(header.version) || !Array.isArray(header.pieces)) throw new Error("Formato de copia no compatible.");
  const dataStart = jsonStart + jsonLen;
  const pdfs = [];
  for (const p of header.pdfs || []) {
    const off = num(p.offset, -1), len = num(p.length, -1);
    if (typeof p.id !== "string" || off < 0 || len <= 0 || dataStart + off + len > buf.length) throw new Error("La copia está dañada (PDF incompleto).");
    const bytes = buf.slice(dataStart + off, dataStart + off + len);
    if (dec.decode(bytes.subarray(0, 5)) !== "%PDF-") throw new Error("La copia contiene un PDF no válido.");
    pdfs.push({ id: p.id.slice(0, 60), name: String(p.name || "partitura.pdf").slice(0, 200), pageCount: num(p.pageCount, 0), size: len, blob: new Blob([bytes], { type: "application/pdf" }) });
  }
  const imgs = [];
  for (const p of header.imgs || []) {
    const off = num(p.offset, -1), len = num(p.length, -1), type = String(p.type || "");
    if (typeof p.id !== "string" || off < 0 || len <= 0 || dataStart + off + len > buf.length || !/^image\/(png|jpeg|gif|webp)$/.test(type)) throw new Error("La copia está dañada (imagen incompleta).");
    imgs.push({ id: p.id.slice(0, 60), name: String(p.name || "imagen").slice(0, 120), type, w: num(p.w, 1), h: num(p.h, 1), size: len, blob: new Blob([buf.slice(dataStart + off, dataStart + off + len)], { type }) });
  }
  const pieces = header.pieces.map(sanitizePiece).filter(Boolean);
  const pdfIds = new Set(pdfs.map(p => p.id));
  for (const p of pieces) for (const id of pdfIdsOf(p)) if (!pdfIds.has(id) && !(await dbGet("pdfs", id))) throw new Error(`Falta un PDF de «${p.title}».`);
  const ideas = Array.isArray(header.ideas) ? header.ideas.filter(i => i && typeof i.id === "string").map(i => ({
    id: i.id.slice(0, 60), text: String(i.text || "").slice(0, 5000), done: Boolean(i.done), createdAt: num(i.createdAt, Date.now()), updatedAt: num(i.updatedAt, Date.now()),
  })) : null;
  let customChords = null;
  if (header.customChords && typeof header.customChords === "object") {
    customChords = {};
    for (const [k, v] of Object.entries(header.customChords)) customChords[String(k).slice(0, 16)] = sanitizeChordModel({ ...v, name: k });
  }
  let settings = null;
  if (header.settings && typeof header.settings === "object") {
    settings = {};
    for (const k of Object.keys(DEFAULT_SETTINGS)) {
      const v = header.settings[k];
      if (typeof DEFAULT_SETTINGS[k] === "number") settings[k] = clamp(num(v, DEFAULT_SETTINGS[k]), 0, 10000);
      else settings[k] = /^#[0-9a-f]{6}$/i.test(v || "") ? v : DEFAULT_SETTINGS[k];
    }
  }
  return { createdAt: num(header.createdAt, 0), pieces, pdfs, imgs, ideas, customChords, settings };
}

// Añade o actualiza (por id). Antes, el llamador hace una copia previa de seguridad.
export async function applyBackup(data, { withMeta }) {
  const entries = [];
  for (const p of data.pdfs) entries.push({ store: "pdfs", value: p });
  for (const i of data.imgs || []) entries.push({ store: "imgs", value: i });
  for (const p of data.pieces) entries.push({ store: "pieces", value: p });
  if (withMeta && data.ideas) for (const i of data.ideas) entries.push({ store: "ideas", value: i });
  await dbPutMany(entries);
  if (withMeta && data.customChords) await saveCustomChords({ ...(await getCustomChords()), ...data.customChords });
  if (withMeta && data.settings) await saveSettings({ ...(await getSettings()), ...data.settings });
}

export async function backupNeeded() {
  const st = await getBackupState();
  const s = await getSettings();
  const pieces = await dbAll("pieces");
  if (!pieces.length) return null;
  const days = st.lastBackup ? (Date.now() - st.lastBackup) / 86400000 : Infinity;
  const byDays = s.backupDays > 0 && days > s.backupDays;
  const byChanges = s.backupChanges > 0 && st.changes >= s.backupChanges;
  if (!byDays && !byChanges) return null;
  return { days: Number.isFinite(days) ? Math.floor(days) : null, changes: st.changes, lastBackup: st.lastBackup };
}
