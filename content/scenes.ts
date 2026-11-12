import type { SceneSpec } from "@/lib/scene";

// Two page colours: #121212 for dark sections and #F5F5F5 for light ones. The
// director blends between them as sections pass, and flips the text colours
// (and the navigation) at the halfway point.
const DARK: [string, string] = ["#121212", "#161616"];
const LIGHT: [string, string] = ["#F5F5F5", "#F0F0F0"];

export const scenes = {
  signal: { bg: LIGHT, tone: "light", morph: 0, x: 0.45, scale: 1.05, mobile: { x: 0, y: 0.3, scale: 0.75, opacity: 0.7 } },
  page: { bg: DARK, tone: "dark", morph: 0, x: 0.45, scale: 1.05, mobile: { x: 0, y: 0.3, scale: 0.75, opacity: 0.7 } },
  approach: { bg: DARK, tone: "dark", morph: [0.1, 0.9], x: 0.55, y: -0.1, scale: 0.85, opacity: 0.45 },
  method: { bg: DARK, tone: "dark", morph: [0.9, 1.6], x: 0, y: -0.15, scale: 1.2, opacity: 0.14 },
  services: { bg: LIGHT, tone: "light", morph: 2, x: -0.62, y: -0.42, scale: 0.55, opacity: 0.65 },
  work: { bg: DARK, tone: "dark", morph: 2.2, x: 0, scale: 0.8, opacity: 0 },
  industries: { bg: DARK, tone: "dark", morph: 1, x: 0.55, scale: 0.85, opacity: 0.45 },
  culture: { bg: DARK, tone: "dark", morph: [1, 2], x: 0.5, y: -0.1, scale: 0.75, opacity: 0.3 },
  testimonials: { bg: DARK, tone: "dark", morph: 2.2, x: -0.45, y: -0.35, scale: 0.8, opacity: 0.3 },
  prefooter: { bg: LIGHT, tone: "light", morph: [2.4, 3], x: 0.45, y: 0, scale: 1.1, opacity: 0.75 },
  footer: { bg: DARK, tone: "dark", morph: 3, x: 0, y: 0.6, scale: 1.3, opacity: 0.35 },
} satisfies Record<string, SceneSpec>;

export type SceneName = keyof typeof scenes;
