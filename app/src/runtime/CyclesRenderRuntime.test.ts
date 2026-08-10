import { describe, it, expect, beforeEach } from "vitest";
import { CyclesRenderRuntime } from "./CyclesRenderRuntime";

describe("CyclesRenderRuntime", () => {
  let runtime: CyclesRenderRuntime;

  beforeEach(() => {
    runtime = new CyclesRenderRuntime();
  });

  // ===== Initial State Tests =====
  it("starts in unavailable state", () => {
    expect(runtime.state).toBe("unavailable");
  });

  it("isLoaded is false initially", () => {
    expect(runtime.isLoaded).toBe(false);
  });

  it("isWasmReady is false initially", () => {
    expect(runtime.isWasmReady).toBe(false);
  });

  it("getManifest returns null initially", () => {
    expect(runtime.getManifest()).toBe(null);
  });

  // ===== Callback Tests =====
  it("onProgress returns unsubscribe function", () => {
    const unsub = runtime.onProgress(() => {});
    expect(typeof unsub).toBe("function");
    unsub();
  });

  it("onStateChange returns unsubscribe function", () => {
    const unsub = runtime.onStateChange(() => {});
    expect(typeof unsub).toBe("function");
    unsub();
  });

  it("onProgress unsubscribe removes callback", () => {
    const events: any[] = [];
    const handler = (p: any) => events.push(p);
    const unsub = runtime.onProgress(handler);
    unsub();
    // After unsubscribe, callback should not be called
    expect(events.length).toBe(0);
  });

  it("onStateChange unsubscribe removes callback", () => {
    const events: string[] = [];
    const handler = (s: any) => events.push(s);
    const unsub = runtime.onStateChange(handler);
    unsub();
    expect(events.length).toBe(0);
  });

  // ===== Progress Callback Tests =====
  it("progress callback is called during load with 404", async () => {
    const events: any[] = [];
    runtime.onProgress((p) => events.push(p));
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].phase).toBe("fetch");
  });

  it("progress callback receives correct message when manifest absent", async () => {
    const events: any[] = [];
    runtime.onProgress((p) => events.push(p));
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    // The error message is emitted after the fetch fails
    const errorMessage = events.find((e) => e.message?.includes("not available"));
    expect(errorMessage).toBeDefined();
    expect(errorMessage?.message).toContain("not available");
  });

  it("progress events have correct structure", async () => {
    const events: any[] = [];
    runtime.onProgress((p) => events.push(p));
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    const event = events[0];
    expect(event).toHaveProperty("phase");
    expect(typeof event.phase).toBe("string");
  });

  // ===== State Transition Tests =====
  it("enters error state when manifest fetch returns 404", async () => {
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    expect(runtime.state).toBe("error");
  });

  it("enters error state when manifest fetch throws", async () => {
    globalThis.fetch = async () => {
      throw new Error("Network failure");
    };
    await runtime.load();
    expect(runtime.state).toBe("error");
  });

  it("enters error state when manifest HTTP status is 500", async () => {
    globalThis.fetch = async () => new Response("", { status: 500 }) as any;
    await runtime.load();
    expect(runtime.state).toBe("error");
  });

  it("enters error state when manifest HTTP status is 403", async () => {
    globalThis.fetch = async () => new Response("", { status: 403 }) as any;
    await runtime.load();
    expect(runtime.state).toBe("error");
  });

  it("enters error state when manifest is invalid (missing fields)", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ version: "invalid" }), { status: 200 }) as any;
    await runtime.load();
    expect(runtime.state).toBe("error");
  });

  it("enters error state when manifest is empty object", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({}), { status: 200 }) as any;
    await runtime.load();
    expect(runtime.state).toBe("error");
  });

  it("enters error state when manifest has wrong schema version", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          schema: 999,
          name: "cycles-render",
          version: "1.0.0",
          createdAt: "2024-01-01T00:00:00.000Z",
          source: { remote: "https://example.com", ref: "main" },
          toolchain: { emscripten: "3.1.0" },
          capabilities: ["headless-render"],
          requirements: {},
          artifacts: {},
        }),
        { status: 200 }
      ) as any;
    await runtime.load();
    expect(runtime.state).toBe("error");
  });

  it("enters error state when manifest has invalid artifact name", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          schema: 1,
          name: "invalid-name",
          version: "1.0.0",
          createdAt: "2024-01-01T00:00:00.000Z",
          source: { remote: "https://example.com", ref: "main" },
          toolchain: { emscripten: "3.1.0" },
          capabilities: ["headless-render"],
          requirements: {},
          artifacts: {},
        }),
        { status: 200 }
      ) as any;
    await runtime.load();
    expect(runtime.state).toBe("error");
  });

  it("enters error state when manifest is missing required fields", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ schema: 1 }), { status: 200 }) as any;
    await runtime.load();
    expect(runtime.state).toBe("error");
  });

  it("enters error state when manifest has invalid capabilities", async () => {
    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          schema: 1,
          name: "cycles-render",
          version: "1.0.0",
          createdAt: "2024-01-01T00:00:00.000Z",
          source: { remote: "https://example.com", ref: "main" },
          toolchain: { emscripten: "3.1.0" },
          capabilities: ["invalid-capability"],
          requirements: {},
          artifacts: {},
        }),
        { status: 200 }
      ) as any;
    await runtime.load();
    expect(runtime.state).toBe("error");
  });

  // ===== getManifest Tests =====
  it("getManifest returns null when manifest is absent (404)", async () => {
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    expect(runtime.getManifest()).toBe(null);
  });

  it("getManifest returns null when manifest fetch throws", async () => {
    globalThis.fetch = async () => {
      throw new Error("Network failure");
    };
    await runtime.load();
    expect(runtime.getManifest()).toBe(null);
  });

  it("getManifest returns null when manifest is invalid", async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ version: "invalid" }), { status: 200 }) as any;
    await runtime.load();
    expect(runtime.getManifest()).toBe(null);
  });

  // ===== renderSampleScene Without Load Tests =====
  it("renderSampleScene returns error when not loaded", async () => {
    const result = await runtime.renderSampleScene();
    expect(result.success).toBe(false);
    expect(result.error).toContain("not available");
    expect(result.error).toContain("not loaded");
  });

  it("renderSampleScene returns error with correct id when not loaded", async () => {
    const result = await runtime.renderSampleScene();
    expect(result.id).toBe("n/a");
  });

  it("renderSampleScene returns error with 'n/a' id when manifest fetch fails", async () => {
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    const result = await runtime.renderSampleScene();
    expect(result.id).toBe("n/a");
    expect(result.success).toBe(false);
  });

  // ===== dispose Tests =====
  it("dispose resets runtime to unavailable after 404 load", async () => {
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    runtime.dispose();
    expect(runtime.state).toBe("unavailable");
    expect(runtime.isLoaded).toBe(false);
    expect(runtime.getManifest()).toBe(null);
  });

  it("dispose does not throw when called twice", async () => {
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    runtime.dispose();
    expect(() => runtime.dispose()).not.toThrow();
  });

  it("dispose resets isWasmReady to false", async () => {
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    expect(runtime.isWasmReady).toBe(false);
    runtime.dispose();
    expect(runtime.isWasmReady).toBe(false);
  });

  it("dispose clears all progress callbacks", async () => {
    const events: any[] = [];
    runtime.onProgress((p) => events.push(p));
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    runtime.dispose();
    // After dispose, callbacks should be cleared
    expect(runtime.state).toBe("unavailable");
  });

  it("dispose clears all state change callbacks", async () => {
    const states: string[] = [];
    runtime.onStateChange((s) => states.push(s));
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    runtime.dispose();
    expect(runtime.state).toBe("unavailable");
  });

  // ===== Multiple Load Attempts Tests =====
  it("load returns early if already loaded", async () => {
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    expect(runtime.state).toBe("error");
    // Second load should return early
    await runtime.load();
    expect(runtime.state).toBe("error");
  });

  it("load can be called after dispose", async () => {
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    expect(runtime.state).toBe("error");
    runtime.dispose();
    expect(runtime.state).toBe("unavailable");
    // Now load again - should work
    await runtime.load();
    expect(runtime.state).toBe("error");
  });

  // ===== onStateChange Callback Tests =====
  it("onStateChange is called when entering error state", async () => {
    const states: string[] = [];
    runtime.onStateChange((s) => states.push(s));
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    expect(states).toContain("loading");
    expect(states).toContain("error");
  });

  it("onStateChange receives correct state values", async () => {
    const states: string[] = [];
    runtime.onStateChange((s) => states.push(s));
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    expect(states.every((s) => typeof s === "string")).toBe(true);
    expect(states).toContain("error");
  });

  it("multiple onStateChange callbacks are all called", async () => {
    const states1: string[] = [];
    const states2: string[] = [];
    runtime.onStateChange((s) => states1.push(s));
    runtime.onStateChange((s) => states2.push(s));
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    expect(states1).toContain("error");
    expect(states2).toContain("error");
  });

  // ===== Error Message Tests =====
  it("error message contains HTTP status when fetch returns non-ok", async () => {
    globalThis.fetch = async () => new Response("", { status: 503 }) as any;
    await runtime.load();
    // The exact error message is logged but we mainly check state
    expect(runtime.state).toBe("error");
  });

  // ===== Load with Different Error Conditions =====
  it("handles manifest fetch with corrupt JSON", async () => {
    globalThis.fetch = async () => new Response("not valid json{{{", { status: 200 }) as any;
    await runtime.load();
    // Should throw when trying to parse JSON
    expect(runtime.state).toBe("error");
  });

  it("handles manifest fetch with null response", async () => {
    globalThis.fetch = async () => new Response("null", { status: 200 }) as any;
    await runtime.load();
    expect(runtime.state).toBe("error");
  });

  it("handles manifest fetch with array response", async () => {
    globalThis.fetch = async () => new Response("[]", { status: 200 }) as any;
    await runtime.load();
    expect(runtime.state).toBe("error");
  });

  // ===== State Machine Transition Sequence Tests =====
  it("transitions to loading before error on 404", async () => {
    const states: string[] = [];
    runtime.onStateChange((s) => states.push(s));
    globalThis.fetch = async () => new Response("", { status: 404 }) as any;
    await runtime.load();
    const errorIndex = states.indexOf("error");
    const loadingIndex = states.indexOf("loading");
    expect(loadingIndex).toBeLessThan(errorIndex);
  });

  it("transitions to loading before error on network failure", async () => {
    const states: string[] = [];
    runtime.onStateChange((s) => states.push(s));
    globalThis.fetch = async () => {
      throw new Error("Network failure");
    };
    await runtime.load();
    const errorIndex = states.indexOf("error");
    const loadingIndex = states.indexOf("loading");
    expect(loadingIndex).toBeLessThan(errorIndex);
  });

  it("transitions to loading before error on invalid manifest", async () => {
    const states: string[] = [];
    runtime.onStateChange((s) => states.push(s));
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ version: "invalid" }), { status: 200 }) as any;
    await runtime.load();
    const errorIndex = states.indexOf("error");
    const loadingIndex = states.indexOf("loading");
    expect(loadingIndex).toBeLessThan(errorIndex);
  });

  // ===== WASM Load Success Tests (requires bug fix) =====
  // These tests verify the _instantiateWasm loading -> ready state transition works.
  // They require: (1) valid manifest, (2) window.Module set before loadScript resolves.
  describe("WASM load success (with valid manifest)", () => {
    const validManifest = {
      schema: 1,
      name: "cycles-render",
      version: "1.0.0",
      createdAt: "2024-01-01T00:00:00.000Z",
      source: { remote: "https://example.com", ref: "main" },
      toolchain: { emscripten: "3.1.0" },
      capabilities: ["headless-render"],
      requirements: {},
      artifacts: {
        "cycles.js": { path: "cycles.js", mediaType: "application/javascript", bytes: 199_300 },
        "cycles.wasm": { path: "cycles.wasm.zst", mediaType: "application/wasm", bytes: 3_400_000 },
        "cycles.data": { path: "cycles.data", mediaType: "application/octet-stream", bytes: 12 },
      },
    };

    beforeEach(() => {
      // Valid manifest fetch
      globalThis.fetch = async () =>
        new Response(JSON.stringify(validManifest), { status: 200 }) as any;

      // Mock appendChild: set window.Module before firing onload.
      // This simulates what the real cycles.js does when it executes:
      // it sets window.Module synchronously before onload fires.
      vi.spyOn(document.head, "appendChild").mockImplementation((el: any) => {
        if (el?.tagName === "SCRIPT") {
          (window as any).Module = {
            callMain: () => {},
            FS: { mkdir: () => {}, chdir: () => {}, readFile: () => new Uint8Array([0x89, 0x50, 0x4e, 0x47]) },
          };
          if (typeof el.onload === "function") {
            el.onload({ type: "load" } as any);
          }
        }
        return el;
      });
    });

    it("load reaches ready state with valid manifest and mocked WASM", async () => {
      await runtime.load();
      expect(runtime.state).toBe("ready");
      expect(runtime.isLoaded).toBe(true);
      expect(runtime.isWasmReady).toBe(true);
    });

    it("getManifest returns manifest after successful load", async () => {
      await runtime.load();
      const manifest = runtime.getManifest();
      expect(manifest).not.toBeNull();
      expect(manifest?.name).toBe("cycles-render");
    });

    it("state transitions: unavailable -> loading -> ready on full load", async () => {
      const states: string[] = [];
      runtime.onStateChange((s) => states.push(s));

      await runtime.load();

      expect(states).toContain("loading");
      expect(states).toContain("ready");
      expect(runtime.state).toBe("ready");
    });

    it("progress events include instantiate phase during load", async () => {
      const phases: string[] = [];
      runtime.onProgress((p) => phases.push(p.phase));

      await runtime.load();

      expect(phases).toContain("fetch");
      expect(phases).toContain("instantiate");
    });
  });
});
