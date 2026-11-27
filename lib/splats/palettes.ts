import type { PaletteName } from "./spec";

// Colour ramps, light to dark, taken from the gradient stops of the kuix.hu
// header shapes (cube and donut in each colour). A splat's place on its shape
// and the way its face turns to the light pick a point along the ramp.
export const palettes: Record<PaletteName, string[]> = {
  orange: ["#FFF5B9", "#FEE85C", "#FEC561", "#DC9934", "#E6542B"],
  green: ["#E4FFDA", "#BFD770", "#A9D37D", "#9DBD5A", "#028C7E"],
  blue: ["#18BBAB", "#07A796", "#1F9B97", "#0B6463", "#1F3649"],
  ruby: ["#FF9058", "#FB592B", "#D6543C", "#A44344", "#673160"],
};

const hex = (h: string): [number, number, number] => {
  const n = parseInt(h.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const rgb: Record<PaletteName, [number, number, number][]> = {
  orange: palettes.orange.map(hex),
  green: palettes.green.map(hex),
  blue: palettes.blue.map(hex),
  ruby: palettes.ruby.map(hex),
};

/** Samples a ramp at t in 0..1 into out (display values, not linear). */
export function ramp(name: PaletteName, t: number, out: number[], o: number) {
  const stops = rgb[name];
  const x = Math.min(0.9999, Math.max(0, t)) * (stops.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = stops[i];
  const b = stops[i + 1];
  out[o] = a[0] + (b[0] - a[0]) * f;
  out[o + 1] = a[1] + (b[1] - a[1]) * f;
  out[o + 2] = a[2] + (b[2] - a[2]) * f;
}

export const hexRgb = hex;
