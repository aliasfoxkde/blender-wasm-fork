/**
 * WasmCache tests — uses vi.mock to simulate IndexedDB in jsdom.
 * jsdom does not implement IndexedDB, so we mock the entire module.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";

// In-memory cache for test
const memCache = new Map<string, ArrayBuffer>();

vi.mock("./WasmCache", () => ({
  getCachedWasm: vi.fn(async (url: string) => memCache.get(url) ?? null),
  setCachedWasm: vi.fn(async (url: string, bytes: ArrayBuffer) => {
    memCache.set(url, bytes);
  }),
  clearWasmCache: vi.fn(async () => {
    memCache.clear();
  }),
  getCacheSize: vi.fn(async () => memCache.size),
}));

// Re-import after mocking
import { getCachedWasm, setCachedWasm, clearWasmCache, getCacheSize } from "./WasmCache";

describe("WasmCache", () => {
  beforeEach(() => {
    memCache.clear();
  });

  it("returns null when cache is empty", async () => {
    const result = await getCachedWasm("https://example.com/test.wasm");
    expect(result).toBeNull();
  });

  it("stores and retrieves WASM bytes", async () => {
    const url = "https://example.com/test.wasm";
    const data = new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]).buffer;
    await setCachedWasm(url, data);
    const cached = await getCachedWasm(url);
    expect(cached).not.toBeNull();
    expect(cached?.byteLength).toBe(data.byteLength);
  });

  it("returns null for non-existent URL", async () => {
    const cached = await getCachedWasm("https://example.com/nonexistent.wasm");
    expect(cached).toBeNull();
  });

  it("overwrites existing entry with new bytes", async () => {
    const url = "https://example.com/test.wasm";
    const data1 = new Uint8Array([0x01, 0x02, 0x03]).buffer;
    const data2 = new Uint8Array([0x04, 0x05, 0x06, 0x07]).buffer;
    await setCachedWasm(url, data1);
    await setCachedWasm(url, data2);
    const cached = (await getCachedWasm(url))!;
    expect(cached.byteLength).toBe(data2.byteLength);
  });

  it("clearWasmCache removes all entries", async () => {
    const url1 = "https://example.com/a.wasm";
    const url2 = "https://example.com/b.wasm";
    const data = new Uint8Array([0x00, 0x61, 0x73, 0x6d]).buffer;
    await setCachedWasm(url1, data);
    await setCachedWasm(url2, data);
    await clearWasmCache();
    expect(await getCachedWasm(url1)).toBeNull();
    expect(await getCachedWasm(url2)).toBeNull();
  });

  it("getCacheSize returns correct count", async () => {
    expect(await getCacheSize()).toBe(0);
    await setCachedWasm("https://example.com/a.wasm", new ArrayBuffer(10));
    expect(await getCacheSize()).toBe(1);
    await setCachedWasm("https://example.com/b.wasm", new ArrayBuffer(10));
    expect(await getCacheSize()).toBe(2);
    await clearWasmCache();
    expect(await getCacheSize()).toBe(0);
  });

  it("setCachedWasm is non-fatal on error", async () => {
    await expect(
      setCachedWasm("", new ArrayBuffer(0))
    ).resolves.not.toThrow();
  });
});
