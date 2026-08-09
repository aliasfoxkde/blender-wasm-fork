/**
 * DiagnosticsDrawer
 *
 * Shows browser capability fields for debugging.
 * Used to diagnose why WebGPU/pthreads might not be available.
 */

export interface DiagnosticsDrawerProps {
  capabilities: {
    hasWebGPU: boolean;
    hasSharedArrayBuffer: boolean;
    crossOriginIsolated: boolean;
    userAgent: string;
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };
}

export function DiagnosticsDrawer({ capabilities }: DiagnosticsDrawerProps) {
  const rows: [string, string | boolean | undefined][] = [
    ["User-Agent", capabilities.userAgent],
    ["WebGPU", capabilities.hasWebGPU],
    ["SharedArrayBuffer", capabilities.hasSharedArrayBuffer],
    ["Cross-Origin Isolated", capabilities.crossOriginIsolated],
    ["Device Memory", capabilities.deviceMemory ? `${capabilities.deviceMemory} GB` : undefined],
    ["Hardware Concurrency", capabilities.hardwareConcurrency?.toString()],
  ];

  return (
    <details className="diagnostics-drawer">
      <summary>Diagnostics</summary>
      <table>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label}>
              <th>{label}</th>
              <td>{value !== undefined ? String(value) : "unknown"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
