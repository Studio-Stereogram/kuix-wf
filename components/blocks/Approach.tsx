"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { approach, sections } from "@/content/copy";
import { prefersReducedMotion, ready } from "@/lib/motion";
import { Rotator } from "../motion/Rotator";
import { Grad, Idx } from "./parts";

// Which gradient each image in the sentence uses.
const IMAGES = [0, 3, 4];

type Token = { word: string; key: boolean } | { slot: number };
// "[key words] plain {0} words" -> tokens.
function parse(line: string, state: { key: boolean }): Token[] {
  return line.split(" ").map((raw) => {
    const slot = raw.match(/^\{(\d)\}$/);
    if (slot) return { slot: Number(slot[1]) };
    const opens = raw.startsWith("[");
    const closes = raw.endsWith("]");
    const key = state.key || opens;
    state.key = key && !closes;
    return { word: raw.replace(/^\[|\]$/g, ""), key };
  });
}

// The approach statement, under its index label. There is no large title here:
// the statement is the headline. It is centred and set in short lines, with
// three small images inside the sentence, like a rebus.
// - It arrives as a pure text mask: every line rises into a mask exactly as
//   tall as the line, one after another. The images are part of their line
//   and rise with it.
// - The last line ends on a word that changes: design, technology, practical
//   thinking, one after the other, in the same kind of mask.
export function Approach({ index }: { index: string }) {
  const text = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);

  // The statement arrives once, the first time it is in view: every line
  // rises into its own mask, one after another. Nothing else moves.
  useEffect(() => {
    const el = text.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      setOpen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        ready.then(() => setOpen(true));
      },
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const state = { key: false };
  const lines = approach.lines.map((l) => parse(l, state));
  const plain = `${lines
    .flat()
    .flatMap((t) => ("word" in t ? [t.word] : []))
    .join(" ")} ${approach.rotate.join(", ")}`;
  let order = 0;
  return (
    <div className="approach container">
      <h2 className="sr-only">{sections.approach.title}</h2>
      <Idx index={index} label={sections.approach.label} className="approach-idx" />
      <p ref={text} className="approach-text" aria-label={plain} data-open={open || undefined}>
        {lines.map((tokens, li) => (
          <Fragment key={li}>
            {li > 0 && " "}
            <span className="ap-line" aria-hidden>
              <span className="ap-line-in" style={{ transitionDelay: `${li * 0.1}s` }}>
              {tokens.map((t, i) => {
                if ("slot" in t) {
                  const n = order++;
                  // The image sits in the line like a word and rises with it.
                  return (
                    <Fragment key={i}>
                      {i > 0 && " "}
                      <span className="ap-slot" data-n={n}>
                        <Grad g={IMAGES[t.slot % IMAGES.length]} className="ap-img" tag="span" parallax={0.6} />
                      </span>
                    </Fragment>
                  );
                }
                return (
                  <Fragment key={i}>
                    {i > 0 && !("slot" in tokens[i - 1]) && " "}
                    <span className="ap-word" data-key={t.key || undefined}>
                      {t.word}
                    </span>
                  </Fragment>
                );
              })}
              </span>
            </span>
          </Fragment>
        ))}{" "}
        {/* The sentence ends on a line whose words change. */}
        <span className="ap-line" aria-hidden>
          <Rotator items={approach.rotate} className="ap-rot" delay={0.4} />
        </span>
      </p>
    </div>
  );
}
