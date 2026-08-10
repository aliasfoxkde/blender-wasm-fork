/**
 * RenderHistoryList
 *
 * Displays saved render records from IndexedDB.
 */

import { useState, useEffect, useCallback } from "react";
import type { RenderRecord } from "../storage/renderHistory";

interface Props {
  onDeleteRecord?: (id: string) => void;
}

export function RenderHistoryList({ onDeleteRecord }: Props) {
  const [records, setRecords] = useState<RenderRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const { getRenderRecords } = await import("../storage/renderHistory");
      const recs = await getRenderRecords(20);
      setRecords(recs as RenderRecord[]);
    } catch {
      setRecords([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleDelete = async (id: string) => {
    try {
      const { deleteRenderRecord } = await import("../storage/renderHistory");
      await deleteRenderRecord(id);
      await loadRecords();
      onDeleteRecord?.(id);
    } catch {
      // ignore
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString();
  };

  if (loading) {
    return <div style={{ padding: "1rem", color: "#888", fontSize: "0.8rem" }}>Loading history...</div>;
  }

  if (records.length === 0) {
    return (
      <div style={{ padding: "1rem", color: "#666", fontSize: "0.8rem", textAlign: "center" }}>
        No renders yet. Run a render to see history here.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "1rem" }}>
      {records.map((record) => (
        <div
          key={record.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.5rem",
            background: "#222",
            borderRadius: "6px",
            fontSize: "0.8rem",
          }}
        >
          <div>
            <div style={{ color: "#fff", fontWeight: 500 }}>
              {record.sceneId || record.id}
            </div>
            <div style={{ color: "#666", fontSize: "0.7rem" }}>
              {record.width}x{record.height} • {record.samples} samples • {formatDate(record.timestamp)}
            </div>
          </div>
          <button
            onClick={() => handleDelete(record.id)}
            style={{
              fontSize: "0.7rem",
              padding: "0.25rem 0.5rem",
              background: "transparent",
              color: "#e55",
              border: "1px solid #e55",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
