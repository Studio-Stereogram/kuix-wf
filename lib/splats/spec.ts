// A splat scene is plain data: which shapes, where, in which brand colours,
// and how the beads are drawn. The same spec always builds the same picture,
// so a scene can be saved as a preset or passed around as a seed.

export type Form = "cube" | "donut";
export type PaletteName = "orange" | "green" | "blue" | "ruby";

export type ShapeSpec = {
  form: Form;
  palette: PaletteName;
  /**
   * Centre in frame units: x -1 is the left edge and 1 the right edge, y -1
   * the bottom and 1 the top. z is in world units; negative is further away
   * (and softer, the focus sits at 0).
   */
  at: [number, number, number];
  /** Size in half-frame units of the shorter side: 1 spans half the frame. */
  size: number;
  /** Rotation in degrees, applied x, then y, then z. */
  rotate: [number, number, number];
  /** How far beads stray from the surface, 0 tight to 1 loose. */
  scatter?: number;
};

export type BeadStyle = {
  /** Bead diameter in world units. */
  size: number;
  /** Share of each bead's radius that fades out, 0 hard to 1 all feather. */
  softness: number;
  /** How much beads grow and fade away from the focus plane. */
  blur: number;
  /** How quickly the far beads sink into the paper. */
  haze: number;
};

export type SplatScene = {
  name: string;
  seed: number;
  /** Background colour; the far beads fade towards it. */
  paper: string;
  /** Bead budget on a wide screen. Narrow screens get about 40% of it. */
  count: number;
  /** Direction loose beads drift in, as if the shapes were moving. */
  wind: [number, number, number];
  /** Share of beads that come loose, 0 to 1. */
  drift: number;
  /** Share of beads coloured from another shape's palette. */
  accent: number;
  bead: BeadStyle;
  shapes: ShapeSpec[];
};
