import "@testing-library/jest-dom";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { RenderProofPage } from "./RenderProofPage";

// Mock the runtime to avoid actual network calls
vi.mock("../runtime/CyclesRenderRuntime", () => ({
  CyclesRenderRuntime: vi.fn().mockImplementation(() => ({
    state: "unavailable",
    isLoaded: false,
    getManifest: () => null,
    onProgress: () => () => {},
    load: vi.fn().mockResolvedValue(undefined),
    renderSampleScene: vi.fn().mockResolvedValue({ success: false, id: "test", error: "no artifacts" }),
    dispose: vi.fn(),
  })),
}));

describe("RenderProofPage", () => {
  it("renders heading", () => {
    render(<RenderProofPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("shows unavailable state when artifacts are missing", () => {
    render(<RenderProofPage />);
    expect(screen.getByText(/not available/i)).toBeInTheDocument();
  });

  it("shows a code snippet with make mvp", () => {
    render(<RenderProofPage />);
    expect(screen.getByText(/make mvp/i)).toBeInTheDocument();
  });

  it("shows diagnostics drawer", () => {
    render(<RenderProofPage />);
    expect(screen.getByText(/Diagnostics/i)).toBeInTheDocument();
  });

  it("does not show fake Blender output", () => {
    const { container } = render(<RenderProofPage />);
    expect(container.querySelector("canvas")).toBeNull();
  });
});
