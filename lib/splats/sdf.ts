import type { Form } from "./spec";

// The shapes as distance functions, in a unit space where each one fits in a
// sphere of radius about 1. A distance function says how far any point is
// from the surface (negative inside), which lets us put beads on the surface,
// find which way the surface faces, and later blend or morph shapes.

// A cube with softly rounded edges, as in the kuix.hu cubes.
const B = 0.62; // half extent
const RB = 0.13; // edge radius
function cube(x: number, y: number, z: number) {
  const qx = Math.abs(x) - B + RB;
  const qy = Math.abs(y) - B + RB;
  const qz = Math.abs(z) - B + RB;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  const oz = Math.max(qz, 0);
  return Math.sqrt(ox * ox + oy * oy + oz * oz) + Math.min(Math.max(qx, qy, qz), 0) - RB;
}

// The kuix donut: a thick ring with flat faces and rounded edges, that is a
// rounded rectangle swept around the y axis.
const R = 0.64; // ring radius (centre of the cross-section)
const W = 0.32; // half width of the cross-section, across the ring
const H = 0.25; // half height of the cross-section
const RD = 0.12; // edge radius
function donut(x: number, y: number, z: number) {
  const qx = Math.abs(Math.sqrt(x * x + z * z) - R) - W + RD;
  const qy = Math.abs(y) - H + RD;
  const ox = Math.max(qx, 0);
  const oy = Math.max(qy, 0);
  return Math.sqrt(ox * ox + oy * oy) + Math.min(Math.max(qx, qy), 0) - RD;
}

export const sdf: Record<Form, (x: number, y: number, z: number) => number> = { cube, donut };

/** Half extent of a box that holds the shape, for sampling. */
export const bounds: Record<Form, [number, number, number]> = {
  cube: [B, B, B],
  donut: [R + W, H, R + W],
};

/** Surface area in unit space, to share the bead budget fairly. */
export const area: Record<Form, number> = {
  cube: 6 * (2 * B) ** 2 * 0.93,
  donut: 2 * Math.PI * ((R + W) * 2 * H + (R - W) * 2 * H + (R + W) ** 2 - (R - W) ** 2) * 0.93,
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
