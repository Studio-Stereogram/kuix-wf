"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { prefersReducedMotion, ready } from "@/lib/motion";

type Props = {
  /** The phrases that take turns. */
  items: string[];
  className?: string;
  /** Seconds a phrase stays before the next one replaces it. */
  hold?: number;
  /** Seconds before the first phrase arrives, once the line is in view. */
  delay?: number;
};

// One line of text whose words change. The line is a mask: the first phrase
// rises into it from below; after a pause it leaves upwards while the next one
// rises into its place, and so on round the list. The mask is only as wide as
// the phrase in it, and its width eases to the next phrase's as they swap, so
// the window stays tight round the words.
// Screen readers get all the phrases at once, as one sentence.
export function Rotator({ items, className, hold = 2.6, delay = 0 }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  // cur: the phrase in place (-1 before the first has arrived). prev: the one leaving.
  const [state, setState] = useState({ cur: -1, prev: -1 });
  // Every phrase must pass through the waiting place below the line before it
  // comes in again, or it would slide back down from where it left. With two
  // phrases there is no spare turn for that, so the list is laid out twice.
  const list = items.length < 3 ? [...items, ...items] : items;
  const count = list.length;
  const items_ = useRef<(HTMLSpanElement | null)[]>([]);

  // The mask takes the width of the phrase in place (the first one before
  // anything has arrived), measured again when the fonts or the size change.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const it = items_.current[Math.max(0, state.cur)];
      if (it) el.style.setProperty("--rot-w", `${it.offsetWidth}px`);
    };
    fit();
    const ro = new ResizeObserver(fit);
    items_.current.forEach((it) => it && ro.observe(it));
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [state.cur]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer = 0;
    let begun = false;
    let alive = true;
    let seen = false;
    const step = () => {
      setState((s) => ({ cur: (s.cur + 1) % count, prev: s.cur }));
      timer = window.setTimeout(tick, hold * 1000);
    };
    // The words only change while the line is on screen.
    const tick = () => {
      if (!alive) return;
      if (seen) step();
      else timer = window.setTimeout(tick, 400);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        seen = e.isIntersecting;
        if (!seen || begun) return;
        begun = true;
        ready.then(() => {
          if (alive) timer = window.setTimeout(step, prefersReducedMotion() ? 0 : delay * 1000);
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => {
      alive = false;
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [count, hold, delay]);

  return (
    <span ref={ref} className={`rot ${className ?? ""}`}>
      <span className="sr-only">{items.join(", ")}</span>
      {list.map((t, i) => (
        <span
          key={i}
          ref={(n) => {
            items_.current[i] = n;
          }}
          className="rot-item" data-state={i === state.cur ? "in" : i === state.prev ? "out" : "wait"} aria-hidden>
          {t}
        </span>
      ))}
    </span>
  );
}
