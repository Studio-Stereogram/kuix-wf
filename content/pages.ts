import type { SceneName } from "./scenes";
import { caseBySlug, clusterBySlug, clusters, industryBySlug, legal } from "./site";

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
  | "page-hero"
  | "detail-hero"
  | "cluster"
  | "cluster-body"
  | "related-work"
  | "related-industries"
  | "industry-body"
  | "industry-impact"
  | "featured-case"
  | "logos"
  | "next"
  | "case-hero"
  | "case-body"
  | "case-impact"
  | "team"
  | "story"
  | "office"
  | "contact-page"
  | "legal"
  | "not-found";

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
    ...clusters.map((c, i): BlockConfig => ({ type: "cluster", scene: i % 2 ? "work" : "method", label: c.title, props: { slug: c.slug } })),
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
    { type: "industry-impact", scene: "services", label: "Industry impact" },
    { type: "featured-case", scene: "work", label: "Relevant case study" },
    { type: "logos", scene: "method", label: "Partners" },
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
    { type: "testimonials", scene: "testimonials", label: "What clients say" },
    { type: "logos", scene: "method", label: "Clients" },
    ...closing,
  ],
  culture: [
    {
      type: "page-hero",
      scene: "page",
      label: "Culture",
      props: { title: "Curious people, simple outcomes.", lead: "A small senior team of designers, developers and AI engineers who like hard problems and plain answers." },
    },
    { type: "team", scene: "work", label: "Team" },
    { type: "story", scene: "method", label: "Our story" },
    { type: "office", scene: "culture", label: "Office life" },
    ...closing,
  ],
  contact: [
    {
      type: "page-hero",
      scene: "page",
      label: "Contact",
      props: { title: "Let\u2019s build something that works.", lead: "Book a short call, or tell us about the project. We reply within two working days." },
    },
    { type: "contact-page", scene: "approach", label: "Brief" },
    { type: "footer", scene: "footer", label: "Footer" },
  ],
  "not-found": [
    { type: "not-found", scene: "page", label: "Not found" },
  ],
};

// ---------- Detail pages ----------
// Built from a slug, in the same shape as the pages above.

export const clusterPage = (slug: string): BlockConfig[] => {
  const c = clusterBySlug(slug)!;
  return [
    { type: "detail-hero", scene: "page", label: c.title, props: { kind: "cluster", slug } },
    { type: "cluster-body", scene: "method", label: "Service description", props: { slug } },
    { type: "related-work", scene: "work", label: "Connected case studies", props: { cluster: slug, label: "Connected case studies", title: "Where we did it", desc: `Projects where ${c.title.toLowerCase()} was part of the work.` } },
    { type: "related-industries", scene: "industries", label: "Connected industries", props: { cluster: slug } },
    { type: "next", scene: "approach", label: "Next", props: { kind: "cluster", slug } },
    ...closing,
  ];
};

export const industryPage = (slug: string): BlockConfig[] => {
  const ind = industryBySlug(slug)!;
  return [
    { type: "detail-hero", scene: "page", label: ind.name, props: { kind: "industry", slug } },
    { type: "industry-body", scene: "method", label: "Industry description", props: { slug } },
    { type: "related-work", scene: "work", label: "Case studies", props: { industry: slug, label: "Case studies", title: "Our work here", desc: `Products we designed and built for teams in ${ind.name.toLowerCase()}.` } },
    { type: "next", scene: "approach", label: "Next", props: { kind: "industry", slug } },
    ...closing,
  ];
};

export const casePage = (slug: string): BlockConfig[] => {
  const c = caseBySlug(slug)!;
  return [
    { type: "case-hero", scene: "page", label: c.client, props: { slug } },
    { type: "case-body", scene: "method", label: "Case study", props: { slug } },
    { type: "case-impact", scene: "services", label: "Project impact", props: { slug } },
    { type: "next", scene: "work", label: "Next", props: { kind: "case", slug } },
    ...closing,
  ];
};

export const legalPage = (doc: keyof typeof legal): BlockConfig[] => [
  { type: "page-hero", scene: "page", label: "Legal", props: { title: legal[doc].title, lead: legal[doc].lead } },
  { type: "legal", scene: "work", label: legal[doc].title, props: { doc } },
  { type: "footer", scene: "footer", label: "Footer" },
];
