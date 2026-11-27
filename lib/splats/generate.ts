import { rng } from "./random";
import type { Form, PaletteName, ShapeSpec, SplatScene } from "./spec";

const PAPER = "#F2F1EC";

const style = {
  grain: 0.008,
  body: 0.3,
  bodyShare: 0.1,
  loose: 0.04,
  dither: 0.6,
  blur: 0.5,
  haze: 0.08,
  organic: 0.6,
};

// The kuix.hu profile header, rebuilt in 3D around the feed's centred
// opening: the big green donut low on the right, the green cube cut off at
// the top right, the orange cube upper left and a small orange cube further
// back on the right edge. The middle stays clear for the text.
export const kuixHeader: SplatScene = {
  name: "KUIX header",
  seed: 7,
  paper: PAPER,
  count: 170000,
  wind: [-1, 0.35, 0.2],
  drift: 0.07,
  accent: 0.012,
  style,
  shapes: [
    { form: "donut", palette: "green", at: [0.9, -0.7, 0], size: 0.92, rotate: [62, 0, 24], scatter: 0.6 },
    { form: "cube", palette: "green", at: [0.8, 1.0, -1.6], size: 0.62, rotate: [32, 38, 14] },
    { form: "cube", palette: "orange", at: [-0.84, 0.4, 0.4], size: 0.4, rotate: [28, -32, 8], scatter: 0.7 },
    { form: "cube", palette: "orange", at: [1.02, 0.18, -3.2], size: 0.3, rotate: [36, 45, 0] },
    { form: "donut", palette: "orange", at: [-0.96, -0.86, -2.4], size: 0.62, rotate: [58, 0, -30] },
  ],
};

// The palettes that sit well together; a scene takes one pair.
const pairs: [PaletteName, PaletteName][] = [
  ["green", "orange"],
  ["orange", "ruby"],
  ["blue", "green"],
  ["ruby", "blue"],
  ["orange", "blue"],
  ["green", "ruby"],
];

/**
 * A new scene from a seed. The rules:
 * - one large hero shape bleeding off a side edge,
 * - one medium shape on the other side, often cut by the top or bottom edge,
 * - one to three small ones, set further back so they go soft,
 * - nothing in the middle, where the text sits, and loose splats drift away
 *   from it,
 * - two palettes per scene, the hero in the first.
 */
export function generate(seed: number, from: readonly Form[] = ["cube", "donut"]): SplatScene {
  const r = rng(seed * 9973 + 17);
  const [a, b] = r.pick(pairs);
  const side = r.next() < 0.5 ? -1 : 1;
  // One random number per pick, so the classic cube-and-donut set keeps
  // giving the same scene for the same seed.
  const form = (): Form => from[Math.min(from.length - 1, Math.floor(r.next() * from.length))];
  const turn = (f: Form): [number, number, number] => {
    switch (f) {
      case "donut":
      case "torus":
        return [r.range(50, 74), r.range(-20, 20), r.range(-40, 40)];
      case "pyramid":
      case "cylinder":
        return [r.range(10, 34), r.range(-60, 60), r.range(-18, 18)];
      case "capsule":
        return [r.range(-40, 40), r.range(-60, 60), r.range(-50, 50)];
      default:
        return [r.range(24, 40), r.range(-50, 50), r.range(-20, 20)];
    }
  };

  const shapes: ShapeSpec[] = [];
  const hero = form();
  shapes.push({
    form: hero,
    palette: a,
    at: [side * r.range(0.9, 1.08), r.range(-0.7, 0.55), r.range(-0.4, 0.3)],
    size: r.range(0.72, 0.92),
    rotate: turn(hero),
    scatter: r.range(0.3, 0.8),
  });
  const mid = form();
  shapes.push({
    form: mid,
    palette: r.next() < 0.6 ? b : a,
    at: [-side * r.range(0.8, 1.0), (r.next() < 0.5 ? -1 : 1) * r.range(0.6, 1.0), r.range(-1.8, -0.4)],
    size: r.range(0.45, 0.68),
    rotate: turn(mid),
    scatter: r.range(0.2, 0.7),
  });
  const small = 1 + Math.floor(r.next() * 3);
  for (let i = 0; i < small; i++) {
    const f = form();
    const s = r.next() < 0.5 ? -1 : 1;
    shapes.push({
      form: f,
      palette: r.next() < 0.5 ? a : b,
      at: [s * r.range(0.72, 1.05), r.range(-0.95, 0.95), r.range(-3.6, 0.6)],
      size: r.range(0.2, 0.36),
      rotate: turn(f),
      scatter: r.range(0.2, 0.9),
    });
  }

  return {
    name: `Seed ${seed}`,
    seed,
    paper: PAPER,
    count: 170000,
    // Loose splats rise and drift outwards, away from the text.
    wind: [side * r.range(0.2, 0.6), r.range(0.5, 1), r.range(-0.3, 0.3)],
    drift: r.range(0.03, 0.08),
    accent: r.range(0.005, 0.02),
    style,
    shapes,
  };
}
