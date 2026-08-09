/**
 * RuntimeProgress
 *
 * Shows progress for artifact loading, decompression, instantiation, and rendering.
 * Props driven by CyclesRenderRuntime progress events.
 */

export type ProgressPhase = "fetch" | "decompress" | "instantiate" | "render";

export interface RuntimeProgressProps {
  phase?: ProgressPhase;
  percent?: number;
  message?: string;
}

export function RuntimeProgress({ phase, percent, message }: RuntimeProgressProps) {
  const pct = percent !== undefined ? percent : phase ? 1 : undefined;

  return (
    <div className="runtime-progress">
      {phase && (
        <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100}>
          <div
            className="progress-fill"
            style={{ width: pct !== undefined ? `${pct}%` : "0%" }}
          />
        </div>
      )}
      {message && (
        <p className="progress-message">{message}</p>
      )}
    </div>
  );
}
