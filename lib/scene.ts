// Scene specs are the contract between content blocks and the WebGL layer.
// Each block declares how the world should look while it is on screen. The
// director blends neighbouring specs, so any block order produces seamless
// joins without hand-tuned transitions.

export type Tone = "dark" | "light";

export type SceneSpec = {
  /** Background base colour and the colour of the slow-moving glow. */
  bg: [string, string];
  tone: Tone;
  /**
   * Shape of the signal object. 0 noise, 1 sphere (idea), 2 lattice (system),
   * 3 interface (product). A tuple interpolates across the block's scroll.
   */
  morph: number | [number, number];
  /** Object offset in half-viewport units (-1 left edge, 1 right edge). */
  x?: number;
  y?: number;
  scale?: number;
  /** Particle opacity. Lower it behind dense text. */
  opacity?: number;
  /** Overrides under 768px. */
  mobile?: Partial<Pick<SceneSpec, "x" | "y" | "scale" | "opacity">>;
};

export type SceneEntry = {
  el: HTMLElement;
  spec: SceneSpec;
  label: string;
  index: string;
};

const entries = new Set<SceneEntry>();

export const sceneRegistry = {
  add(entry: SceneEntry) {
    entries.add(entry);
    return () => void entries.delete(entry);
  },
  list(): SceneEntry[] {
    return [...entries]
      .filter((e) => e.el.isConnected)
      .sort((a, b) =>
        a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
      );
  },
};

export const palette = {
  ink: "#121212",
  paper: "#F5F5F5",
  accent: "#C5F23A",
};
