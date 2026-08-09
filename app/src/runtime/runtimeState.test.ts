import { describe, it, expect } from "vitest";
import { RuntimeStateMachine, RUNTIME_STATES } from "./runtimeState";

describe("RuntimeStateMachine", () => {
  it("starts with given initial state", () => {
    const sm = new RuntimeStateMachine("unavailable");
    expect(sm.state).toBe("unavailable");
  });

  it("defaults to unavailable", () => {
    const sm = new RuntimeStateMachine();
    expect(sm.state).toBe("unavailable");
  });

  it("transitions from unavailable to loading", () => {
    const sm = new RuntimeStateMachine("unavailable");
    sm.transition("loading");
    expect(sm.state).toBe("loading");
  });

  it("transitions from loading to ready", () => {
    const sm = new RuntimeStateMachine("loading");
    sm.transition("ready");
    expect(sm.state).toBe("ready");
  });

  it("transitions from loading to error", () => {
    const sm = new RuntimeStateMachine("loading");
    sm.transition("error");
    expect(sm.state).toBe("error");
  });

  it("transitions from ready to rendering", () => {
    const sm = new RuntimeStateMachine("ready");
    sm.transition("rendering");
    expect(sm.state).toBe("rendering");
  });

  it("transitions from rendering to success", () => {
    const sm = new RuntimeStateMachine("rendering");
    sm.transition("success");
    expect(sm.state).toBe("success");
  });

  it("transitions from rendering to error", () => {
    const sm = new RuntimeStateMachine("rendering");
    sm.transition("error");
    expect(sm.state).toBe("error");
  });

  it("transitions from error to loading (retry)", () => {
    const sm = new RuntimeStateMachine("error");
    sm.transition("loading");
    expect(sm.state).toBe("loading");
  });

  it("transitions from error to unavailable", () => {
    const sm = new RuntimeStateMachine("error");
    sm.transition("unavailable");
    expect(sm.state).toBe("unavailable");
  });

  it("allows re-render from success", () => {
    const sm = new RuntimeStateMachine("success");
    sm.transition("rendering");
    expect(sm.state).toBe("rendering");
  });

  it("allows returning to ready from success", () => {
    const sm = new RuntimeStateMachine("success");
    sm.transition("ready");
    expect(sm.state).toBe("ready");
  });

  it("rejects invalid state name", () => {
    expect(() => new RuntimeStateMachine("not-a-state" as any)).toThrow("Invalid initial state");
  });

  it("rejects invalid transition from unavailable", () => {
    const sm = new RuntimeStateMachine("unavailable");
    expect(() => sm.transition("ready")).toThrow(/Invalid transition/);
    expect(() => sm.transition("rendering")).toThrow(/Invalid transition/);
    expect(() => sm.transition("success")).toThrow(/Invalid transition/);
    expect(() => sm.transition("error")).toThrow(/Invalid transition/);
  });

  it("rejects invalid transition from loading", () => {
    const sm = new RuntimeStateMachine("loading");
    expect(() => sm.transition("rendering")).toThrow(/Invalid transition/);
    expect(() => sm.transition("success")).toThrow(/Invalid transition/);
  });

  it("rejects invalid transition from ready", () => {
    const sm = new RuntimeStateMachine("ready");
    expect(() => sm.transition("error")).toThrow(/Invalid transition/);
    expect(() => sm.transition("unavailable")).toThrow(/Invalid transition/);
  });

  it("rejects invalid transition from success", () => {
    const sm = new RuntimeStateMachine("success");
    expect(() => sm.transition("loading")).toThrow(/Invalid transition/);
    expect(() => sm.transition("unavailable")).toThrow(/Invalid transition/);
  });

  it("rejects invalid transition from error", () => {
    const sm = new RuntimeStateMachine("error");
    expect(() => sm.transition("ready")).toThrow(/Invalid transition/);
    expect(() => sm.transition("rendering")).toThrow(/Invalid transition/);
    expect(() => sm.transition("success")).toThrow(/Invalid transition/);
  });

  it("toString reflects current state", () => {
    const sm = new RuntimeStateMachine("loading");
    expect(sm.toString()).toBe("RuntimeStateMachine(loading)");
  });

  it("is never terminal (retry always possible)", () => {
    const sm = new RuntimeStateMachine("success");
    expect(sm.isTerminal).toBe(false);
  });

  it("has all states defined in RUNTIME_STATES", () => {
    expect(RUNTIME_STATES).toContain("unavailable");
    expect(RUNTIME_STATES).toContain("loading");
    expect(RUNTIME_STATES).toContain("ready");
    expect(RUNTIME_STATES).toContain("rendering");
    expect(RUNTIME_STATES).toContain("success");
    expect(RUNTIME_STATES).toContain("error");
    expect(RUNTIME_STATES).toHaveLength(6);
  });
});
