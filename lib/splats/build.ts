import { ramp } from "./palettes";
import { noise } from "./noise";
import { rng } from "./random";
import { area, bounds, normal, sdf } from "./sdf";
import type { SplatScene } from "./spec";

// Turns a scene into splats. Building happens once per scene, in each shape's
// own unit space; laying out (placing and sizing the shapes in the frame) is
// cheap and runs again whenever the frame changes shape.

/** The three kinds of splat, in the order the shader expects. */
export const GRAIN = 0;
export const BODY = 1;
export const LOOSE = 2;

export type Splats = {
  count: number;
  /** Position in the shape's unit space, already rotated. */
  local: Float32Array;
  /** Surface direction (rotated), so body splats can lie flat on it. */
  normal: Float32Array;
  /** Which shape each splat belongs to. */
  shape: Uint8Array;
  /** GRAIN, BODY or LOOSE. */
  kind: Float32Array;
  /** Colour in display values. */
  color: Float32Array;
  /** Relative splat size. */
  size: Float32Array;
  /** How stretched each splat is (1 round, up to about 3). */
  stretch: Float32Array;
  /** The angle of the stretch on screen, for grain and loose splats. */
  angle: Float32Array;
  /** A random number per splat, for anything that should vary. */
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

/**
 * Builds the splats for a scene. The budget sets the body and loose splats;
 * grain is then laid on that many times as densely (grainDensity), which
 * makes the surfaces finer without adding to the large, costly body splats.
 */
export function build(scene: SplatScene, budget: number, grainDensity = 1): Splats {
  const r = rng(scene.seed);
  const { organic, bodyShare } = scene.style;
  const weights = scene.shapes.map((s) => area[s.form] * s.size * s.size);
  const total = weights.reduce((a, b) => a + b, 0);
  // Extra grain on top of the base share, per shape (the loose share
  // differs per shape).
  const looseOf = scene.shapes.map((s) => scene.drift * (0.6 + (s.scatter ?? 0.5) * 0.8));
  const boost = looseOf.map((l) => 1 + Math.max(0, 1 - bodyShare - l) * (grainDensity - 1));
  const counts = weights.map((w, i) => Math.round(((budget * w) / total) * boost[i]));
  const count = counts.reduce((a, b) => a + b, 0);

  const local = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const shape = new Uint8Array(count);
  const kind = new Float32Array(count);
  const color = new Float32Array(count * 3);
  const size = new Float32Array(count);
  const stretch = new Float32Array(count);
  const angle = new Float32Array(count);
  const seed = new Float32Array(count);

  const wind = norm(scene.wind);
  const n = [0, 0, 0];
  const p = [0, 0, 0];
  const pw = [0, 0, 0];
  const nw = [0, 0, 0];
  const c = [0, 0, 0];
  const pad = 0.1;
  let i = 0;

  scene.shapes.forEach((s, si) => {
    const f = sdf[s.form];
    const [bx, by, bz] = bounds[s.form];
    const m = rotation(s.rotate);
    // The same number of loose and body splats as without the extra grain.
    const loose = looseOf[si] / boost[si];
    const body = bodyShare / boost[si] / (1 - loose);
    const others = scene.shapes.filter((o) => o.palette !== s.palette).map((o) => o.palette);
    const spark = others.length ? r.pick(others) : s.palette;
    // Each shape reads its own patch of the noise field.
    const ox = r.range(-50, 50);
    const oy = r.range(-50, 50);
    const oz = r.range(-50, 50);

    for (let k = 0; k < counts[si]; ) {
      let x = r.range(-bx - pad, bx + pad);
      let y = r.range(-by - pad, by + pad);
      let z = r.range(-bz - pad, bz + pad);
      const d = f(x, y, z);
      if (Math.abs(d) > 0.05) continue;

      // A slow noise over the surface: where it is low the surface thins
      // out, and it nudges the surface in and out so edges are never clean.
      const v = noise(x * 1.7 + ox, y * 1.7 + oy, z * 1.7 + oz);
      if (r.next() > 1 - organic * 0.8 * (1 - v) ** 1.5) continue;

      normal(f, x, y, z, n);
      const what = r.next() < loose ? LOOSE : r.next() < body ? BODY : GRAIN;
      // Body splats sit deeper, so they read as a glow under the grain.
      const sink = d + (v - 0.5) * 0.08 * organic + Math.abs(r.gauss()) * (what === BODY ? 0.05 : 0.02);
      x -= n[0] * sink;
      y -= n[1] * sink;
      z -= n[2] * sink;

      // Loose splats lift off the surface and trail away downwind, thinning
      // out with distance.
      if (what === LOOSE) {
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
      local.set(pw, i * 3);
      normals.set(nw, i * 3);
      shape[i] = si;
      kind[i] = what;

      // Colour: faces turned away from the light take the dark end of the
      // ramp, the ramp also runs across the shape like the SVG gradients, and
      // the noise mottles it. Grain varies more than the body under it, which
      // is where the texture comes from.
      const lit = nw[0] * L[0] + nw[1] * L[1] + nw[2] * L[2];
      const across = (pw[0] * D[0] + pw[1] * D[1] + pw[2] * D[2] + 1) * 0.5;
      const shade = Math.min(1.3, Math.max(0, 1 - lit));
      const jitter = what === BODY ? 0.03 : 0.09;
      let t = 0.02 + shade * 0.68 + across * 0.24 + (v - 0.5) * 0.3 * organic + r.gauss() * jitter;
      if (what === LOOSE) t -= 0.1;
      // The odd splat takes its colour from the other palette in the scene.
      if (what !== BODY && r.next() < scene.accent) ramp(spark, 0.15 + r.next() * 0.5, c, 0);
      else ramp(s.palette, t, c, 0);
      color.set(c, i * 3);

      // Sizes spread widely, with the odd much larger splat; shapes vary
      // from round to mildly oval, so the texture stays patchy.
      const big = what !== LOOSE && r.next() < 0.03 ? 2.2 : 1;
      size[i] = Math.exp(r.gauss() * (what === BODY ? 0.35 : 0.45)) * big * (what === LOOSE ? 0.9 : 1);
      stretch[i] = 1 + Math.pow(r.next(), 2) * (what === BODY ? 0.5 : 0.7);
      angle[i] = r.next() * Math.PI;
      seed[i] = r.next();
      i++;
      k++;
    }
  });

  return { count, local, normal: normals, shape, kind, color, size, stretch, angle, seed };
}

export type Frame = { aspect: number; camera: number; fov: number };

/** Most shapes a scene can hold (the shader keeps one slot per shape). */
export const MAX_SHAPES = 8;

/**
 * Places the shapes in the frame. Positions follow the shapes' frame units,
 * so the composition holds on a wide or a tall screen. Returns each shape's
 * centre and scale (x, y, z, scale per shape) for the shader.
 */
export function place(scene: SplatScene, frame: Frame) {
  const halfH = frame.camera * Math.tan((frame.fov * Math.PI) / 360);
  const halfW = halfH * frame.aspect;
  const unit = Math.min(halfW, halfH);
  // On a tall screen the text fills the width, so the shapes move further out
  // and more of them is cut by the edges.
  const spread = frame.aspect < 0.8 ? 1.22 : 1;
  const centres = new Float32Array(MAX_SHAPES * 4);
  scene.shapes.slice(0, MAX_SHAPES).forEach((s, i) => {
    // A shape further back is moved outwards so it still lands where the
    // frame units put it.
    const k = (frame.camera - s.at[2]) / frame.camera;
    centres.set([s.at[0] * halfW * k * spread, s.at[1] * halfH * k, s.at[2], s.size * unit], i * 4);
  });
  return centres;
}

/**
 * The far-to-near drawing order (soft splats must be drawn back to front),
 * with the shapes placed at their centres and turned by the given matrices
 * (column-major 3x3 per shape; none means at rest). Distances are packed
 * with the index into one number, so a plain numeric sort does the work,
 * which is much faster than sorting with a comparator.
 */
export function depthOrder(
  local: Float32Array,
  shape: Uint8Array,
  centres: Float32Array,
  turns: Float32Array | null,
  camera: number,
) {
  const n = shape.length;
  const keys = new Float64Array(n);
  const I = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  for (let i = 0; i < n; i++) {
    const s = shape[i];
    const e9 = s * 9;
    const c4 = s * 4;
    const m = turns ?? I;
    const o = turns ? e9 : 0;
    const lx = local[i * 3];
    const ly = local[i * 3 + 1];
    const lz = local[i * 3 + 2];
    const sc = centres[c4 + 3];
    const x = centres[c4] + (m[o] * lx + m[o + 3] * ly + m[o + 6] * lz) * sc;
    const y = centres[c4 + 1] + (m[o + 1] * lx + m[o + 4] * ly + m[o + 7] * lz) * sc;
    const z = centres[c4 + 2] + (m[o + 2] * lx + m[o + 5] * ly + m[o + 8] * lz) * sc;
    const dz = camera - z;
    const d = Math.min(Math.sqrt(x * x + y * y + dz * dz), 1000);
    // Furthest first: ascending on 1000 minus the distance.
    keys[i] = Math.floor((1000 - d) * 1000) * 1048576 + i;
  }
  keys.sort();
  const order = new Uint32Array(n);
  for (let i = 0; i < n; i++) order[i] = keys[i] % 1048576;
  return order;
}
