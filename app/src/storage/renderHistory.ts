/**
 * renderHistory
 *
 * IndexedDB-backed render history storage.
 * Stores render records with blob URLs for rendered images.
 */

export interface RenderRecord {
  id: string;
  timestamp: number;
  sceneId: string;
  width: number;
  height: number;
  samples: number;
  renderTimeMs: number;
  thumbnailBlob?: Blob;
  thumbnailUrl?: string;
}

const DB_NAME = "blender-wasm";
const DB_VERSION = 1;
const STORE_NAME = "render_history";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("timestamp", "timestamp", { unique: false });
        store.createIndex("sceneId", "sceneId", { unique: false });
      }
    };
  });
}

export async function saveRenderRecord(record: RenderRecord): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(record);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
    db.close();
  });
}

export async function getRenderRecords(limit = 50): Promise<RenderRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("timestamp");
    const request = index.openCursor(null, "prev");
    const records: RenderRecord[] = [];

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor && records.length < limit) {
        records.push(cursor.value);
        cursor.continue();
      } else {
        resolve(records);
        db.close();
      }
    };
  });
}

export async function getRenderRecord(id: string): Promise<RenderRecord | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    db.close();
  });
}

export async function deleteRenderRecord(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onerror = () => reject(getRequest.error);
    getRequest.onsuccess = () => {
      const record = getRequest.result as RenderRecord | undefined;
      if (record?.thumbnailUrl) {
        URL.revokeObjectURL(record.thumbnailUrl);
      }
      const delRequest = store.delete(id);
      delRequest.onerror = () => reject(delRequest.error);
      delRequest.onsuccess = () => resolve();
    };
    db.close();
  });
}

export async function clearAllRenderRecords(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.getAll();

    getRequest.onerror = () => reject(getRequest.error);
    getRequest.onsuccess = () => {
      const records = getRequest.result as RenderRecord[];
      records.forEach((r) => {
        if (r.thumbnailUrl) URL.revokeObjectURL(r.thumbnailUrl);
      });
      const clearRequest = store.clear();
      clearRequest.onerror = () => reject(clearRequest.error);
      clearRequest.onsuccess = () => resolve();
    };
    db.close();
  });
}

export async function getStorageEstimate(): Promise<{ usage: number; quota: number }> {
  if (navigator.storage?.estimate) {
    const est = await navigator.storage.estimate();
    return { usage: est.usage ?? 0, quota: est.quota ?? 0 };
  }
  return { usage: 0, quota: 0 };
}
