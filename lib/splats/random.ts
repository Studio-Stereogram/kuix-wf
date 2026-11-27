// Seeded randomness, so a seed always rebuilds the same scene.
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gauss = () => {
    const u = 1 - next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * next());
  };
  const range = (a: number, b: number) => a + (b - a) * next();
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(next() * xs.length)];
  return { next, gauss, range, pick };
}

export type Rng = ReturnType<typeof rng>;
