import type { SceneName } from "./scenes";

// Page composition lives here. Reorder a page by reordering its array: block
// indices and the WebGL blending follow the new order automatically.
export type BlockType =
  | "hero"
  | "approach"
  | "process"
  | "process-b"
  | "services"
  | "work"
  | "work-all"
  | "industries"
  | "industries-detailed"
  | "culture"
  | "culture-detailed"
  | "testimonials"
  | "prefooter"
  | "footer"
  | "contact-form"
  | "page-hero";

export type BlockConfig = {
  type: BlockType;
  scene: SceneName;
  label: string;
  props?: Record<string, unknown>;
};

const closing: BlockConfig[] = [
  { type: "prefooter", scene: "prefooter", label: "Contact" },
  { type: "footer", scene: "footer", label: "Footer" },
];

export const pages: Record<string, BlockConfig[]> = {
  home: [
    { type: "hero", scene: "signal", label: "Signal" },
    { type: "approach", scene: "approach", label: "Our approach" },
    { type: "process", scene: "method", label: "Our method" },
    // Version B of the method, shown under the current one for comparison.
    { type: "process-b", scene: "method", label: "Our method (version B)", props: { variant: true } },
    { type: "services", scene: "services", label: "Our services" },
    { type: "work", scene: "work", label: "Selected work", props: { limit: 8 } },
    { type: "industries", scene: "industries", label: "Industries" },
    { type: "culture", scene: "culture", label: "Culture" },
    { type: "testimonials", scene: "testimonials", label: "What clients say" },
    ...closing,
  ],
  services: [
    {
      type: "page-hero",
      scene: "page",
      label: "Services",
      props: { title: "From first question to long after launch.", lead: "Discovery, planning, implementation and maintenance, delivered by one team so nothing is lost between stages." },
    },
    { type: "services", scene: "services", label: "Our services" },
    { type: "process", scene: "method", label: "Our method" },
    ...closing,
  ],
  industries: [
    {
      type: "page-hero",
      scene: "page",
      label: "Industries",
      props: { title: "Different sectors, the same standard.", lead: "We bring patterns from one industry to the next, and respect the rules that make each one different." },
    },
    { type: "industries-detailed", scene: "industries", label: "Sectors" },
    ...closing,
  ],
  "case-studies": [
    {
      type: "page-hero",
      scene: "approach",
      label: "Case Studies",
      props: { title: "Work measured by what it changed.", lead: "A selection of products and platforms we designed and built with our clients." },
    },
    { type: "work-all", scene: "work", label: "Projects" },
    ...closing,
  ],
  culture: [
    {
      type: "page-hero",
      scene: "page",
      label: "Culture",
      props: { title: "Curious people, simple outcomes.", lead: "A small senior team of designers, developers and AI engineers who like hard problems and plain answers." },
    },
    { type: "culture-detailed", scene: "culture", label: "Team" },
    { type: "testimonials", scene: "testimonials", label: "What clients say" },
    ...closing,
  ],
  contact: [
    {
      type: "page-hero",
      scene: "page",
      label: "Contact",
      props: { title: "Let’s build something that works.", lead: "New product, a stalled AI pilot or a platform that needs rethinking. Start with a short brief." },
    },
    { type: "contact-form", scene: "approach", label: "Brief" },
    { type: "footer", scene: "footer", label: "Footer" },
  ],
};
