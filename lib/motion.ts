// Shared motion vocabulary. Every animation in the site pulls from here so
// timing feels like one system rather than a collection of effects.
export const ease = {
  out: "expo.out",
  inOut: "expo.inOut",
  in: "power3.in",
  css: "cubic-bezier(0.22, 1, 0.36, 1)",
};

export const dur = { fast: 0.45, base: 0.9, slow: 1.2 };

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Resolves once the boot sequence has finished on first load. Reveals wait on
// it so nothing animates underneath the boot overlay.
let resolveReady: () => void = () => {};
export const ready = new Promise<void>((r) => (resolveReady = r));
export const markReady = () => resolveReady();

export const nextFrame = () =>
  new Promise<void>((r) => requestAnimationFrame(() => r()));
