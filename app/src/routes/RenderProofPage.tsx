/**
 * RenderProofPage
 *
 * The initial render-proof page for the Blender Web Runtime.
 * Shows honest states: unavailable, loading, ready, rendering, success, error.
 * No fake Blender output is ever displayed.
 *
 * The actual render is powered by CyclesRenderRuntime.
 */

import { useEffect, useRef, useState } from "react";
import { CyclesRenderRuntime, type RuntimeProgress as RuntimeProgressType } from "../runtime/CyclesRenderRuntime";
import { RuntimeProgress } from "../components/RuntimeProgress";
import { DiagnosticsDrawer } from "../components/DiagnosticsDrawer";
import { StorageStatus } from "../components/StorageStatus";
import { RenderHistoryList } from "../components/RenderHistoryList";
import type { RuntimeState } from "../runtime/runtimeState";

function getBrowserCapabilities() {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    hardwareConcurrency?: number;
    gpu?: unknown;
  };
  return {
    hasWebGPU: !!nav.gpu,
    hasSharedArrayBuffer: typeof SharedArrayBuffer !== "undefined",
    crossOriginIsolated: window.crossOriginIsolated,
    userAgent: navigator.userAgent,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
  };
}

export function RenderProofPage() {
  const runtimeRef = useRef<CyclesRenderRuntime | null>(null);
  const [state, setState] = useState<RuntimeState>("unavailable");
  const [progress, setProgress] = useState<RuntimeProgressType | null>(null);
  const [capabilities] = useState(getBrowserCapabilities);

  useEffect(() => {
    const runtime = new CyclesRenderRuntime();
    runtimeRef.current = runtime;

    const unsubProgress = runtime.onProgress((p) => {
      setProgress(p ? { phase: p.phase as any, percent: p.percent, message: p.message } : null);
    });

    const unsubState = runtime.onStateChange((s) => {
      setState(s);
    });

    // Set initial state
    setState(runtime.state);

    runtime.load();

    return () => {
      unsubProgress();
      unsubState();
      runtime.dispose();
    };
  }, []);

  const [r2Version, setR2Version] = useState<string | null>(null);

  // Check R2 manifest version on mount
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (runtime) {
      runtime.checkR2Version().then(({ version }) => {
        if (version) setR2Version(version);
      }).catch(() => {});
    }
  }, []);

  const handleRender = async () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    setState(runtime.state);
    const result = await runtime.renderSampleScene();
    setState(runtime.state);
    if (!result.success) {
      setProgress({ phase: "render", message: result.error });
    }
  };

  const isReady = state === "ready";
  const isUnavailable = state === "unavailable";
  const isRendering = state === "rendering";
  const isSuccess = state === "success";
  const isError = state === "error";

  return (
    <main style={{ padding: "2rem", maxWidth: "640px", margin: "0 auto" }}>
      <h1>Blender Web Runtime</h1>

      {isUnavailable && (
        <div className="status-panel unavailable">
          <p>Render artifacts are not available in this build.</p>
          <p className="hint">Run <code>make mvp</code> on a builder to produce artifacts.</p>
        </div>
      )}

      {state === "loading" && (
        <div className="status-panel loading">
          <RuntimeProgress
            phase={progress?.phase as any}
            percent={progress?.percent}
            message={progress?.message ?? "Loading..."}
          />
          {r2Version && (
            <p className="version-hint" style={{ fontSize: "0.75rem", color: "#666", marginTop: "0.5rem" }}>
              Artifact version: {r2Version}
            </p>
          )}
        </div>
      )}

      {isReady && (
        <div className="status-panel ready">
          <RuntimeProgress
            phase="instantiate"
            percent={1}
            message={progress?.message ?? "Ready to render."}
          />
          <button onClick={handleRender} disabled={isRendering}>
            {isRendering ? "Rendering..." : "Render Scene"}
          </button>
        </div>
      )}

      {isSuccess && (
        <div className="status-panel success">
          <p>Render complete.</p>
          <button onClick={handleRender}>Render Again</button>
        </div>
      )}

      {isError && (
        <div className="status-panel error">
          <p>{progress?.message ?? "An error occurred."}</p>
          <button onClick={() => runtimeRef.current?.load()}>Retry</button>
        </div>
      )}

      <DiagnosticsDrawer capabilities={capabilities} />
      <StorageStatus runtime={runtimeRef.current} />
      <RenderHistoryList />
    </main>
  );
}
