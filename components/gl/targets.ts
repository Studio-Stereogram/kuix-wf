// Point targets for each stage of the narrative. None of them is an exact
// object: each is a soft distribution that only hints at a form, and the
// shader keeps them breathing with noise on top.
//   0 noise   → scattered signal
//   1 nebula  → the idea gathers into a loose, uneven cloud
//   2 field   → a wide, undulating plane: structure without edges
//   3 vortex  → a slow spiral pulling everything towards a centre

const rand = (() => {
  let s = 1337;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
})();

const gauss = () => {
  const u = 1 - rand();
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

function noiseCloud(n: number) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    out[i * 3] = gauss() * 1.35;
    out[i * 3 + 1] = gauss() * 0.95;
    out[i * 3 + 2] = gauss() * 1.1;
  }
  return out;
}

// A fuzzy, lopsided shell. Radius varies with direction so it never reads
// as a clean sphere.
function nebula(n: number) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const th = rand() * Math.PI * 2;
    const ph = Math.acos(2 * rand() - 1);
    const x = Math.sin(ph) * Math.cos(th);
    const y = Math.cos(ph);
    const z = Math.sin(ph) * Math.sin(th);
    const lobe = 1 + 0.22 * Math.sin(th * 2 + 0.6) * Math.sin(ph * 3) + 0.12 * Math.cos(th * 3);
    const r = 1.45 * lobe + gauss() * 0.22;
    out[i * 3] = x * r * 1.1;
    out[i * 3 + 1] = y * r * 0.9;
    out[i * 3 + 2] = z * r;
  }
  return out;
}

// A soft sheet with interfering waves, fading out at its edges.
function field(n: number) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = Math.sqrt(rand()) * 2.6;
    const a = rand() * Math.PI * 2;
    const x = Math.cos(a) * r * 1.25;
    const z = Math.sin(a) * r * 0.9;
    const h = 0.35 * Math.sin(x * 1.6) * Math.cos(z * 1.3) + 0.18 * Math.sin((x + z) * 2.4);
    out[i * 3] = x;
    out[i * 3 + 1] = h + gauss() * 0.05 * (1 + r * 0.4);
    out[i * 3 + 2] = z;
  }
  return out;
}

// Two loose spiral arms with a dense core and wide gaussian scatter.
function vortex(n: number) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const t = Math.pow(rand(), 0.7);
    const arm = rand() < 0.5 ? 0 : Math.PI;
    const r = 0.15 + t * 2.4;
    const a = arm + t * 5.2 + gauss() * 0.35;
    const spread = 0.1 + t * 0.28;
    out[i * 3] = Math.cos(a) * r + gauss() * spread;
    out[i * 3 + 1] = gauss() * (0.12 - t * 0.06);
    out[i * 3 + 2] = Math.sin(a) * r + gauss() * spread;
  }
  return out;
}

export function buildTargets(n: number) {
  const seeds = new Float32Array(n);
  for (let i = 0; i < n; i++) seeds[i] = rand();
  return {
    noise: noiseCloud(n),
    nebula: nebula(n),
    field: field(n),
    vortex: vortex(n),
    seeds,
  };
}
