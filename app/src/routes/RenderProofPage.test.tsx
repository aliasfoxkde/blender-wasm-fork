import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RenderProofPage } from "./RenderProofPage";

describe("RenderProofPage", () => {
  it("renders heading", () => {
    render(<RenderProofPage />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders status text", () => {
    render(<RenderProofPage />);
    expect(screen.getByText(/coming soon/)).toBeInTheDocument();
  });
});
