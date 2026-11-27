// A splat scene is plain data: which shapes, where, in which brand colours,
// and how the splats are drawn. The same spec always builds the same picture,
// so a scene can be saved as a preset or passed around as a seed.

export const forms = ["cube", "donut", "torus", "pyramid", "cylinder", "capsule", "octahedron"] as const;
export type Form = (typeof forms)[number];
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
  /** How far splats stray from the surface, 0 tight to 1 loose. */
  scatter?: number;
};

// Each shape is drawn with three kinds of splat: large soft body splats that
// lie flat on the surface and blur into a mass of colour, a fine grain over
// them, and loose splats that break away downwind.
export type SplatStyle = {
  /** Grain dot diameter, in world units. */
  grain: number;
  /** Body splat diameter, in world units. */
  body: number;
  /** Share of splats that are body splats. */
  bodyShare: number;
  /** Loose splat diameter, in world units. */
  loose: number;
  /**
   * How sprayed the texture is: 0 smooth transparency, 1 every pixel either
   * drawn or not, like a dithered print.
   */
  dither: number;
  /** How much splats grow and fade away from the focus plane. */
  blur: number;
  /** How quickly the far splats sink into the paper. */
  haze: number;
  /** How much surfaces wobble, thin out in patches and vary in colour, 0 to 1. */
  organic: number;
};

export type SplatScene = {
  name: string;
  seed: number;
  /** Background colour; the far splats fade towards it. */
  paper: string;
  /** Splat budget on a wide screen. Narrow screens get about 40% of it. */
  count: number;
  /** Direction loose splats drift in, as if the shapes were moving. */
  wind: [number, number, number];
  /** Share of splats that come loose, 0 to 1. */
  drift: number;
  /** Share of splats coloured from another shape's palette. */
  accent: number;
  style: SplatStyle;
  shapes: ShapeSpec[];
};
