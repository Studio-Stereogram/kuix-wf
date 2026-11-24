// Content for the subpages: service clusters, industries, case studies, the
// team and the legal pages. Placeholder copy, shaped like the entries the
// headless CMS will hold later, so the components never need to change.
// Everything is linked by slug: a case study names its industry and services,
// and the detail pages look up their neighbours from that.

import { industries as industryCards, partners, services as serviceCards, work } from "./copy";

export const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// ---------- Service clusters ----------
export type Cluster = {
  slug: string;
  n: string;
  title: string;
  icon: string;
  hue: number;
  body: string;
  lead: string;
  description: string[];
  services: { name: string; body: string }[];
  deliverables: string[];
  duration: string;
  industries: string[];
};

const clusterExtra: Record<string, Omit<Cluster, "slug" | "n" | "title" | "icon" | "hue" | "body" | "deliverables">> = {
  Discovery: {
    lead: "Before anything is designed or built, we find out what the real problem is, who has it and what a good answer would change.",
    description: [
      "Most projects that go wrong were never really defined. Discovery is where we slow down on purpose: we talk to the people who will use the product, the people who will pay for it and the people who will run it.",
      "We map where AI can genuinely help and where it would only add risk, test the riskiest technical assumptions early, and finish with a shared picture of the problem that everyone can sign off.",
    ],
    services: [
      { name: "Stakeholder workshops", body: "Aligning goals, constraints and success measures in one room." },
      { name: "User research", body: "Interviews, field visits and analytics, turned into clear findings." },
      { name: "AI opportunity mapping", body: "Where models help, where they don't, and what data they need." },
      { name: "Technical feasibility", body: "Spikes and prototypes that de-risk the hard parts first." },
      { name: "Competitive review", body: "What exists already, and where there is room to be better." },
    ],
    duration: "2–4 weeks",
    industries: ["fintech", "healthtech", "public-sector"],
  },
  Planning: {
    lead: "Personas, journeys and scope come together into one buildable plan that design, development and the business can all agree on.",
    description: [
      "Planning turns findings into decisions. We describe who the product is for, the paths they take through it, and what goes into the first release and what can wait.",
      "The result is an architecture and a roadmap with honest estimates, so the build starts with fewer surprises and a team that knows what done looks like.",
    ],
    services: [
      { name: "Personas & journeys", body: "Who the product is for and every path they take through it." },
      { name: "Feature scoping", body: "A first release that is small enough to ship and big enough to matter." },
      { name: "Information architecture", body: "Structure, navigation and content models that scale." },
      { name: "System architecture", body: "Services, data and model choices, documented and reviewed." },
      { name: "Roadmap & estimates", body: "Milestones, budget and risks, laid out in the open." },
    ],
    duration: "3–6 weeks",
    industries: ["saas", "retail-and-commerce", "logistics"],
  },
  Implementation: {
    lead: "Designers and developers work side by side in short cycles, so the product is tested by real people long before it launches.",
    description: [
      "We design, build and test in two-week cycles with a demo at the end of each. Interface design, frontend, backend and model integration happen in the same team, which keeps decisions fast and hand-offs rare.",
      "Quality is built in rather than bolted on: automated tests, accessibility checks and evaluation suites for every AI feature, right up to a calm, rehearsed launch.",
    ],
    services: [
      { name: "Product & interface design", body: "Design systems, prototypes and production-ready screens." },
      { name: "Frontend development", body: "Fast, accessible web and mobile interfaces." },
      { name: "Backend & integrations", body: "APIs, data pipelines and the systems around them." },
      { name: "Model integration", body: "LLMs and ML models wired in with guardrails and evaluation." },
      { name: "QA & launch", body: "Testing, monitoring and a launch plan everyone has rehearsed." },
    ],
    duration: "3–9 months",
    industries: ["fintech", "saas", "retail-and-commerce", "healthtech"],
  },
  Maintenance: {
    lead: "After launch we stay on: watching how the product is used, keeping models honest and adding what the business needs next.",
    description: [
      "A launch is the first real test, not the finish line. We monitor performance, usage and model quality, and keep a regular rhythm of small improvements instead of waiting for the next big rebuild.",
      "Because the same team that built the product looks after it, fixes are quick and new features fit the system they join.",
    ],
    services: [
      { name: "Monitoring & evaluation", body: "Uptime, performance and model quality, watched continuously." },
      { name: "Model updates", body: "Retraining, prompt tuning and provider changes, handled safely." },
      { name: "Performance", body: "Faster pages, lighter bundles and leaner infrastructure." },
      { name: "New features", body: "A steady roadmap of improvements, shipped in small steps." },
    ],
    duration: "Ongoing",
    industries: ["saas", "logistics", "fintech"],
  },
};

export const clusters: Cluster[] = serviceCards.map((s, i) => ({
  slug: slug(s.title),
  n: String(i + 1).padStart(2, "0"),
  title: s.title,
  icon: s.icon,
  hue: s.hue,
  body: s.body,
  deliverables: s.deliverables,
  ...clusterExtra[s.title],
}));

// ---------- Industries ----------
export type Industry = {
  slug: string;
  n: string;
  name: string;
  count: number;
  body: string;
  g: number;
  lead: string;
  description: string[];
  focus: string[];
  challenges: { title: string; body: string }[];
  clusters: string[];
};

const industryExtra: Record<string, Omit<Industry, "slug" | "n" | "name" | "count" | "body" | "g">> = {
  Fintech: {
    lead: "Products where every decision has to be fast, explainable and auditable, from onboarding to underwriting.",
    description: [
      "Financial products live under two pressures at once: customers expect instant answers, and regulators expect every answer to be traceable. We design for both from the first sketch.",
      "Our fintech work spans lending, payments and risk tooling, often with AI models that assist decisions rather than make them alone.",
    ],
    focus: ["Digital onboarding & KYC", "Underwriting & risk tools", "Payments & wallets", "Back-office automation"],
    challenges: [
      { title: "Explainable decisions", body: "Model outputs that a credit officer and an auditor can both follow." },
      { title: "Compliance by design", body: "Consent, retention and audit trails built into the flows, not added later." },
      { title: "Speed without risk", body: "Minutes instead of days, with humans in the loop where it matters." },
    ],
    clusters: ["discovery", "implementation", "maintenance"],
  },
  Healthtech: {
    lead: "Patient-facing apps and clinical tools that are calm to use and treat privacy as a feature.",
    description: [
      "In health, a confusing screen is not just a bad experience. We work with clinicians and patients to keep flows simple, language plain and data protected.",
      "From appointment booking to remote monitoring, we build products that fit into real clinical routines instead of adding to them.",
    ],
    focus: ["Patient apps", "Clinical dashboards", "Remote monitoring", "Accessible booking flows"],
    challenges: [
      { title: "Privacy from day one", body: "Data minimisation and consent flows patients actually understand." },
      { title: "Clinical fit", body: "Tools that save a nurse time on a busy shift, not add another login." },
      { title: "Accessibility", body: "Designed and tested for every age, ability and device." },
    ],
    clusters: ["discovery", "planning", "implementation"],
  },
  "Retail & Commerce": {
    lead: "Catalogue, search and merchandising systems that learn from every visit and keep conversion moving.",
    description: [
      "Commerce is a game of small margins and large catalogues. We build headless storefronts, search and recommendation systems that are fast to browse and easy for merchandisers to steer.",
      "AI helps with search relevance, product data and personalisation, always measured against real sales rather than demos.",
    ],
    focus: ["Headless storefronts", "Search & recommendations", "Product data automation", "Merchandising tools"],
    challenges: [
      { title: "Search people trust", body: "Results that match intent, even with typos, synonyms and thin data." },
      { title: "Speed at scale", body: "Fast pages across tens of thousands of products and every market." },
      { title: "Tools for merchandisers", body: "Control over what the algorithm does, without a developer." },
    ],
    clusters: ["planning", "implementation", "maintenance"],
  },
  SaaS: {
    lead: "Product-led growth, onboarding and AI features inside platforms that already have users and history.",
    description: [
      "Most of our SaaS work is not greenfield. We join teams with an existing product and help them add AI features, rethink onboarding or untangle a platform that has outgrown its first architecture.",
      "We measure success in activation, retention and the support tickets that stop arriving.",
    ],
    focus: ["Onboarding & activation", "AI copilots & assistants", "Design systems", "Platform re-architecture"],
    challenges: [
      { title: "Shipping inside a live product", body: "New features without breaking what thousands already rely on." },
      { title: "Activation", body: "Getting new users to the first moment of value, faster." },
      { title: "AI that earns its place", body: "Assistants that do real work, evaluated against real tasks." },
    ],
    clusters: ["planning", "implementation", "maintenance"],
  },
  Logistics: {
    lead: "Planning and operations dashboards that turn messy, real-time data into decisions a dispatcher can make in seconds.",
    description: [
      "Logistics teams work with live data from vehicles, warehouses and partners, and very little time. We design dense, calm interfaces that surface the exception instead of the noise.",
      "Forecasting and route models sit behind the screens, tuned with the people who know the operation best.",
    ],
    focus: ["Operations dashboards", "Route & capacity planning", "Partner portals", "Forecasting"],
    challenges: [
      { title: "Signal over noise", body: "Only the exceptions that need a human, when they need one." },
      { title: "Real-time data", body: "Live feeds from many systems, reconciled and reliable." },
      { title: "Field-ready", body: "Interfaces that work on a tablet in a loading bay." },
    ],
    clusters: ["discovery", "planning", "maintenance"],
  },
  "Public sector": {
    lead: "Accessible digital services designed for everyone who needs them, not only the people who find technology easy.",
    description: [
      "Public services cannot choose their users. We design for the widest possible audience, with plain language, strong accessibility and processes that still work when someone needs help.",
      "We work closely with policy, legal and frontline teams so that the service is not only usable but also deliverable.",
    ],
    focus: ["Citizen services", "Accessibility audits", "Case management", "Service design"],
    challenges: [
      { title: "Everyone is a user", body: "WCAG AA as a floor, tested with people who use assistive technology." },
      { title: "Plain language", body: "Forms and guidance written so they are understood the first time." },
      { title: "Legacy systems", body: "Modern front doors on top of systems that cannot be switched off." },
    ],
    clusters: ["discovery", "planning", "implementation"],
  },
};

const sectorToIndustry: Record<string, string> = {
  Fintech: "Fintech",
  Healthtech: "Healthtech",
  Retail: "Retail & Commerce",
  SaaS: "SaaS",
  "B2B data": "SaaS",
  Logistics: "Logistics",
  Operations: "Logistics",
  Energy: "Public sector",
  Research: "Healthtech",
  Insurance: "Fintech",
  Enterprise: "SaaS",
  Telecom: "Retail & Commerce",
};

export const industries: Industry[] = industryCards.map((ind, i) => ({
  slug: slug(ind.name),
  n: String(i + 1).padStart(2, "0"),
  name: ind.name,
  count: ind.count,
  body: ind.body,
  g: [2, 0, 4, 3, 5, 1][i % 6],
  ...industryExtra[ind.name],
}));

// ---------- Case studies ----------
export type CaseStudy = {
  slug: string;
  client: string;
  title: string;
  platform: string;
  sector: string;
  industry: string;
  services: string[];
  status: "active" | "done";
  year: string;
  g: number;
  summary: string;
  challenge: string;
  approach: string[];
  outcome: string;
  impact: { value: number; suffix: string; label: string }[];
  quote?: { text: string; name: string; role: string };
};

const caseExtra: Record<string, Partial<CaseStudy>> = {
  Halcyon: {
    title: "A lending platform that decides in minutes",
    summary: "An AI-assisted underwriting platform that took Halcyon's small-business loan decisions from five days to under ten minutes.",
    challenge: "Halcyon's underwriters were buried in PDFs: bank statements, tax returns and invoices, read by hand for every application. Good applicants waited a week and often went elsewhere.",
    approach: [
      "We started with two weeks of shadowing the underwriting team, mapping every document they read and every judgement they made.",
      "The platform extracts and checks the documents automatically, scores the application with an explainable model and hands the underwriter a one-page summary with every figure traced back to its source.",
    ],
    outcome: "Most applications now get a decision the same morning, and the underwriters spend their time on the hard cases instead of on data entry.",
    impact: [
      { value: 10, suffix: " min", label: "Median time to decision" },
      { value: 3, suffix: "×", label: "Applications per underwriter" },
      { value: 98, suffix: "%", label: "Figures traced to source" },
    ],
    quote: { text: "KUIX shipped our AI underwriting tool in 10 weeks, and our team uses it every day.", name: "Anna", role: "Head of Product, Halcyon" },
  },
  Meridian: {
    title: "Search that finally finds the right product",
    summary: "A headless commerce rebuild for Meridian with a new search and recommendation layer across 40,000 products.",
    quote: { text: "The new search is 3.4× faster and our team finally trusts the results.", name: "Máté", role: "CTO, Meridian" },
    impact: [
      { value: 3.4, suffix: "×", label: "Faster search" },
      { value: 18, suffix: "%", label: "More search conversions" },
      { value: 40, suffix: "k", label: "Products indexed" },
    ],
  },
};

const titleFor = (w: (typeof work)[number]) => `${w.platform} for ${w.client}`;

export const caseStudies: CaseStudy[] = work.map((w, i) => {
  const indName = sectorToIndustry[w.sector] ?? "SaaS";
  const ind = industries.find((x) => x.name === indName)!;
  const services = i % 3 === 0 ? ["discovery", "implementation"] : i % 3 === 1 ? ["planning", "implementation", "maintenance"] : ["implementation", "maintenance"];
  const extra = caseExtra[w.client] ?? {};
  return {
    slug: slug(w.client),
    client: w.client,
    platform: w.platform,
    sector: w.sector,
    industry: ind.slug,
    services,
    status: w.status,
    year: w.year,
    g: i % 6,
    title: extra.title ?? titleFor(w),
    summary:
      extra.summary ??
      `A ${w.platform.toLowerCase()} for ${w.client}, designed and built with their team to make everyday work in ${w.sector.toLowerCase()} simpler and faster.`,
    challenge:
      extra.challenge ??
      `${w.client} had outgrown the tools their team relied on. Work was spread across spreadsheets and legacy systems, and every new requirement made things slower.`,
    approach: extra.approach ?? [
      "We began with a short discovery: interviews with the people doing the work, a review of the existing systems and a map of where time was being lost.",
      `From there we designed and built the new ${w.platform.toLowerCase()} in two-week cycles, with a working demo at the end of every one.`,
    ],
    outcome:
      extra.outcome ??
      "The new product launched on schedule, the team adopted it within weeks, and we keep improving it together as their business changes.",
    impact: extra.impact ?? [
      { value: 30 + ((i * 17) % 50), suffix: "%", label: "Less time on routine tasks" },
      { value: 2 + (i % 4), suffix: "×", label: "Faster releases" },
      { value: 90 + (i % 9), suffix: "%", label: "Weekly active use" },
    ],
    quote: extra.quote,
  };
});

export const caseBySlug = (s: string) => caseStudies.find((c) => c.slug === s);
export const clusterBySlug = (s: string) => clusters.find((c) => c.slug === s);
export const industryBySlug = (s: string) => industries.find((c) => c.slug === s);
export const casesForIndustry = (s: string) => caseStudies.filter((c) => c.industry === s);
export const casesForCluster = (s: string) => caseStudies.filter((c) => c.services.includes(s));

// ---------- Industries overview ----------
export const industryImpact = [
  { value: industries.length, suffix: "", label: "Sectors", note: "And counting" },
  { value: industries.reduce((a, b) => a + b.count, 0), suffix: "", label: "Projects across them", note: "Since 2017" },
  { value: 94, suffix: "%", label: "Clients who come back", note: "Repeat work" },
];
export const featuredCase = "halcyon";
export const logoStrip = { label: "Clients", title: "Trusted by teams who ship", desc: `${partners.length}+ partners in fintech, health, retail and SaaS.` };

// ---------- Culture ----------
export type Member = {
  slug: string;
  name: string;
  role: string;
  g: number;
  intro: string;
  story: string[];
  spotify: { playlist: string; tracks: { title: string; artist: string }[] };
  cv: { years: string; role: string; place: string }[];
  skills: string[];
};

const m = (name: string, role: string, g: number, intro: string, playlist: string, cv: Member["cv"], skills: string[]): Member => ({
  slug: slug(name),
  name,
  role,
  g,
  intro,
  story: [
    `${name.split(" ")[0]} joined KUIX because the work sits right where design and engineering meet, and nobody here pretends they are separate jobs.`,
    "Outside the studio: long walks with a podcast, too many side projects and strong opinions about coffee.",
  ],
  spotify: {
    playlist,
    tracks: [
      { title: "Teardrop", artist: "Massive Attack" },
      { title: "Midnight City", artist: "M83" },
      { title: "Nightcall", artist: "Kavinsky" },
      { title: "Holocene", artist: "Bon Iver" },
    ],
  },
  cv,
  skills,
});

export const team: Member[] = [
  m("Péter Kovács", "Founder, Product lead", 0, "Turns vague briefs into products people use. Has been building digital products since before they were called that.", "Deep work", [
    { years: "2017–", role: "Founder", place: "KUIX" },
    { years: "2012–2017", role: "Product lead", place: "Prezi" },
    { years: "2009–2012", role: "UX designer", place: "Freelance" },
  ], ["Product strategy", "Workshops", "AI roadmaps"]),
  m("Barnabás Nagy", "Co-founder, Engineering", 2, "Writes the boring code that keeps exciting products running. Happiest with a hard architecture problem.", "Deploy on Friday", [
    { years: "2017–", role: "Co-founder, CTO", place: "KUIX" },
    { years: "2013–2017", role: "Senior engineer", place: "LogMeIn" },
  ], ["Architecture", "TypeScript", "Infrastructure"]),
  m("Réka Szabó", "Design lead", 4, "Makes complex systems feel simple. Believes every interface should be explainable in one sentence.", "Pixels & bass", [
    { years: "2019–", role: "Design lead", place: "KUIX" },
    { years: "2015–2019", role: "Product designer", place: "Ustream" },
  ], ["Interface design", "Design systems", "Prototyping"]),
  m("Dániel Tóth", "AI engineer", 3, "Connects models to products and makes sure they behave. Runs evaluations before anyone asks.", "Gradient descent", [
    { years: "2021–", role: "AI engineer", place: "KUIX" },
    { years: "2018–2021", role: "ML researcher", place: "BME" },
  ], ["LLM integration", "Evaluation", "Python"]),
  m("Eszter Varga", "UX researcher", 5, "Asks the questions nobody else thought of. Has interviewed more users than anyone in the studio.", "Field notes", [
    { years: "2020–", role: "UX researcher", place: "KUIX" },
    { years: "2016–2020", role: "Researcher", place: "Telekom" },
  ], ["User research", "Service design", "Workshops"]),
  m("Gergő Horváth", "Frontend developer", 1, "Obsessed with the last 10% of polish: motion, performance and the details nobody notices until they are missing.", "Sixty frames", [
    { years: "2020–", role: "Frontend developer", place: "KUIX" },
    { years: "2017–2020", role: "Developer", place: "Agency" },
  ], ["React", "WebGL", "Motion"]),
  m("Lilla Molnár", "Project manager", 0, "Keeps the plan honest and the team calm. Knows where every project stands, at any hour.", "Calm under pressure", [
    { years: "2021–", role: "Project manager", place: "KUIX" },
    { years: "2017–2021", role: "Delivery manager", place: "EPAM" },
  ], ["Delivery", "Agile", "Client relations"]),
  m("Máté Farkas", "Backend developer", 2, "Builds the APIs and data pipelines behind the screens. Will happily talk about database indexes.", "Low latency", [
    { years: "2022–", role: "Backend developer", place: "KUIX" },
    { years: "2018–2022", role: "Developer", place: "Wise" },
  ], ["Node.js", "Postgres", "Integrations"]),
];

export const story = {
  label: "Our story",
  title: "From two people and a whiteboard",
  desc: "KUIX started in 2017 in a small Budapest flat. The whiteboard is still with us.",
  milestones: [
    { year: "2017", title: "Two founders, one client", body: "Péter and Barna start KUIX to build products end to end, without hand-offs." },
    { year: "2019", title: "A design team", body: "Research and design join engineering in the same room, on the same work." },
    { year: "2021", title: "AI goes in", body: "Our first production model integration, and an evaluation practice that came with it." },
    { year: "2024", title: "Erzsébet tér", body: "A studio in the centre of Budapest, big enough for workshops and Friday demos." },
    { year: "2026", title: "60+ products", body: "Still one senior team, still building with the people who will use the work." },
  ],
};

export const office = {
  label: "Office life",
  title: "Life at the studio",
  desc: "Friday demos, whiteboard sessions and the occasional late deploy with pizza.",
};

export const teamHead = {
  label: "The team",
  title: "Meet the people",
  desc: "Designers, developers, researchers and AI engineers. Click anyone to hear their story, and what they listen to.",
};

// ---------- Contact ----------
export const contactPage = {
  modes: [
    { key: "meeting", label: "Book a meeting", body: "A 30-minute call to talk through your idea. No preparation needed." },
    { key: "project", label: "Start a project", body: "Tell us about the project and we reply within two working days." },
  ] as { key: "meeting" | "project"; label: string; body: string }[],
  roles: ["Founder / CEO", "Product lead", "CTO / Engineering", "Marketing", "Operations", "Other"],
  budgets: ["Up to 5k EUR", "5–15k EUR", "15–50k EUR", "50–150k EUR", "150k EUR +", "Not sure yet"],
  problems: ["New product", "AI feature or pilot", "Rethink an existing platform", "Design system", "Ongoing support", "Something else"],
  slots: ["Morning (9–12)", "Afternoon (13–17)", "Any time"],
  email: "kuix@kuix.hu",
  phone: "+36 (1) 000 0000",
};

// ---------- Legal ----------
export type LegalDoc = { slug: string; title: string; updated: string; lead: string; sections: { title: string; body: string[] }[] };

const lorem =
  "This is placeholder text for the legal page. The final wording will be provided by KUIX's legal advisor before the site goes live, and will replace this copy without any change to the layout.";

export const legal: Record<"terms" | "privacy" | "cookies", LegalDoc> = {
  terms: {
    slug: "terms",
    title: "Terms & conditions",
    updated: "24 November 2026",
    lead: "The terms that apply when you use this website and when you work with KUIX.",
    sections: [
      { title: "Who we are", body: ["KUIX Kft., 1051 Budapest, Erzsébet tér 2. Email: kuix@kuix.hu.", lorem] },
      { title: "Using this website", body: [lorem, lorem] },
      { title: "Intellectual property", body: [lorem] },
      { title: "Liability", body: [lorem] },
      { title: "Changes to these terms", body: [lorem] },
    ],
  },
  privacy: {
    slug: "privacy",
    title: "Privacy policy",
    updated: "24 November 2026",
    lead: "What personal data we collect, why we collect it, and the rights you have over it.",
    sections: [
      { title: "Data controller", body: ["KUIX Kft., 1051 Budapest, Erzsébet tér 2. Email: kuix@kuix.hu.", lorem] },
      { title: "What we collect", body: [lorem, lorem] },
      { title: "How we use it", body: [lorem] },
      { title: "How long we keep it", body: [lorem] },
      { title: "Your rights", body: [lorem, lorem] },
    ],
  },
  cookies: {
    slug: "cookies",
    title: "Cookie policy",
    updated: "24 November 2026",
    lead: "Which cookies this website uses and how you can control them.",
    sections: [
      { title: "What cookies are", body: [lorem] },
      { title: "Cookies we use", body: [lorem, lorem] },
      { title: "Managing cookies", body: [lorem] },
    ],
  },
};
