import { ramp } from "./palettes";
import { rng } from "./random";
import { area, bounds, normal, sdf } from "./sdf";
import type { SplatScene } from "./spec";

// Turns a scene into beads. Building happens once per scene, in each shape's
// own unit space; laying out (placing and sizing the shapes in the frame) is
// cheap and runs again whenever the frame changes shape.

export type Beads = {
  count: number;
  /** Position in the shape's unit space, already rotated. */
  local: Float32Array;
  /** Which shape each bead belongs to. */
  shape: Uint8Array;
  /** Colour in display values. */
  color: Float32Array;
  /** Relative bead size. */
  size: Float32Array;
  /** A random number per bead, for anything that should vary. */
  seed: Float32Array;
};

// Key light from the left and in front, as in the SVG shading: faces turned
// to it take the light end of the ramp, the tops of the cubes the deep end.
const L = norm([-0.6, 0.3, 0.75]);
// The direction the colour runs across each shape, upper left to lower right.
const D = norm([0.8, -0.5, 0.2]);

function norm(v: number[]) {
  const l = Math.hypot(v[0], v[1], v[2]);
  return [v[0] / l, v[1] / l, v[2] / l];
}

function rotation([rx, ry, rz]: [number, number, number]) {
  const [a, b, c] = [rx, ry, rz].map((d) => (d * Math.PI) / 180);
  const [ca, sa, cb, sb, cc, sc] = [Math.cos(a), Math.sin(a), Math.cos(b), Math.sin(b), Math.cos(c), Math.sin(c)];
  // Rz * Ry * Rx: x is applied first.
  return [
    cc * cb, cc * sb * sa - sc * ca, cc * sb * ca + sc * sa,
    sc * cb, sc * sb * sa + cc * ca, sc * sb * ca - cc * sa,
    -sb, cb * sa, cb * ca,
  ];
}

function apply(m: number[], v: number[], out: number[]) {
  const [x, y, z] = v;
  out[0] = m[0] * x + m[1] * y + m[2] * z;
  out[1] = m[3] * x + m[4] * y + m[5] * z;
  out[2] = m[6] * x + m[7] * y + m[8] * z;
}

export function build(scene: SplatScene, budget: number): Beads {
  const r = rng(scene.seed);
  const weights = scene.shapes.map((s) => area[s.form] * s.size * s.size);
  const total = weights.reduce((a, b) => a + b, 0);
  const counts = weights.map((w) => Math.round((budget * w) / total));
  const count = counts.reduce((a, b) => a + b, 0);

  const local = new Float32Array(count * 3);
  const shape = new Uint8Array(count);
  const color = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const seed = new Float32Array(count);

  const wind = norm(scene.wind);
  const n = [0, 0, 0];
  const p = [0, 0, 0];
  const pw = [0, 0, 0];
  const nw = [0, 0, 0];
  const c = [0, 0, 0];
  const pad = 0.06;
  let i = 0;

  scene.shapes.forEach((s, si) => {
    const f = sdf[s.form];
    const [bx, by, bz] = bounds[s.form];
    const m = rotation(s.rotate);
    const loose = scene.drift * (0.6 + (s.scatter ?? 0.5) * 0.8);
    const others = scene.shapes.filter((o) => o.palette !== s.palette).map((o) => o.palette);
    const spark = others.length ? r.pick(others) : s.palette;

    for (let k = 0; k < counts[si]; ) {
      let x = r.range(-bx - pad, bx + pad);
      let y = r.range(-by - pad, by + pad);
      let z = r.range(-bz - pad, bz + pad);
      const d = f(x, y, z);
      if (Math.abs(d) > 0.05) continue;
      // Onto the surface, then a little way under it: beads stacked just
      // beneath the skin are what make the surface read soft and thick.
      normal(f, x, y, z, n);
      const sink = d + Math.abs(r.gauss()) * 0.022;
      x -= n[0] * sink;
      y -= n[1] * sink;
      z -= n[2] * sink;

      // Some beads come loose: they lift off the surface and trail away
      // downwind, thinning out with distance.
      const free = r.next() < loose;
      if (free) {
        const e = -Math.log(1 - r.next());
        const lift = e * 0.07;
        const trail = e * e * 0.18;
        x += n[0] * lift + wind[0] * trail + r.gauss() * 0.04 * e;
        y += n[1] * lift + wind[1] * trail + r.gauss() * 0.04 * e;
        z += n[2] * lift + wind[2] * trail + r.gauss() * 0.04 * e;
      }

      p[0] = x; p[1] = y; p[2] = z;
      apply(m, p, pw);
      apply(m, n, nw);
      local[i * 3] = pw[0];
      local[i * 3 + 1] = pw[1];
      local[i * 3 + 2] = pw[2];
      shape[i] = si;

      // Colour: faces turned away from the light take the dark end of the
      // ramp, and the ramp also runs across the shape, like the SVG gradients.
      const lit = nw[0] * L[0] + nw[1] * L[1] + nw[2] * L[2];
      const across = (pw[0] * D[0] + pw[1] * D[1] + pw[2] * D[2] + 1) * 0.5;
      const shade = Math.min(1.3, Math.max(0, 1 - lit));
      let t = 0.04 + shade * 0.56 + across * 0.26 + r.gauss() * 0.045;
      if (free) t -= 0.1;
      // The odd bead takes its colour from the other palette in the scene.
      if (r.next() < scene.accent) ramp(spark, 0.15 + r.next() * 0.5, c, 0);
      else ramp(s.palette, t, c, 0);
      color[i * 3] = c[0];
      color[i * 3 + 1] = c[1];
      color[i * 3 + 2] = c[2];

      size[i] = Math.exp(r.gauss() * 0.28) * (free ? 0.8 : 1);
      seed[i] = r.next();
      i++;
      k++;
    }
  });

  return { count, local, shape, color, size, seed };
}

export type Frame = { aspect: number; camera: number; fov: number };

/**
 * Places the beads in the frame. Positions follow the shapes' frame units, so
 * the composition holds on a wide or a tall screen. Returns world positions
 * and a far-to-near drawing order (soft beads must be drawn back to front).
 */
export function layout(scene: SplatScene, beads: Beads, frame: Frame, out?: Float32Array) {
  const halfH = frame.camera * Math.tan((frame.fov * Math.PI) / 360);
  const halfW = halfH * frame.aspect;
  const unit = Math.min(halfW, halfH);
  // On a tall screen the text fills the width, so the shapes move further out
  // and more of them is cut by the edges.
  const spread = frame.aspect < 0.8 ? 1.22 : 1;
  const centres = scene.shapes.map((s) => {
    // A shape further back is moved outwards so it still lands where the
    // frame units put it.
    const k = (frame.camera - s.at[2]) / frame.camera;
    return [s.at[0] * halfW * k * spread, s.at[1] * halfH * k, s.at[2], s.size * unit];
  });

  const pos = out ?? new Float32Array(beads.count * 3);
  const dist = new Float32Array(beads.count);
  for (let i = 0; i < beads.count; i++) {
    const [cx, cy, cz, s] = centres[beads.shape[i]];
    const x = cx + beads.local[i * 3] * s;
    const y = cy + beads.local[i * 3 + 1] * s;
    const z = cz + beads.local[i * 3 + 2] * s;
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
    const dz = frame.camera - z;
    dist[i] = x * x + y * y + dz * dz;
  }
  const order = new Uint32Array(beads.count);
  for (let i = 0; i < beads.count; i++) order[i] = i;
  order.sort((a, b) => dist[b] - dist[a]);
  return { pos, order, unit };
}
