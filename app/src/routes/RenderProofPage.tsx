/**
 * RenderProofPage
 *
 * The initial render-proof page for the Blender Web Runtime.
 * Shows honest states: unavailable, loading, ready, rendering, success, error.
 * No fake Blender output is ever displayed.
 */

export function RenderProofPage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Blender Web Runtime</h1>
      <p>Real Blender pixels in the browser — coming soon.</p>
    </main>
  );
}
