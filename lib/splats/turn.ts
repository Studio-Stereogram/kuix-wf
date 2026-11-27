import { MAX_SHAPES } from "./build";

// The ambient spin. Each shape turns about the vertical axis through its own
// centre at its own speed and direction (about 2 to 3.5 degrees a second), and
// tilts gently back and forth as it goes. Small shapes turn a little faster.
// The result is one 3x3 matrix per shape, column-major, as WebGL takes it;
// the renderer and the splats worker use the same ones.

export function turns(sizes: number[], t: number, out: Float32Array) {
  for (let i = 0; i < MAX_SHAPES; i++) {
    const size = sizes[i] ?? 1;
    const dir = i % 2 === 0 ? 1 : -1;
    const speed = (0.035 + 0.025 / (0.6 + size)) * dir;
    const yaw = speed * t;
    const pitch = 0.16 * Math.sin(t * 0.11 + i * 1.7);
    const cy = Math.cos(yaw);
    const sy = Math.sin(yaw);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    // Yaw * Pitch, written out column by column.
    out.set([cy, 0, -sy, sy * sp, cp, cy * sp, sy * cp, -sp, cy * cp], i * 9);
  }
  return out;
}
