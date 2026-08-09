/**
 * HomePage
 *
 * The start/home page for the Blender Web Runtime.
 */
import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main style={{ padding: "2rem", maxWidth: "640px", margin: "0 auto" }}>
      <h1>Blender Web Runtime</h1>
      <p>
        A product-grade browser Blender runtime powered by WebAssembly and Cycles.
      </p>
      <nav style={{ marginTop: "1.5rem", display: "flex", gap: "1rem" }}>
        <Link to="/render">
          <button>Go to Render</button>
        </Link>
      </nav>
    </main>
  );
}
