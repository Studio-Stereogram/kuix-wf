import type { Form } from "./spec";

// The shapes as distance functions, in a unit space where each one fits in a
// sphere of radius about 1. A distance function says how far any point is
// from the surface (negative inside), which lets us put splats on the surface,
// find which way the surface faces, and later blend or morph shapes. Every
// shape has softly rounded edges, like the kuix.hu cube and donut.

const len2 = (x: number, y: number) => Math.sqrt(x * x + y * y);
const len3 = (x: number, y: number, z: number) => Math.sqrt(x * x + y * y + z * z);
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// Cube with rounded edges.
const B = 0.62; // half extent
const RB = 0.13; // edge radius
function cube(x: number, y: number, z: number) {
  const qx = Math.abs(x) - B + RB;
  const qy = Math.abs(y) - B + RB;
  const qz = Math.abs(z) - B + RB;
  return len3(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qy, qz), 0) - RB;
}

// The kuix donut: a thick ring with flat faces and rounded edges, that is a
// rounded rectangle swept around the y axis.
const R = 0.64; // ring radius (centre of the cross-section)
const W = 0.32; // half width of the cross-section, across the ring
const H = 0.25; // half height of the cross-section
const RD = 0.12; // edge radius
function donut(x: number, y: number, z: number) {
  const qx = Math.abs(len2(x, z) - R) - W + RD;
  const qy = Math.abs(y) - H + RD;
  return len2(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - RD;
}

// Torus: a round tube swept around the y axis (the donut's softer sibling).
const TR = 0.64; // ring radius
const TT = 0.3; // tube radius
function torus(x: number, y: number, z: number) {
  return len2(len2(x, z) - TR, y) - TT;
}

// Square pyramid with rounded edges, standing on its base. Built from the
// exact distance to a pyramid of base 1 and height PH (Inigo Quilez), scaled.
const PS = 1.45; // scale: base side
const PH = 0.95; // height, relative to the base side
const PR = 0.06; // edge radius
const PY = 0.42; // how far the base sits below the centre, in base sides
function pyramidUnit(px: number, py: number, pz: number, h: number) {
  const m2 = h * h + 0.25;
  let x = Math.abs(px);
  let z = Math.abs(pz);
  if (z > x) [x, z] = [z, x];
  x -= 0.5;
  z -= 0.5;
  const qx = z;
  const qy = h * py - 0.5 * x;
  const qz = h * x + 0.5 * py;
  const s = Math.max(-qx, 0);
  const t = clamp((qy - 0.5 * z) / (m2 + 0.25), 0, 1);
  const a = m2 * (qx + s) * (qx + s) + qy * qy;
  const b = m2 * (qx + 0.5 * t) * (qx + 0.5 * t) + (qy - m2 * t) * (qy - m2 * t);
  const d2 = Math.min(qy, -qx * m2 - qy * 0.5) > 0 ? 0 : Math.min(a, b);
  return Math.sqrt((d2 + qz * qz) / m2) * Math.sign(Math.max(qz, -py));
}
function pyramid(x: number, y: number, z: number) {
  return pyramidUnit(x / PS, y / PS + PY, z / PS, PH) * PS - PR;
}

// Cylinder with rounded rims, standing upright.
const CR = 0.58; // radius
const CH = 0.58; // half height
const CRR = 0.12; // rim radius
function cylinder(x: number, y: number, z: number) {
  const dx = len2(x, z) - CR + CRR;
  const dy = Math.abs(y) - CH + CRR;
  return Math.min(Math.max(dx, dy), 0) + len2(Math.max(dx, 0), Math.max(dy, 0)) - CRR;
}

// Capsule: a pill lying along the x axis.
const KA = 0.46; // half length of the straight part
const KR = 0.42; // radius
function capsule(x: number, y: number, z: number) {
  const px = x - clamp(x, -KA, KA);
  return len3(px, y, z) - KR;
}

// Octahedron with rounded edges (exact distance, Inigo Quilez).
const OS = 0.98; // tip distance from the centre
const OR = 0.07; // edge radius
function octahedron(x: number, y: number, z: number) {
  const s = OS - OR * 1.5;
  const p = [Math.abs(x), Math.abs(y), Math.abs(z)];
  const m = p[0] + p[1] + p[2] - s;
  let q: number[];
  if (3 * p[0] < m) q = p;
  else if (3 * p[1] < m) q = [p[1], p[2], p[0]];
  else if (3 * p[2] < m) q = [p[2], p[0], p[1]];
  else return m * 0.57735027 - OR;
  const k = clamp(0.5 * (q[2] - q[1] + s), 0, s);
  return len3(q[0], q[1] - s + k, q[2] - k) - OR;
}

export const sdf: Record<Form, (x: number, y: number, z: number) => number> = {
  cube,
  donut,
  torus,
  pyramid,
  cylinder,
  capsule,
  octahedron,
};

/** Half extent of a box that holds the shape, for sampling. */
export const bounds: Record<Form, [number, number, number]> = {
  cube: [B, B, B],
  donut: [R + W, H, R + W],
  torus: [TR + TT, TT, TR + TT],
  pyramid: [PS / 2 + PR, PS * Math.max(PY, PH - PY) + PR, PS / 2 + PR],
  cylinder: [CR, CH, CR],
  capsule: [KA + KR, KR, KR],
  octahedron: [OS, OS, OS],
};

/** Surface area in unit space, to share the splat budget fairly. */
export const area: Record<Form, number> = {
  cube: 6 * (2 * B) ** 2 * 0.93,
  donut: 2 * Math.PI * ((R + W) * 2 * H + (R - W) * 2 * H + (R + W) ** 2 - (R - W) ** 2) * 0.93,
  torus: 4 * Math.PI * Math.PI * TR * TT,
  pyramid: PS * PS * (1 + 2 * Math.sqrt(PH * PH + 0.25)) * 0.95,
  cylinder: (2 * Math.PI * CR * CR + 2 * Math.PI * CR * 2 * CH) * 0.95,
  capsule: 4 * Math.PI * KR * KR + 2 * Math.PI * KR * 2 * KA,
  octahedron: 2 * Math.sqrt(3) * OS * OS * 0.92,
};

/** Surface normal at a point, from the slope of the distance function. */
export function normal(f: (x: number, y: number, z: number) => number, x: number, y: number, z: number, out: number[]) {
  const e = 1e-3;
  const nx = f(x + e, y, z) - f(x - e, y, z);
  const ny = f(x, y + e, z) - f(x, y - e, z);
  const nz = f(x, y, z + e) - f(x, y, z - e);
  const l = Math.hypot(nx, ny, nz) || 1;
  out[0] = nx / l;
  out[1] = ny / l;
  out[2] = nz / l;
}
