// Placeholder copy, structured so it can later come from the headless CMS
// without touching components.

export const tagline = "Design and development agency";

// Copy follows the storyframe. Section descriptions are kept to one or two
// short sentences (about 20 words) so they can be set large.
export const hero = {
  // The statement, one entry per line on tablets and desktops. Phones wrap it
  // freely. Words in [brackets] are the key phrase: they are set in full
  // black, the rest of the sentence is lighter.
  // A | marks where the title breaks on phones instead, where it is set in
  // five shorter lines.
  lines: ["We are a [design]| [and]", "[development]| [agency]", "creating| [digital]", "[platforms]| and [systems.]"],
};

export const partners = ["Northwind", "Halcyon", "Meridian", "Arcadia", "Lumen", "Vertex", "Oakline", "Parallel"];

// Each section: a short index label, the title, and a description.
export const sections = {
  approach: { label: "What we do", title: "Our approach" },
  method: {
    label: "How we work",
    title: "Our method",
    desc: "Every idea moves from the unknown to the known. We make that path clear with personas, user journeys, and a feature plan.",
  },
  services: {
    label: "What we offer",
    title: "Our services",
    desc: "The best solutions come from working together. We ask questions, challenge assumptions, and stay flexible along the way.",
  },
  work: {
    label: "Case studies",
    title: "Selected work",
    desc: "We care about both how things look and how they work. Digital experiences built around real needs.",
  },
  industries: {
    label: "Where we work",
    title: "Industries",
    desc: "From intuitive interfaces to complex systems, we bring what we learn in one sector to the next.",
  },
  culture: {
    label: "Who we are",
    title: "Culture",
    desc: "Behind every project is a curious team of designers, developers, and problem-solvers who enjoy turning complexity into something simple.",
  },
  impact: {
    label: "What clients say",
    title: "Our impact",
    desc: "Whether you\u2019re building something new or improving what you already have, we\u2019re here to help you make it work.",
  },
  contact: { label: "Get in touch", title: "Let\u2019s build something great together." },
};

// layout: what fills the rest of the footer's screen. "a" the name as wide as
// the screen, "b" the line about us set large, "c" the sitemap as large links,
// "d" the studio's local time.
export const footer = {
  layout: "a" as "a" | "b" | "c" | "d",
  email: "kuix@kuix.hu",
  tagline: "Whether you\u2019re building something new or improving what you already have, we\u2019re here to help you make it work.",
};

export const approach = {
  // The statement, one entry per line on screens from tablet size up (phones
  // wrap freely). Words in [brackets] are the key phrases, set in full white;
  // the rest is dimmed, as in the hero. {0} {1} {2} are the small images inside
  // the sentence.
  lines: [
    "Digital [product development] is complex,",
    "{0} even with AI. We help businesses turn",
    "their requirements {1} into working digital",
    "solutions, combining [design,] {2} [technology,]",
    "[and practical thinking.]",
  ],
};

export const method = {
  steps: [
    { key: "personas", title: "Personas", body: "Who it is for, what they need and what gets in their way." },
    { key: "journeys", title: "User journeys", body: "Every path a person takes, from first touch to daily use." },
    { key: "scoping", title: "Scoping", body: "What goes into the first release, and what can wait." },
    { key: "plan", title: "Clear plan", body: "A buildable roadmap the whole team can agree on." },
  ],
};

export const services = [
  {
    title: "Discovery",
    icon: "discovery",
    body: "We ask questions and challenge assumptions until the real problem is clear.",
    deliverables: ["Stakeholder workshops", "User research", "AI opportunity map", "Technical feasibility"],
    hue: 150,
  },
  {
    title: "Planning",
    icon: "planning",
    body: "Personas, journeys and scope come together into one clear, buildable plan.",
    deliverables: ["Personas & journeys", "Feature scope", "Architecture", "Roadmap & estimates"],
    hue: 200,
  },
  {
    title: "Implementation",
    icon: "implementation",
    body: "We design, develop and test side by side, in short cycles.",
    deliverables: ["Product & interface design", "Frontend & backend", "Model integration", "QA & launch"],
    hue: 260,
  },
  {
    title: "Maintenance",
    icon: "maintenance",
    body: "After launch we keep improving the product as your business changes.",
    deliverables: ["Monitoring & evaluation", "Model updates", "Performance", "New features"],
    hue: 30,
  },
];

// status: "active" for a project we are working on now, "done" for a finished
// one. year can be a single year or a range.
export const work: { client: string; platform: string; sector: string; status: "active" | "done"; year: string }[] = [
  { client: "Halcyon", platform: "Web platform", sector: "Fintech", status: "active", year: "2025\u20132026" },
  { client: "Arcadia Health", platform: "Patient app", sector: "Healthtech", status: "active", year: "2026" },
  { client: "Meridian", platform: "Headless commerce", sector: "Retail", status: "done", year: "2025" },
  { client: "Vertex Labs", platform: "Internal tool", sector: "SaaS", status: "done", year: "2024\u20132025" },
  { client: "Oakline", platform: "Dashboard", sector: "Logistics", status: "done", year: "2025" },
  { client: "Parallel", platform: "SaaS onboarding", sector: "B2B data", status: "done", year: "2024" },
  { client: "Northwind", platform: "Agent workflows", sector: "Operations", status: "active", year: "2024\u20132026" },
  { client: "Lumen", platform: "Marketing site", sector: "Energy", status: "done", year: "2024" },
  { client: "Fieldnote", platform: "Mobile app", sector: "Research", status: "done", year: "2023" },
  { client: "Kestrel", platform: "Web platform", sector: "Insurance", status: "done", year: "2022\u20132023" },
  { client: "Atlas Group", platform: "Design system", sector: "Enterprise", status: "done", year: "2022" },
  { client: "Orbit", platform: "Customer portal", sector: "Telecom", status: "done", year: "2022" },
];
export const workStatus = { active: "Active project", done: "Delivered" };

export const impact = [
  { value: 60, suffix: "+", label: "Products shipped", note: "Since 2017" },
  { value: 9, suffix: " yrs", label: "Designing and building", note: "Same core team" },
  { value: 94, suffix: "%", label: "Clients who come back", note: "Repeat work" },
];

export const strip = [
  "Friday demo day",
  "Whiteboard war room",
  "Offsite at Lake Balaton",
  "Pizza and a late deploy",
  "Retro, with snacks",
  "Team ride",
  "Pairing session",
  "Launch night",
];

// Testimonials, told as the outreach that usually happens behind them.
export type ChatMessage = { from: "us" | "them"; text: string; time?: string };
export type Conversation = { us: string; them: string; themRole: string; hue: number; messages: ChatMessage[] };

export const chats: Conversation[] = [
  {
    us: "Peti",
    them: "Anna",
    themRole: "Head of Product, Halcyon",
    hue: 150,
    messages: [
      { from: "us", text: "Hi Anna! Quick favour 🙏", time: "Today 09:41" },
      { from: "us", text: "We're launching our new website and need a nice testimonial" },
      { from: "them", text: "Sure! What should it say?" },
      { from: "us", text: "Whatever you honestly feel" },
      { from: "us", text: "But maybe mention we're fast. And fun. And that the AI thing actually works" },
      { from: "them", text: "“KUIX shipped our AI underwriting tool in 10 weeks, and our team uses it every day.”" },
      { from: "us", text: "Perfect. Can we add “life-changing”?" },
      { from: "them", text: "No." },
      { from: "us", text: "Fair 😅" },
    ],
  },
  {
    us: "Barna",
    them: "Máté",
    themRole: "CTO, Meridian",
    hue: 30,
    messages: [
      { from: "us", text: "Hey Máté, hope launch week was fun 🚀", time: "Yesterday 17:12" },
      { from: "us", text: "Heard Anna wrote us a testimonial. Would you be up for one too?" },
      { from: "them", text: "Happy to. Can I mention the search is way faster now?" },
      { from: "us", text: "Please do" },
      { from: "them", text: "“The new search is 3.4× faster and our team finally trusts the results.”" },
      { from: "us", text: "Beautiful. Can we round it up to 4×?" },
      { from: "them", text: "Barna." },
      { from: "us", text: "3.4× it is 🫡" },
    ],
  },
];

export const industries = [
  { name: "Fintech", count: 12, body: "Underwriting, onboarding and risk tools where accuracy and auditability matter." },
  { name: "Healthtech", count: 8, body: "Patient-facing flows and clinical tooling built with privacy from day one." },
  { name: "Retail & Commerce", count: 14, body: "Catalogue, search and merchandising systems that learn from every visit." },
  { name: "SaaS", count: 17, body: "Product-led growth, onboarding and AI features inside existing platforms." },
  { name: "Logistics", count: 6, body: "Planning and operations dashboards that turn data into decisions." },
  { name: "Public sector", count: 4, body: "Accessible digital services designed for everyone who needs them." },
];

export const values = [
  { title: "Curious first", body: "We ask questions until the problem is clear, then we ask a few more." },
  { title: "Make it simple", body: "Complexity is our job. Simplicity is what we hand over." },
  { title: "Build together", body: "Designers, developers and clients in the same room, on the same work." },
  { title: "Stay flexible", body: "Plans change when we learn something. That is the point of learning." },
];
