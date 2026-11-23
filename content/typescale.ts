// The type scale in px, measured from the built site in a browser at 1440×900
// (desktop) and 390×844 (mobile). Between the two, sizes scale in a straight
// line (see app/tokens.css). Shown on /type as a design canvas.
// Regenerate after changing type tokens.

export type TypeSpec = { size: number; lh: number; ls: number };
export type TypeRow = { name: string; sample: string; font: "Saans" | "Saans Mono"; weight: number; upper: boolean; d: TypeSpec; m: TypeSpec; note?: string };

export const typeScale: TypeRow[] = [
  {
    "name": "Hero title",
    "sample": "Digital products,",
    "font": "Saans",
    "weight": 400,
    "upper": true,
    "d": {
      "size": 109.4,
      "lh": 100.7,
      "ls": -3.83
    },
    "m": {
      "size": 40,
      "lh": 36.8,
      "ls": -1.4
    },
    "note": "Also capped by screen height: 26svh − 70px (values at 1440×900)."
  },
  {
    "name": "Display / H1 (pre-footer)",
    "sample": "Let’s build",
    "font": "Saans",
    "weight": 400,
    "upper": true,
    "d": {
      "size": 138.2,
      "lh": 127.2,
      "ls": -4.84
    },
    "m": {
      "size": 52,
      "lh": 47.8,
      "ls": -1.82
    },
    "note": "Also capped by screen height: 27svh − 96px (values at 1440×900)."
  },
  {
    "name": "H2 · section title",
    "sample": "Our method",
    "font": "Saans",
    "weight": 400,
    "upper": true,
    "d": {
      "size": 96,
      "lh": 88.3,
      "ls": -2.88
    },
    "m": {
      "size": 40,
      "lh": 36.8,
      "ls": -1.2
    },
    "note": undefined
  },
  {
    "name": "Approach statement",
    "sample": "Digital product development",
    "font": "Saans",
    "weight": 400,
    "upper": false,
    "d": {
      "size": 67.7,
      "lh": 59.6,
      "ls": -1.62
    },
    "m": {
      "size": 32.8,
      "lh": 31.4,
      "ls": -0.79
    },
    "note": "4.7vw, capped at 11.5svh."
  },
  {
    "name": "Service card title",
    "sample": "Discovery",
    "font": "Saans",
    "weight": 500,
    "upper": true,
    "d": {
      "size": 58.5,
      "lh": 55.6,
      "ls": -1.58
    },
    "m": {
      "size": 28,
      "lh": 26.6,
      "ls": -0.76
    },
    "note": "Follows the card width."
  },
  {
    "name": "H3 · industry name",
    "sample": "Fintech",
    "font": "Saans",
    "weight": 500,
    "upper": true,
    "d": {
      "size": 41.8,
      "lh": 39.3,
      "ls": -1
    },
    "m": {
      "size": 26,
      "lh": 24.4,
      "ls": -0.62
    },
    "note": undefined
  },
  {
    "name": "H4 · method step",
    "sample": "User journeys",
    "font": "Saans",
    "weight": 500,
    "upper": true,
    "d": {
      "size": 24,
      "lh": 25.9,
      "ls": -0.48
    },
    "m": {
      "size": 20,
      "lh": 21.6,
      "ls": -0.4
    },
    "note": undefined
  },
  {
    "name": "Stat value",
    "sample": "60+",
    "font": "Saans",
    "weight": 400,
    "upper": false,
    "d": {
      "size": 96,
      "lh": 88.3,
      "ls": -2.88
    },
    "m": {
      "size": 40,
      "lh": 36.8,
      "ls": -1.2
    },
    "note": undefined
  },
  {
    "name": "Hero lead",
    "sample": "We design and develop AI-first platforms and systems.",
    "font": "Saans Mono",
    "weight": 300,
    "upper": false,
    "d": {
      "size": 20,
      "lh": 28,
      "ls": 0
    },
    "m": {
      "size": 16,
      "lh": 22.4,
      "ls": 0
    },
    "note": undefined
  },
  {
    "name": "Section description",
    "sample": "Every idea moves from the unknown to the known.",
    "font": "Saans Mono",
    "weight": 300,
    "upper": false,
    "d": {
      "size": 16,
      "lh": 24,
      "ls": 0
    },
    "m": {
      "size": 14,
      "lh": 21,
      "ls": 0
    },
    "note": undefined
  },
  {
    "name": "Body",
    "sample": "Who it is for, what they need and what gets in their way.",
    "font": "Saans Mono",
    "weight": 300,
    "upper": false,
    "d": {
      "size": 15,
      "lh": 22.5,
      "ls": 0
    },
    "m": {
      "size": 14,
      "lh": 21,
      "ls": 0
    },
    "note": undefined
  },
  {
    "name": "Label / index",
    "sample": "(02) What we do",
    "font": "Saans Mono",
    "weight": 300,
    "upper": true,
    "d": {
      "size": 15,
      "lh": 17.3,
      "ls": 0.6
    },
    "m": {
      "size": 13,
      "lh": 14.9,
      "ls": 0.52
    },
    "note": undefined
  },
  {
    "name": "Navigation",
    "sample": "Case Studies",
    "font": "Saans Mono",
    "weight": 400,
    "upper": false,
    "d": {
      "size": 14,
      "lh": 21,
      "ls": 0
    },
    "m": {
      "size": 14,
      "lh": 21,
      "ls": 0
    },
    "note": undefined
  },
  {
    "name": "Button",
    "sample": "Contact us",
    "font": "Saans Mono",
    "weight": 400,
    "upper": true,
    "d": {
      "size": 14,
      "lh": 15.4,
      "ls": 0.56
    },
    "m": {
      "size": 14,
      "lh": 15.4,
      "ls": 0.56
    },
    "note": undefined
  },
  {
    "name": "Work table cell",
    "sample": "Headless commerce",
    "font": "Saans Mono",
    "weight": 300,
    "upper": false,
    "d": {
      "size": 15.8,
      "lh": 19.8,
      "ls": 0
    },
    "m": {
      "size": 14,
      "lh": 17.5,
      "ls": 0
    },
    "note": undefined
  },
  {
    "name": "Tag",
    "sample": "Active project",
    "font": "Saans Mono",
    "weight": 300,
    "upper": true,
    "d": {
      "size": 12,
      "lh": 12,
      "ls": 0.24
    },
    "m": {
      "size": 12,
      "lh": 12,
      "ls": 0.24
    },
    "note": undefined
  },
  {
    "name": "Footer link",
    "sample": "Case Studies",
    "font": "Saans Mono",
    "weight": 400,
    "upper": false,
    "d": {
      "size": 15,
      "lh": 22.5,
      "ls": 0
    },
    "m": {
      "size": 15,
      "lh": 22.5,
      "ls": 0
    },
    "note": undefined
  },
  {
    "name": "Footer legal",
    "sample": "© 2026 KUIX. All rights reserved.",
    "font": "Saans Mono",
    "weight": 300,
    "upper": false,
    "d": {
      "size": 14.4,
      "lh": 21.6,
      "ls": 0
    },
    "m": {
      "size": 13,
      "lh": 19.5,
      "ls": 0
    },
    "note": undefined
  },
  {
    "name": "Footer name",
    "sample": "KUIX",
    "font": "Saans",
    "weight": 500,
    "upper": true,
    "d": {
      "size": 530.4,
      "lh": 392.5,
      "ls": 0
    },
    "m": {
      "size": 162.7,
      "lh": 120.4,
      "ls": 0
    },
    "note": "Fills the footer: depends on screen width and height (values at 1440×900)."
  }
];
