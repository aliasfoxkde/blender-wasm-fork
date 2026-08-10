/**
 * StorageStatus
 *
 * Shows WASM cache and render history storage status.
 * Allows user to clear caches separately.
 */

import { useState, useEffect, useCallback } from "react";

interface StorageStatusState {
  wasmCacheCount: number;
  historyCount: number;
  storageQuota: number;
  storageUsage: number;
  clearingWasm: boolean;
  clearingHistory: boolean;
}

interface Props {
  runtime: { getCacheSize(): Promise<number>; clearCache(): Promise<void> } | null;
  onClearWasmCache?: () => void;
}

export function StorageStatus({ runtime, onClearWasmCache }: Props) {
  const [state, setState] = useState<StorageStatusState>({
    wasmCacheCount: 0,
    historyCount: 0,
    storageQuota: 0,
    storageUsage: 0,
    clearingWasm: false,
    clearingHistory: false,
  });

  const loadStorage = useCallback(async () => {
    if (!runtime) return;

    const wasmCacheCount = await runtime.getCacheSize().catch(() => 0);

    // Estimate storage usage
    let storageUsage = 0;
    let storageQuota = 0;
    if (navigator.storage?.estimate) {
      const est = await navigator.storage.estimate();
      storageUsage = est.usage ?? 0;
      storageQuota = est.quota ?? 0;
    }

    setState((prev) => ({
      ...prev,
      wasmCacheCount,
      storageQuota,
      storageUsage,
    }));
  }, [runtime]);

  useEffect(() => {
    loadStorage();
  }, [loadStorage]);

  const handleClearWasm = async () => {
    if (!runtime) return;
    setState((prev) => ({ ...prev, clearingWasm: true }));
    await runtime.clearCache().catch(() => {});
    await loadStorage();
    setState((prev) => ({ ...prev, clearingWasm: false }));
    onClearWasmCache?.();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const quotaPercent = state.storageQuota > 0
    ? Math.round((state.storageUsage / state.storageQuota) * 100)
    : 0;

  return (
    <div className="storage-status" style={{ padding: "1rem", border: "1px solid #333", borderRadius: "8px" }}>
      <h3 style={{ margin: "0 0 0.75rem 0", fontSize: "0.9rem", fontWeight: 600 }}>Storage</h3>

      <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.5rem" }}>
        {formatBytes(state.storageUsage)} / {formatBytes(state.storageQuota)} ({quotaPercent}%)
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem" }}>
            WASM cache: <strong>{state.wasmCacheCount}</strong>
          </span>
          <button
            onClick={handleClearWasm}
            disabled={state.clearingWasm || state.wasmCacheCount === 0}
            style={{
              fontSize: "0.75rem",
              padding: "0.25rem 0.5rem",
              background: "#333",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: state.wasmCacheCount === 0 ? "not-allowed" : "pointer",
              opacity: state.wasmCacheCount === 0 ? 0.5 : 1,
            }}
          >
            {state.clearingWasm ? "Clearing..." : "Clear"}
          </button>
        </div>
      </div>
    </div>
  );
}
