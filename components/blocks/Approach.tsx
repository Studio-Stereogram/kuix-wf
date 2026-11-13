"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { approach, sections } from "@/content/copy";
import { prefersReducedMotion, ready } from "@/lib/motion";
import { Rotator } from "../motion/Rotator";
import { Grad, Idx } from "./parts";

const RAD = Math.PI / 180;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Which gradient each image in the sentence uses.
const IMAGES = [0, 3, 4];
// The roll. A line in the middle band of the screen is flat and fully lit. Past
// that band it turns away like text on a drum and dims.
const FLAT = 0.3; // half-height of the flat band, as a share of the screen height
const EDGE = 0.62; // where a line is turned and dimmed the most
const TURN = 64; // degrees round the drum
const LEAN = 12; // degrees of slant at the edge
const DIM = 0.2; // opacity at the edge

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
// - It arrives like the headings do: every line rises out of its own mask,
//   one after another.
// - The images open at the same moment: the words part and the image grows
//   into the gap.
// - The last line is a word that changes: design, technology, practical
//   thinking, one after the other.
// - The lines roll with the scroll: the ones in the middle of the screen are
//   flat and bright, the ones above and below turn away and dim.
export function Approach({ index }: { index: string }) {
  const text = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);

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

    const lines = [...el.querySelectorAll<HTMLElement>(".ap-line")];
    const wide = window.matchMedia("(min-width: 768px)");
    let raf = 0;
    const loop = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (r.bottom > -vh * 0.3 && r.top < vh * 1.3) {
        if (!wide.matches) {
          // Phones wrap freely, so there are no lines to roll: the whole
          // statement fades in as it arrives.
          const t = smooth(vh * 0.95, vh * 0.6, r.top);
          el.style.opacity = String(DIM + (1 - DIM) * t);
          lines.forEach((l) => {
            l.style.transform = "";
            l.style.opacity = "";
          });
        } else {
          el.style.opacity = "";
          const top = r.top;
          lines.forEach((l) => {
            // offsetTop is not affected by the transform, so the roll does not
            // feed back into its own measurement.
            const y = top + l.offsetTop + l.offsetHeight / 2;
            const u = (y - vh / 2) / vh;
            const t = smooth(FLAT, EDGE, Math.abs(u));
            // Seen from the front, a line turning away on a drum gets shorter;
            // the slant stands in for the perspective.
            l.style.transform = t ? `scaleY(${Math.cos(t * TURN * RAD).toFixed(4)}) skewX(${(-t * LEAN).toFixed(2)}deg)` : "";
            l.style.opacity = (1 - t * (1 - DIM)).toFixed(3);
          });
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
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
              <span className="ap-line-in" style={{ transitionDelay: `${li * 0.12}s` }}>
              {tokens.map((t, i) => {
                if ("slot" in t) {
                  const n = order++;
                  // A closed slot has no width, so the sentence reads with
                  // one ordinary space until the image opens.
                  return (
                    <Fragment key={i}>
                      {i > 0 && " "}
                      <span className="ap-slot" data-open={open || undefined} style={{ transitionDelay: `${0.7 + n * 0.3}s` }}>
                        <Grad g={IMAGES[t.slot % IMAGES.length]} className="ap-img" tag="span" parallax={0.6} style={{ transitionDelay: `${0.85 + n * 0.3}s` }} />
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
          <Rotator items={approach.rotate} className="ap-rot" delay={0.35} />
        </span>
      </p>
    </div>
  );
}
