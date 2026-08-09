import "@testing-library/jest-dom";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RuntimeProgress } from "./RuntimeProgress";

describe("RuntimeProgress", () => {
  it("renders message when provided", () => {
    render(<RuntimeProgress message="Loading artifacts..." />);
    expect(screen.getByText("Loading artifacts...")).toBeInTheDocument();
  });

  it("renders nothing when no props", () => {
    const { container } = render(<RuntimeProgress />);
    expect(container.querySelector(".runtime-progress")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("renders progress track when phase is set", () => {
    render(<RuntimeProgress phase="fetch" percent={0.5} message="Fetching..." />);
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});
