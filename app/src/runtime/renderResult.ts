/**
 * renderResult
 *
 * Contract for render operation results returned by the runtime adapter.
 */

export interface RenderResult {
  success: boolean;
  id: string;
  imageUrl?: string;
  imageBytes?: Uint8Array;
  width?: number;
  height?: number;
  renderTimeMs?: number;
  error?: string;
}
