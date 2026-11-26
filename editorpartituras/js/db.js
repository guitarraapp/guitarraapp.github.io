// Almacenamiento local en IndexedDB (prefijo pt_). Nada en localStorage.
const DB_NAME = "pt_partituras_db";
const DB_VERSION = 1;
export const STORES = { pieces: "pieces", pdfs: "pdfs", ideas: "ideas", meta: "meta" };

let dbPromise = null;
function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error("Este navegador no tiene IndexedDB.")); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("pieces")) db.createObjectStore("pieces", { keyPath: "id" });
      if (!db.objectStoreNames.contains("pdfs")) db.createObjectStore("pdfs", { keyPath: "id" });
      if (!db.objectStoreNames.contains("ideas")) db.createObjectStore("ideas", { keyPath: "id" });
      if (!db.objectStoreNames.contains("meta")) db.createObjectStore("meta", { keyPath: "key" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("No se pudo abrir la base de datos."));
    req.onblocked = () => reject(new Error("La base de datos está bloqueada por otra pestaña."));
  });
  return dbPromise;
}

function wrap(req) {
  return new Promise((res, rej) => { req.onsuccess = () => res(req.result); req.onerror = () => rej(req.error); });
}

export async function dbGet(store, key) {
  const db = await openDb();
  return wrap(db.transaction(store, "readonly").objectStore(store).get(key));
}
export async function dbAll(store) {
  const db = await openDb();
  return wrap(db.transaction(store, "readonly").objectStore(store).getAll());
}
export async function dbPut(store, value) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).put(value);
    tx.oncomplete = () => res(value);
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error || new Error("Escritura cancelada (¿sin espacio?)."));
  });
}
export async function dbDel(store, key) {
  const db = await openDb();
  return new Promise((res, rej) => {
    const tx = db.transaction(store, "readwrite");
    tx.objectStore(store).delete(key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}
// Escribe varias cosas en una sola transacción (todo o nada)
export async function dbPutMany(entries) {
  const db = await openDb();
  const stores = [...new Set(entries.map(e => e.store))];
  return new Promise((res, rej) => {
    const tx = db.transaction(stores, "readwrite");
    for (const e of entries) tx.objectStore(e.store).put(e.value);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
    tx.onabort = () => rej(tx.error || new Error("Escritura cancelada (¿sin espacio?)."));
  });
}

/* ---------- Ajustes y estado de copia ---------- */
export const DEFAULT_SETTINGS = {
  backupDays: 30,        // proponer copia si han pasado más de N días
  backupChanges: 1,      // ... o si hay N cambios sin copiar
  chordSize: 55,         // ancho del diagrama en puntos
  fingerSize: 14,
  loopSize: 30,
  fontSize: 12,
  lineWidth: 1,
  color: "#000000",
  patchColor: "#ffffff",
};

export async function getSettings() {
  const rec = await dbGet("meta", "settings");
  return { ...DEFAULT_SETTINGS, ...(rec?.value || {}) };
}
export async function saveSettings(s) { return dbPut("meta", { key: "settings", value: s }); }

export async function getBackupState() {
  const rec = await dbGet("meta", "backupState");
  return { lastBackup: 0, changes: 0, ...(rec?.value || {}) };
}
export async function saveBackupState(v) { return dbPut("meta", { key: "backupState", value: v }); }
export async function bumpChanges(n = 1) {
  const st = await getBackupState();
  st.changes = (st.changes || 0) + n;
  await saveBackupState(st);
}

export async function getCustomChords() {
  const rec = await dbGet("meta", "customChords");
  return rec?.value || {};
}
export async function saveCustomChords(v) { return dbPut("meta", { key: "customChords", value: v }); }
