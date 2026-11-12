// Tiny observable stores for state that changes every frame or must be shared
// between the WebGL layer and the DOM without React re-renders.
import type { Route } from "./routes";

function store<T extends object>(initial: T) {
  const state = { ...initial };
  const listeners = new Set<(s: T) => void>();
  return {
    get: () => state,
    set(patch: Partial<T>) {
      let changed = false;
      for (const k in patch) {
        if (state[k] !== patch[k]) {
          (state as T)[k] = patch[k] as T[typeof k];
          changed = true;
        }
      }
      if (changed) listeners.forEach((l) => l(state));
    },
    subscribe(l: (s: T) => void) {
      listeners.add(l);
      return () => void listeners.delete(l);
    },
  };
}

export type Phase = "booting" | "idle" | "exiting" | "entering";

export const transitionBus = store<{ phase: Phase; target: Route | null }>({
  phase: "booting",
  target: null,
});

export const hudBus = store<{ label: string; index: string; progress: number }>({
  label: "",
  index: "",
  progress: 0,
});

// Read by the WebGL director every frame.
export const sceneSignals = { pulse: 0 };
