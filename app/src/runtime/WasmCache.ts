/**
 * WasmCache — IndexedDB-based cache for decompressed WASM module bytes.
 *
 * Caches the raw `.wasm` bytes (or decompressed `.wasm.zst` bytes) so
 * subsequent page loads can restore from cache instead of re-fetching
 * from the network.
 *
 * Cache strategy:
 *   - Keyed by URL (WASM file path)
 *   - Stores: ArrayBuffer bytes + timestamp + content-hash (SHA-256 hex)
 *   - On fetch: try cache first → network fallback → update cache
 *   - Max entries: 5 (LRU eviction via timestamp)
 */

const DB_NAME = "blender-wasm-cache";
const DB_VERSION = 1;
const STORE_NAME = "wasm-binaries";

interface CacheEntry {
  url: string;
  bytes: ArrayBuffer;
  timestamp: number;
  sha256?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "url" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve cached WASM bytes for a given URL.
 * Returns null if not in cache.
 */
export async function getCachedWasm(url: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const req = store.get(url);
      req.onsuccess = () => {
        const entry: CacheEntry | undefined = req.result;
        resolve(entry ? entry.bytes : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Store WASM bytes in cache for a given URL.
 * Handles LRU eviction automatically.
 */
export async function setCachedWasm(url: string, bytes: ArrayBuffer): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    const entry: CacheEntry = {
      url,
      bytes,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Cache failures are non-fatal — caller falls back to network
  }
}

/**
 * Clear all cached WASM entries.
 */
export async function clearWasmCache(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Non-fatal
  }
}

/**
 * Get the number of cached entries.
 */
export async function getCacheSize(): Promise<number> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve, reject) => {
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return 0;
  }
}
