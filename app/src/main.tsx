import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import "./styles/global.css";
import { HomePage } from "./routes/HomePage";
import { RenderProofPage } from "./routes/RenderProofPage";

/**
 * ErrorBoundary
 *
 * Catches React rendering errors and displays a fallback UI.
 * Does not catch event handler or async errors.
 */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ padding: "2rem", maxWidth: "640px", margin: "0 auto" }}>
          <h1>Something went wrong.</h1>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>Reload</button>
        </main>
      );
    }
    return this.props.children;
  }
}

/**
 * NavigationHeader
 *
 * A simple app shell navigation bar visible on all routes.
 */
function NavigationHeader() {
  const location = useLocation();

  return (
    <header
      style={{
        borderBottom: "1px solid var(--color-border, #e0e0e0)",
        padding: "0.75rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1.5rem",
      }}
    >
      <Link to="/" style={{ fontWeight: "bold", textDecoration: "none", color: "inherit" }}>
        Blender WASM
      </Link>
      <nav style={{ display: "flex", gap: "1rem" }}>
        <Link
          to="/"
          style={{
            textDecoration: location.pathname === "/" ? "underline" : "none",
            color: "inherit",
          }}
        >
          Home
        </Link>
        <Link
          to="/render"
          style={{
            textDecoration: location.pathname === "/render" ? "underline" : "none",
            color: "inherit",
          }}
        >
          Render
        </Link>
      </nav>
    </header>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <NavigationHeader />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/render" element={<RenderProofPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
