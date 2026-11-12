"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { approach, sections } from "@/content/copy";
import { prefersReducedMotion, ready } from "@/lib/motion";
import { Grad, Idx } from "./parts";

// Two images sit inside the sentence, like a rebus. Each one is placed just
// before the word listed here.
const SLOTS: Record<string, number> = { "businesses": 0, "design,": 3 };

// The approach statement, under its index label. There is no large title here:
// the statement is the headline.
// - The words start dim and light up one by one as the paragraph scrolls
//   through the screen, so it reads like it is being written.
// - The two images open once, when the paragraph comes into view: the words
//   part and the image grows into the gap. After that they stay where they are.
export function Approach({ index }: { index: string }) {
  const text = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = text.current;
    if (!el) return;
    const words = [...el.querySelectorAll<HTMLElement>(".ap-word")];
    if (prefersReducedMotion()) {
      words.forEach((w) => (w.style.opacity = "1"));
      setOpen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        ready.then(() => setOpen(true));
      },
      { threshold: 0.35 },
    );
    io.observe(el);

    let raf = 0;
    const loop = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom > -vh * 0.2 && r.top < vh * 1.2) {
        // 0 when the top of the paragraph reaches 88% of the screen,
        // 1 when its bottom reaches 62%.
        const start = vh * 0.88;
        const end = vh * 0.62;
        const p = Math.min(1, Math.max(0, (start - r.top) / Math.max(1, start - end + r.height)));
        const n = words.length;
        words.forEach((w, i) => {
          const t = Math.min(1, Math.max(0, p * (n + 4) - i) / 4);
          w.style.opacity = String(0.16 + t * 0.84);
        });
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const tokens = approach.lead.split(" ");
  // Mark the words that belong to a key phrase.
  const key = tokens.map(() => false);
  for (const phrase of approach.keys) {
    const words = phrase.split(" ");
    for (let i = 0; i + words.length <= tokens.length; i++) {
      if (words.every((w, j) => tokens[i + j] === w)) words.forEach((_, j) => (key[i + j] = true));
    }
  }
  let k = 0;
  return (
    <div className="approach container">
      <h2 className="sr-only">{sections.approach.title}</h2>
      <Idx index={index} label={sections.approach.label} className="approach-idx" />
      <p ref={text} className="approach-text" aria-label={approach.lead}>
        {tokens.map((word, i) => {
          const g = SLOTS[word];
          const order = g !== undefined ? k++ : 0;
          return (
            <Fragment key={i}>
              {i > 0 && " "}
              {g !== undefined && (
                <span className="ap-slot" data-open={open || undefined} style={{ transitionDelay: `${0.15 + order * 0.35}s` }} aria-hidden>
                  <Grad g={g} className="ap-img" tag="span" parallax={0.6} style={{ transitionDelay: `${0.3 + order * 0.35}s` }} />
                </span>
              )}
              <span className="ap-word" data-key={key[i] || undefined} aria-hidden>
                {word}
              </span>
            </Fragment>
          );
        })}
      </p>
    </div>
  );
}
