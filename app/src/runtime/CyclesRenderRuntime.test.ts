import { describe, it, expect, beforeEach } from "vitest";
import { CyclesRenderRuntime } from "./CyclesRenderRuntime";

describe("CyclesRenderRuntime", () => {
  let runtime: CyclesRenderRuntime;

  beforeEach(() => {
    runtime = new CyclesRenderRuntime();
  });

  it("starts in unavailable state", () => {
    expect(runtime.state).toBe("unavailable");
  });

  it("isLoaded is false initially", () => {
    expect(runtime.isLoaded).toBe(false);
  });

  it("getManifest returns null initially", () => {
    expect(runtime.getManifest()).toBe(null);
  });

  it("onProgress returns unsubscribe function", () => {
    const unsub = runtime.onProgress(() => {});
    expect(typeof unsub).toBe("function");
    unsub();
  });

  it("progress callback is called during load", async () => {
    const events: any[] = [];
    runtime.onProgress((p) => events.push(p));
    // Mock fetch to return 404 (no artifacts)
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].phase).toBe("fetch");
  });

  it("enters error state when manifest is absent", async () => {
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    expect(runtime.state).toBe("error");
  });

  it("getManifest returns null when manifest is absent", async () => {
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    expect(runtime.getManifest()).toBe(null);
  });

  it("renderSampleScene returns error when not loaded", async () => {
    const result = await runtime.renderSampleScene();
    expect(result.success).toBe(false);
    expect(result.error).toContain("not available");
  });

  it("dispose resets runtime to unavailable", async () => {
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    runtime.dispose();
    expect(runtime.state).toBe("unavailable");
    expect(runtime.isLoaded).toBe(false);
    expect(runtime.getManifest()).toBe(null);
  });

  it("renderSampleScene returns error when not loaded", async () => {
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    const result = await runtime.renderSampleScene();
    expect(result.success).toBe(false);
    expect(result.error).toContain("not available");
  });
});
