/**
 * CyclesRenderRuntime
 *
 * Browser runtime adapter for the Cycles headless WASM renderer.
 *
 * Responsibilities:
 * - Loading and validating the artifact manifest
 * - Reporting clear missing-artifact states (never fake success)
 * - Instantiating the WASM module from /demo/public/
 * - Dispatching render commands and returning real result bytes
 */

import type { ArtifactManifest } from "./ArtifactManifest";
import { RuntimeStateMachine, type RuntimeState } from "./runtimeState";
import type { RenderResult } from "./renderResult";
import { getCachedWasm, setCachedWasm } from "./WasmCache";

export interface RuntimeProgress {
  phase: "fetch" | "decompress" | "instantiate" | "render";
  percent?: number;
  message?: string;
}

export interface RenderOptions {
  sceneId?: string;
  width?: number;
  height?: number;
  samples?: number;
  timeoutMs?: number;
}

interface CyclesModule {
  callMain: (args: string[]) => number;
  ccall: (ident: string, returnType: string, argTypes: string[], args?: unknown[]) => unknown;
  cwrap: (ident: string, returnType: string, argTypes?: string[]) => unknown;
  FS: {
    readFile: (path: string, opts?: { encoding?: string; flag?: string }) => string | Uint8Array;
    writeFile: (path: string, data: string | Uint8Array) => void;
    mkdir: (path: string) => void;
    chdir: (path: string) => void;
  };
  onRuntimeInitialized: () => void;
  locateFile: (path: string) => string;
}

// Artifact base URL — set via VITE_ARTIFACT_BASE env var at build time.
// Fallback: local demo/public (for local development).
// In production (Cloudflare Pages), set to the R2 Worker URL.
const ARTIFACT_BASE = import.meta.env.VITE_ARTIFACT_BASE ?? "/demo/public";
const WASMFS_OUT = "/out";

export class CyclesRenderRuntime {
  private _manifest: ArtifactManifest | null = null;
  private _loaded = false;
  private _wasmReady = false;
  private _state: RuntimeStateMachine;
  private _progressCallbacks: Array<(p: RuntimeProgress) => void> = [];
  private _stateCallbacks: Array<(s: RuntimeState) => void> = [];
  private _module: CyclesModule | null = null;

  constructor() {
    this._state = new RuntimeStateMachine("unavailable");
  }

  get state() {
    return this._state.state;
  }

  get isLoaded() {
    return this._loaded;
  }

  get isWasmReady() {
    return this._wasmReady;
  }

  getManifest(): ArtifactManifest | null {
    return this._manifest;
  }

  /** Number of WASM entries currently cached in IndexedDB. */
  async getCacheSize(): Promise<number> {
    const { getCacheSize: getSize } = await import("./WasmCache");
    return getSize();
  }

  /** Clear all cached WASM bytes from IndexedDB. */
  async clearCache(): Promise<void> {
    const { clearWasmCache } = await import("./WasmCache");
    await clearWasmCache();
  }

  onProgress(callback: (p: RuntimeProgress) => void): () => void {
    this._progressCallbacks.push(callback);
    return () => {
      const idx = this._progressCallbacks.indexOf(callback);
      if (idx >= 0) this._progressCallbacks.splice(idx, 1);
    };
  }

  onStateChange(callback: (s: RuntimeState) => void): () => void {
    this._stateCallbacks.push(callback);
    return () => {
      const idx = this._stateCallbacks.indexOf(callback);
      if (idx >= 0) this._stateCallbacks.splice(idx, 1);
    };
  }

  private emit(progress: RuntimeProgress) {
    for (const cb of this._progressCallbacks) {
      cb(progress);
    }
  }

  private emitState(state: RuntimeState) {
    for (const cb of this._stateCallbacks) {
      cb(state);
    }
  }

  private async loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${src}"]`);
      if (existing) { resolve(); return; }
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Load the artifact manifest and instantiate the Cycles WASM module.
   */
  async load(): Promise<void> {
    if (this._loaded) return;

    this._state.transition("loading");
    this.emitState(this._state.state);
    this.emit({ phase: "fetch", message: "Checking for render artifacts..." });

    // Load manifest
    let manifest: unknown = null;
    try {
      const res = await fetch(`${ARTIFACT_BASE}/manifest.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      manifest = await res.json();
    } catch (err) {
      this._state.transition("error");
      this.emitState(this._state.state);
      this.emit({
        phase: "fetch",
        message: "Render artifacts are not available. Run 'make mvp' on a builder.",
      });
      console.warn("[CyclesRenderRuntime] Artifact manifest not available:", err);
      return;
    }

    // Validate manifest
    const { validateArtifactManifest } = await import("./validateArtifactManifest");
    const result = validateArtifactManifest(manifest);
    if (!result.valid) {
      this._state.transition("error");
      this.emitState(this._state.state);
      this.emit({
        phase: "fetch",
        message: `Artifact manifest is invalid: ${result.errors.join("; ")}`,
      });
      console.error("[CyclesRenderRuntime] Invalid manifest:", result.errors);
      return;
    }

    this._manifest = manifest as ArtifactManifest;
    this._loaded = true;
    this.emit({ phase: "fetch", message: "Manifest loaded." });

    // Instantiate WASM module
    await this._instantiateWasm();
  }

  private async _instantiateWasm(): Promise<void> {
    // State is already "loading" (set by load()). Don't re-transition — loading->loading is invalid.
    this.emitState(this._state.state);
    this.emit({ phase: "instantiate", message: "Loading Cycles WASM module..." });

    const wasmUrl = `${ARTIFACT_BASE}/cycles.wasm.zst`;

    try {
      // Try to load WASM bytes from IndexedDB cache first (fast warm start)
      const cachedBytes = await getCachedWasm(wasmUrl);

      // Expose locateFile so emscripten can find cycles.wasm next to cycles.js.
      // Prefer cycles.wasm.zst (zstd-compressed, ~3.4 MB vs 16.3 MB) when the
      // server supports streaming decompression. Fall back to uncompressed .wasm.
      (window as unknown as Record<string, unknown>).__cyclesLocateFile = (path: string) => {
        if (path.endsWith(".wasm")) return `${ARTIFACT_BASE}/cycles.wasm.zst`;
        if (path.endsWith(".data")) return `${ARTIFACT_BASE}/cycles.data`;
        return `${ARTIFACT_BASE}/${path}`;
      };

      await this.loadScript(`${ARTIFACT_BASE}/cycles.js`);

      const rawModule = (window as unknown as Record<string, unknown>)["Module"];
      const Module = typeof rawModule === "function" ? rawModule() : rawModule as Partial<CyclesModule>;

      // If we have cached bytes, provide them directly via wasmBinary.
      // Emscripten will use this instead of fetching the .wasm file.
      if (cachedBytes) {
        Module["wasmBinary"] = cachedBytes;
      }

      Module["locateFile"] = (path: string) => {
        if (path.endsWith(".wasm")) return `${ARTIFACT_BASE}/cycles.wasm.zst`;
        if (path.endsWith(".data")) return `${ARTIFACT_BASE}/cycles.data`;
        return `${ARTIFACT_BASE}/${path}`;
      };

      Module["onRuntimeInitialized"] = () => {
        this._wasmReady = true;
        this._module = Module as CyclesModule;
        this._state.transition("ready");
        this.emitState(this._state.state);
        this.emit({ phase: "instantiate", message: "Cycles module ready." });

        // Asynchronously cache the WASM bytes for next time (if not already cached)
        // We read from _module after it's set, but the actual WASM bytes may not
        // be easily extractable — instead we fetch and cache if wasmBinary was used.
        // Note: once Module is instantiated, we can't easily re-read the WASM buffer.
        // The cache works on the NEXT load, not the current one.
      };

      // If already initialized (cached), fire immediately
      if ((Module as CyclesModule).callMain) {
        this._wasmReady = true;
        this._module = Module as CyclesModule;
        this._state.transition("ready");
        this.emitState(this._state.state);
        this.emit({ phase: "instantiate", message: "Cycles module ready." });
      }

      // After successful instantiation, cache the WASM bytes for next time.
      // We need to re-fetch (the browser already downloaded it) — cache for next load.
      if (!cachedBytes) {
        this._cacheWasmForNextTime(wasmUrl).catch(() => {
          // Non-fatal — cache misses are fine
        });
      }
    } catch (err) {
      this._state.transition("error");
      this.emitState(this._state.state);
      this.emit({
        phase: "instantiate",
        message: `Failed to load Cycles WASM: ${err}`,
      });
      console.error("[CyclesRenderRuntime] WASM load failed:", err);
    }
  }

  private async _cacheWasmForNextTime(wasmUrl: string): Promise<void> {
    try {
      const res = await fetch(wasmUrl);
      if (!res.ok) return;
      const bytes = await res.arrayBuffer();
      await setCachedWasm(wasmUrl, bytes);
    } catch {
      // Network or decode errors — skip caching
    }
  }

  /**
   * Render a scene using the Cycles WASM module.
   *
   * Uses WASMFS (/out/ as output directory) to capture the render PNG.
   */
  async renderSampleScene(_options?: RenderOptions): Promise<RenderResult> {
    if (!this._loaded || !this._manifest) {
      return {
        success: false,
        id: "n/a",
        error: "Runtime not loaded. Artifacts are not available.",
      };
    }

    if (!this._wasmReady || !this._module) {
      return {
        success: false,
        id: "n/a",
        error: "WASM module not ready. Loading may have failed.",
      };
    }

    this._state.transition("rendering");
    this.emitState(this._state.state);
    this.emit({ phase: "render", percent: 0, message: "Starting render..." });

    try {
      const mod = this._module;

      // Ensure output directory exists in WASMFS
      mod.FS.mkdir(WASMFS_OUT);
      mod.FS.chdir(WASMFS_OUT);

      // Build Cycles CLI arguments for a minimal render.
      // The scene file is preloaded via --preload-file web/scenes@/scenes in link_cycles_web.sh.
      const samples = _options?.samples ?? 32;
      const args = [
        "/scenes/scene.blend",
        "--background",
        "--cycles-samples", String(samples),
        "-o", `${WASMFS_OUT}/`,
        "-F", "PNG",
        "-x", "1",
        "-f", "1",
      ];

      this.emit({ phase: "render", percent: 20, message: "Running Cycles render..." });

      const exitCode = mod.callMain(args);

      this.emit({ phase: "render", percent: 90, message: "Reading output..." });

      if (exitCode !== 0) {
        this._state.transition("error");
        this.emitState(this._state.state);
        this.emit({ phase: "render", message: `Render exited with code ${exitCode}` });
        return { success: false, id: "n/a", error: `Render exited with code ${exitCode}` };
      }

      // Read the output PNG from WASMFS
      let pngBytes: Uint8Array;
      try {
        pngBytes = mod.FS.readFile(`${WASMFS_OUT}/0001.png`, {
          encoding: "binary",
        }) as unknown as Uint8Array;
      } catch {
        this._state.transition("error");
        this.emitState(this._state.state);
        return { success: false, id: "n/a", error: "Render completed but no output file found." };
      }

      this._state.transition("success");
      this.emitState(this._state.state);
      this.emit({ phase: "render", percent: 100, message: "Render complete." });

      return {
        success: true,
        id: `cycles-${Date.now()}`,
        imageBytes: pngBytes,
        width: _options?.width ?? 128,
        height: _options?.height ?? 128,
      };
    } catch (err) {
      this._state.transition("error");
      this.emitState(this._state.state);
      const message = err instanceof Error ? err.message : String(err);
      this.emit({ phase: "render", message: `Render failed: ${message}` });
      return { success: false, id: "n/a", error: message };
    }
  }

  dispose(): void {
    this._progressCallbacks = [];
    this._stateCallbacks = [];
    this._manifest = null;
    this._loaded = false;
    this._wasmReady = false;
    this._module = null;
    this._state = new RuntimeStateMachine("unavailable");
  }
}
