// The pointer halos the splat renderer knows, by name. The shader picks one
// with uMode (the index here); the scene builder lists them from this file.

export const halos = {
  push: {
    name: "Push",
    mode: 0,
    description:
      "A wide, soft field that partly disperses the shapes: each splat drifts its own distance away from the pointer, off the surface and a little at random, so the body loosens and scatters.",
  },
  loupe: {
    name: "Loupe",
    mode: 1,
    description:
      "A scan. Nothing moves bar a very slight magnification; under the pointer the scene is drawn in higher definition: body splats tighten, depth blur and haze clear, grain turns more opaque and finer, colour gains saturation and contrast. Outside it the scene is untouched.",
  },
} as const;

export type Halo = keyof typeof halos;
