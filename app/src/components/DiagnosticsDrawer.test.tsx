import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DiagnosticsDrawer } from "./DiagnosticsDrawer";

describe("DiagnosticsDrawer", () => {
  const caps = {
    hasWebGPU: true,
    hasSharedArrayBuffer: true,
    crossOriginIsolated: true,
    userAgent: "Mozilla/5.0",
    deviceMemory: 8,
    hardwareConcurrency: 16,
  };

  it("renders diagnostics summary", () => {
    render(<DiagnosticsDrawer capabilities={caps} />);
    expect(screen.getByText("Diagnostics")).toBeInTheDocument();
  });

  it("shows WebGPU capability", () => {
    render(<DiagnosticsDrawer capabilities={caps} />);
    expect(screen.getByText("WebGPU")).toBeInTheDocument();
  });

  it("shows user agent", () => {
    render(<DiagnosticsDrawer capabilities={caps} />);
    expect(screen.getByText("User-Agent")).toBeInTheDocument();
  });

  it("displays hardware concurrency", () => {
    render(<DiagnosticsDrawer capabilities={caps} />);
    expect(screen.getByText("Hardware Concurrency")).toBeInTheDocument();
  });
});
