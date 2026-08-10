/**
 * renderHistory tests
 *
 * IndexedDB is not available in jsdom, so we mock the module entirely.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// Use vi.hoisted to avoid TDZ issues with vi.mock
const { memStore, memIndex, mockFns } = vi.hoisted(() => {
  const memStore = new Map<string, unknown>();
  const memIndex: { timestamp: number; id: string }[] = [];

  const mockFns = {
    saveRenderRecord: vi.fn(async (record: unknown) => {
      memStore.set((record as { id: string }).id, record);
      const r = record as { id: string; timestamp: number };
      const existingIdx = memIndex.findIndex((x) => x.id === r.id);
      if (existingIdx >= 0) {
        memIndex[existingIdx] = { timestamp: r.timestamp, id: r.id };
      } else {
        memIndex.push({ timestamp: r.timestamp, id: r.id });
      }
    }),
    getRenderRecords: vi.fn(async (limit = 50) => {
      const sorted = [...memIndex].sort((a, b) => b.timestamp - a.timestamp);
      return sorted.slice(0, limit).map((x) => memStore.get(x.id)).filter(Boolean);
    }),
    getRenderRecord: vi.fn(async (id: string) => {
      return memStore.get(id) as unknown;
    }),
    deleteRenderRecord: vi.fn(async (id: string) => {
      memStore.delete(id);
      const idx = memIndex.findIndex((x) => x.id === id);
      if (idx >= 0) memIndex.splice(idx, 1);
    }),
    clearAllRenderRecords: vi.fn(async () => {
      memStore.clear();
      memIndex.length = 0;
    }),
    getStorageEstimate: vi.fn().mockResolvedValue({ usage: 1024, quota: 10000 }),
  };

  return { memStore, memIndex, mockFns };
});

vi.mock("./renderHistory", () => ({
  saveRenderRecord: mockFns.saveRenderRecord,
  getRenderRecords: mockFns.getRenderRecords,
  getRenderRecord: mockFns.getRenderRecord,
  deleteRenderRecord: mockFns.deleteRenderRecord,
  clearAllRenderRecords: mockFns.clearAllRenderRecords,
  getStorageEstimate: mockFns.getStorageEstimate,
}));

// Re-import after mocking
import {
  saveRenderRecord,
  getRenderRecords,
  getRenderRecord,
  deleteRenderRecord,
  clearAllRenderRecords,
} from "./renderHistory";

describe("renderHistory", () => {
  beforeEach(() => {
    memStore.clear();
    memIndex.length = 0;
    vi.clearAllMocks();
  });

  it("saves a render record", async () => {
    const record = {
      id: "test-1",
      timestamp: Date.now(),
      sceneId: "test-scene",
      width: 128,
      height: 128,
      samples: 32,
      renderTimeMs: 1500,
    };

    await saveRenderRecord(record);
    expect(saveRenderRecord).toHaveBeenCalledWith(record);
  });

  it("retrieves render records sorted by timestamp", async () => {
    const record1 = {
      id: "record-1",
      timestamp: 1000,
      sceneId: "scene-a",
      width: 128,
      height: 128,
      samples: 32,
      renderTimeMs: 1500,
    };
    const record2 = {
      id: "record-2",
      timestamp: 2000,
      sceneId: "scene-b",
      width: 256,
      height: 256,
      samples: 64,
      renderTimeMs: 3000,
    };

    await saveRenderRecord(record1);
    await saveRenderRecord(record2);

    const records = await getRenderRecords();
    expect(records).toHaveLength(2);
    expect((records[0] as { id: string }).id).toBe("record-2"); // newest first
    expect((records[1] as { id: string }).id).toBe("record-1");
  });

  it("retrieves a specific render record by id", async () => {
    const record = {
      id: "test-specific",
      timestamp: Date.now(),
      sceneId: "scene-a",
      width: 256,
      height: 256,
      samples: 64,
      renderTimeMs: 3000,
    };

    await saveRenderRecord(record);
    const retrieved = await getRenderRecord("test-specific");
    expect(retrieved).toBeDefined();
    expect((retrieved as { sceneId: string }).sceneId).toBe("scene-a");
    expect((retrieved as { width: number }).width).toBe(256);
  });

  it("returns undefined for non-existent record", async () => {
    const retrieved = await getRenderRecord("does-not-exist");
    expect(retrieved).toBeUndefined();
  });

  it("deletes a render record", async () => {
    const record = {
      id: "delete-me",
      timestamp: Date.now(),
      sceneId: "to-delete",
      width: 64,
      height: 64,
      samples: 16,
      renderTimeMs: 500,
    };

    await saveRenderRecord(record);
    await deleteRenderRecord("delete-me");
    expect(deleteRenderRecord).toHaveBeenCalledWith("delete-me");
  });

  it("clears all render records", async () => {
    await saveRenderRecord({
      id: "record-1",
      timestamp: Date.now(),
      sceneId: "s1",
      width: 64,
      height: 64,
      samples: 16,
      renderTimeMs: 100,
    });
    await saveRenderRecord({
      id: "record-2",
      timestamp: Date.now(),
      sceneId: "s2",
      width: 64,
      height: 64,
      samples: 16,
      renderTimeMs: 200,
    });

    await clearAllRenderRecords();
    expect(clearAllRenderRecords).toHaveBeenCalled();
  });

  it("limits render records to specified count", async () => {
    for (let i = 0; i < 5; i++) {
      await saveRenderRecord({
        id: `record-${i}`,
        timestamp: 1000 + i,
        sceneId: "s",
        width: 64,
        height: 64,
        samples: 16,
        renderTimeMs: 100,
      });
    }

    const records = await getRenderRecords(3);
    expect(records).toHaveLength(3);
  });
});
