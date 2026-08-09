/**
 * CyclesRenderRuntime
 *
 * Browser runtime adapter for the Cycles headless WASM renderer.
 *
 * This is the product-side adapter that sits between the UI and the
 * actual Blender WASM runtime. It is responsible for:
 * - Loading and validating the artifact manifest
 * - Reporting clear missing-artifact states (never fake success)
 * - Instantiating the WASM module
 * - Dispatching render commands and returning real result bytes
 *
 * The actual WASM instantiation and render execution are deferred until
 * real artifacts are available and the runtime is properly integrated.
 */

import type { ArtifactManifest } from "./ArtifactManifest";
import { RuntimeStateMachine } from "./runtimeState";
import type { RenderResult } from "./renderResult";

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


const ARTIFACT_BASE = "/demo/public";

export class CyclesRenderRuntime {
  private _manifest: ArtifactManifest | null = null;
  private _loaded = false;
  private _state: RuntimeStateMachine;
  private _progressCallbacks: Array<(p: RuntimeProgress) => void> = [];

  constructor() {
    this._state = new RuntimeStateMachine("unavailable");
  }

  get state() {
    return this._state.state;
  }

  get isLoaded() {
    return this._loaded;
  }

  getManifest(): ArtifactManifest | null {
    return this._manifest;
  }

  onProgress(callback: (p: RuntimeProgress) => void): () => void {
    this._progressCallbacks.push(callback);
    return () => {
      const idx = this._progressCallbacks.indexOf(callback);
      if (idx >= 0) this._progressCallbacks.splice(idx, 1);
    };
  }

  private emit(progress: RuntimeProgress) {
    for (const cb of this._progressCallbacks) {
      cb(progress);
    }
  }

  /**
   * Load the artifact manifest and probe for artifact availability.
   * Does NOT instantiate the WASM module (that requires a real builder run).
   *
   * If no manifest exists, the runtime enters the "unavailable" state
   * and reports a clear diagnostic message — NOT a fake success.
   */
  async load(): Promise<void> {
    if (this._loaded) return;

    this._state.transition("loading");
    this.emit({ phase: "fetch", message: "Checking for render artifacts..." });

    let manifest: unknown = null;
    try {
      const res = await fetch(`${ARTIFACT_BASE}/manifest.json`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      manifest = await res.json();
    } catch (err) {
      this._state.transition("error");
      this.emit({
        phase: "fetch",
        message: "Render artifacts are not available. Run 'make mvp' on a builder.",
      });
      console.warn("[CyclesRenderRuntime] Artifact manifest not available:", err);
      return;
    }

    // Validate the manifest shape
    const { validateArtifactManifest } = await import("./validateArtifactManifest");
    const result = validateArtifactManifest(manifest);
    if (!result.valid) {
      this._state.transition("error");
      this.emit({
        phase: "fetch",
        message: `Artifact manifest is invalid: ${result.errors.join("; ")}`,
      });
      console.error("[CyclesRenderRuntime] Invalid manifest:", result.errors);
      return;
    }

    this._manifest = manifest as ArtifactManifest;
    this._loaded = true;
    this._state.transition("ready");
    this.emit({ phase: "instantiate", message: "Artifacts loaded. Ready to render." });
  }

  /**
   * Render a sample scene.
   *
   * Currently returns a clear "not available" result since real WASM
   * artifacts have not been produced yet. When real artifacts are present
   * and the WASM module is instantiated, this will return actual pixels.
   */
  async renderSampleScene(_options?: RenderOptions): Promise<RenderResult> {
    if (!this._loaded || !this._manifest) {
      return {
        success: false,
        id: "n/a",
        error: "Runtime not loaded. Artifacts are not available.",
      };
    }

    this._state.transition("rendering");
    this.emit({ phase: "render", percent: 0, message: "Starting render..." });

    // Real WASM execution goes here once artifacts are built.
    // For now, return a clear unavailable result.
    this._state.transition("error");
    this.emit({
      phase: "render",
      message: "Render requires built WASM artifacts. Run 'make mvp' on a builder.",
    });

    return {
      success: false,
      id: "n/a",
      error:
        "Real render not yet available. " +
        "The Cycles WASM artifact has not been built. " +
        "Run 'make mvp' on a machine with enough RAM/disk to produce artifacts.",
    };
  }

  dispose(): void {
    this._progressCallbacks = [];
    this._manifest = null;
    this._loaded = false;
    this._state = new RuntimeStateMachine("unavailable");
  }
}
