// The feed homepage (/feed): the KUIX story told as posts by the three
// founders. Text reused from the main site comes from copy.ts; everything
// written here is draft copy for the concept. Lines marked DRAFT hold invented
// facts that need the real ones.
import { chats, impact, industries, method, partners, services, strip, values, work } from "./copy";

export type Who = "barnabas" | "peter" | "lejla";
export type Author = Who | "kuix";

export const people: Record<Who, { name: string; role: string; bio: string; img: string }> = {
  barnabas: {
    name: "Barnabás",
    role: "Strategy and method",
    bio: "Asks “why” until it gets awkward. Turns vague ideas into plans people can build.",
    img: "/feed/barnabas.jpg",
  },
  peter: {
    name: "Péter",
    role: "Technology",
    bio: "Builds it, breaks it on purpose, then ships it.",
    img: "/feed/peter.jpg",
  },
  lejla: {
    name: "Lejla",
    role: "Operations and partnerships",
    bio: "Keeps projects, people and promises on schedule. Usually your first call.",
    img: "/feed/lejla.jpg",
  },
};

export const order: Who[] = ["barnabas", "peter", "lejla"];

export type Comment = { who: Who; text: string };

// In post text, [brackets] mark the lead: it is set in full ink and a heavier
// weight, the rest of the paragraph is lighter.
export type PostBlock =
  | "profile"
  | "method"
  | "itinerary"
  | "buildlog"
  | "metrics"
  | "board"
  | "sectors"
  | "photos"
  | "chat"
  | "numbers"
  | "reply";

export type PostData = {
  id: string;
  by: Author;
  tag: string;
  text: string[];
  block?: PostBlock;
  // Which conversation a "chat" block shows.
  chat?: number;
  likes: number;
  comments?: Comment[];
};

export const posts: PostData[] = [
  {
    id: "pinned",
    by: "kuix",
    tag: "Pinned",
    text: [
      "[We are a design and development agency creating digital platforms and systems.]",
      "Three people post here. Between them they cover everything we do.",
    ],
    block: "profile",
    likes: 60,
  },
  {
    id: "why",
    by: "barnabas",
    tag: "Opinion",
    text: [
      "[Digital product development is complex, even with AI.] AI made writing code cheaper. It did not make deciding what to build any cheaper.",
      "Most projects that fail were built well. They were the wrong thing, or the right thing for nobody in particular. We help businesses turn their requirements into working digital solutions, combining design, technology and practical thinking.",
    ],
    likes: 24,
    comments: [
      { who: "peter", text: "Especially with AI. Broken prototypes now reach us faster than ever." },
      { who: "lejla", text: "Third call this month that started with “we already have a prototype”." },
    ],
  },
  {
    id: "method",
    by: "barnabas",
    tag: "Method",
    text: ["[Every idea moves from the unknown to the known.] This is the path, and I’ll argue for every step of it."],
    block: "method",
    likes: 31,
    comments: [{ who: "peter", text: "I do sign off on it. Twice, if there’s a deadline in it." }],
  },
  {
    id: "offer",
    by: "lejla",
    tag: "Working with us",
    text: [
      "[Here is what you get, and when.] One team from start to finish, so nothing is lost between stages. I’m your contact in all four.",
    ],
    block: "itinerary",
    likes: 18,
    comments: [{ who: "barnabas", text: "You can stop after Planning and take the plan elsewhere. Almost nobody does." }],
  },
  {
    id: "build",
    by: "peter",
    tag: "How we build",
    text: ["[How we build, without the adjectives.] One-week cycles, and a demo every Friday on a real URL."],
    block: "buildlog",
    likes: 27,
    comments: [{ who: "lejla", text: "“Demo every Friday” is in the contract. He isn’t joking." }],
  },
  {
    id: "ai",
    by: "peter",
    tag: "AI",
    text: [
      "[Does the AI part work? Only if you measure it.] Start with the dullest thing that works. Often that is better search, not a chatbot.",
      "Every AI feature gets an evaluation set before it gets an interface. A person can always see why the system decided something, and overrule it.",
    ],
    block: "metrics",
    likes: 42,
    comments: [{ who: "barnabas", text: "We have talked clients out of AI features. They are still clients." }],
  },
  {
    id: "work",
    by: "lejla",
    tag: "Project board",
    // DRAFT: the average length.
    text: [
      "[What’s on the board right now.] Three active, nine delivered. The average project runs four months. The longest relationship is Northwind, since 2024.",
    ],
    block: "board",
    likes: 36,
    comments: [{ who: "peter", text: "Oakline’s dashboard is still my favourite deploy." }],
  },
  {
    id: "sectors",
    by: "barnabas",
    tag: "Industries",
    text: [
      "[Your sector is special. It is also less special than you think.] Onboarding in a bank and onboarding in a clinic fail for the same reasons.",
      "We bring what we learn in one sector to the next, and respect the rules that make each one different.",
    ],
    block: "sectors",
    likes: 22,
    comments: [{ who: "lejla", text: "Public sector taught us patience. Fintech taught us audit trails." }],
  },
  {
    id: "culture",
    by: "lejla",
    tag: "Culture",
    text: [
      "[A small senior team of designers, developers and AI engineers who like hard problems and plain answers.] Evidence attached.",
    ],
    block: "photos",
    likes: 57,
    comments: [
      { who: "peter", text: "The deploy was on time. The pizza was late." },
      { who: "barnabas", text: "Whiteboard war room. I won." },
    ],
  },
  {
    id: "anna",
    by: "peter",
    tag: "Clients",
    text: ["[Asked Anna for a testimonial.] Posting the whole thread, for transparency."],
    block: "chat",
    chat: 0,
    likes: 48,
  },
  {
    id: "mate",
    by: "barnabas",
    tag: "Clients",
    text: ["[Same, with Máté.]"],
    block: "chat",
    chat: 1,
    likes: 39,
  },
  {
    id: "numbers",
    by: "lejla",
    tag: "Clients",
    text: ["[What they were trying to say.]"],
    block: "numbers",
    likes: 44,
  },
  {
    id: "contact",
    by: "lejla",
    tag: "What happens next",
    // DRAFT: the reply time and who joins the first call.
    text: [
      "[Whether you’re building something new or improving what you already have, write to me.] A new product, a stalled AI pilot or a platform that needs rethinking: start with a short brief.",
      "I reply within one working day, and the first call is with all three of us.",
    ],
    block: "reply",
    likes: 12,
  },
];

// Barnabás's note on each step of the method (the steps are in copy.ts).
export const methodNotes = [
  "If the answer is “everyone”, we’re not done.",
  "This is where half the feature list quietly disappears.",
  "The most valuable thing we deliver is often a shorter list.",
  "Péter signs off on it before the client does.",
];

// DRAFT: lengths, and who leads each phase.
export const phases: { length: string; lead: Who[]; get: string }[] = [
  { length: "2 weeks", lead: ["barnabas"], get: "The real problem, an AI opportunity map and a feasibility note." },
  { length: "2–3 weeks", lead: ["barnabas"], get: "Personas, journeys, scope and a roadmap with estimates." },
  { length: "8–16 weeks", lead: ["peter"], get: "A working product, shown to you every Friday." },
  { length: "Monthly", lead: ["lejla", "peter"], get: "Monitoring, updates and new features as your business changes." },
];
// DRAFT
export const smallPrint = "Teams of 3 to 6. Kickoff within two weeks of signing. Fixed price for Discovery and Planning, monthly after that.";

export const buildRules = [
  "No long-lived branches.",
  "Tests on anything that touches money or personal data.",
  "You own the repository from day one.",
];
// DRAFT
export const stack = ["TypeScript", "React", "Next.js", "React Native", "Node", "Python", "Postgres", "Your cloud"];
// DRAFT: a sample of what the log could show.
export const buildLog: [string, string, string][] = [
  ["Fri 15:02", "Deploy 214 to staging", "Demo ready"],
  ["Fri 11:40", "Evaluation set, 412 queries", "Passed"],
  ["Thu 17:26", "Search index rebuilt", "Merged"],
  ["Thu 10:03", "Onboarding flow, step 3", "In review"],
  ["Wed 16:48", "Deploy 213 to staging", "Live"],
  ["Wed 09:15", "Payment tests, 96 cases", "Passed"],
  ["Tue 14:31", "Design tokens synced", "Merged"],
];

// Both figures come from the testimonials on the main site.
export const metrics = [
  { client: "Meridian", what: "Search response time", value: 3.4, decimals: 1, suffix: "×", note: "faster after the rebuild", before: 34, after: 10 },
  { client: "Halcyon", what: "AI underwriting tool", value: 10, decimals: 0, suffix: " weeks", note: "from kickoff to daily use", before: 0, after: 10 },
];

export const reply = {
  label: "Reply to Lejla",
  placeholder: "What are you building?",
  // Shown as Lejla's answer after sending. The form is not connected to anything.
  answer: (name: string) =>
    `Thanks${name ? `, ${name}` : ""}. This preview isn’t connected to my inbox yet, so please send the same to kuix@kuix.hu and I’ll pick it up there.`,
  email: "kuix@kuix.hu",
};

export const end = "You’re all caught up.";

export { chats, impact, industries, method, partners, services, strip, values, work };
