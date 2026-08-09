/**
 * runtimeState
 *
 * Runtime state machine for the Blender Web Runtime.
 * States: unavailable | loading | ready | rendering | success | error
 *
 * Transitions:
 *   unavailable -> loading
 *   loading -> ready
 *   loading -> error
 *   ready -> rendering
 *   rendering -> success
 *   rendering -> error
 *   success -> rendering  (re-render)
 *   error -> loading      (retry)
 */

export const RUNTIME_STATES = [
  "unavailable",
  "loading",
  "ready",
  "rendering",
  "success",
  "error",
] as const;

export type RuntimeState = typeof RUNTIME_STATES[number];

const VALID_TRANSITIONS: Record<RuntimeState, RuntimeState[]> = {
  unavailable: ["loading"],
  loading: ["ready", "error"],
  ready: ["rendering"],
  rendering: ["success", "error", "ready"],
  success: ["rendering", "ready"],
  error: ["loading", "unavailable"],
};

export class RuntimeStateMachine {
  private _state: RuntimeState;

  constructor(initial: RuntimeState = "unavailable") {
    if (!RUNTIME_STATES.includes(initial)) {
      throw new Error(`Invalid initial state: ${initial}`);
    }
    this._state = initial;
  }

  get state(): RuntimeState {
    return this._state;
  }

  get isTerminal(): boolean {
    return false; // no truly terminal states — retry is always possible
  }

  transition(next: RuntimeState): void {
    if (!RUNTIME_STATES.includes(next)) {
      throw new Error(`Invalid state: ${next}`);
    }
    const allowed = VALID_TRANSITIONS[this._state];
    if (!allowed.includes(next)) {
      throw new Error(
        `Invalid transition from "${this._state}" to "${next}". ` +
        `Allowed: ${allowed.join(", ") || "none"}`
      );
    }
    this._state = next;
  }

  toString(): string {
    return `RuntimeStateMachine(${this._state})`;
  }
}
