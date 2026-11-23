"use client";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/motion";

export type LiveOption = { word: string; glyph: ReactNode };

// A word in running text that changes by itself every few seconds: a soft
// pill with a small icon tile and the word. On each change the old word fades
// out, the new one types in letter by letter from a blur and the icon pops.
// The pill is always as wide as the longest word in its list, so the sentence
// around it never reflows: its lines break the same way for every word. It only runs
// while it is on screen. Screen readers get the first word only, as plain
// text, so the sentence reads normally.
export function LiveWord({ options, period = 3200, offset = 0 }: { options: LiveOption[]; period?: number; offset?: number }) {
  const [i, setI] = useState(0);
  const root = useRef<HTMLSpanElement>(null);
  const sizer = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion() || options.length < 2) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let on = false;
    const tick = (wait: number) => {
      timer = setTimeout(() => {
        if (!on || document.hidden) return tick(period);
        setI((v) => (v + 1) % options.length);
        tick(period);
      }, wait);
    };
    const io = new IntersectionObserver(([e]) => {
      on = e.isIntersecting;
    });
    io.observe(el);
    tick(period + offset);
    return () => {
      io.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [options.length, period, offset]);

  // The pill takes the width of the longest word, measured from hidden
  // copies of every word, again when the fonts or the size change.
  useLayoutEffect(() => {
    const el = root.current;
    const sz = sizer.current;
    if (!el || !sz) return;
    const fit = () => {
      const w = Math.max(0, ...[...sz.children].map((c) => (c as HTMLElement).offsetWidth));
      el.style.setProperty("--lw-w", `${Math.ceil(w) + 2}px`);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(sz);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [options]);

  const o = options[i];
  return (
    <span ref={root} className="lw">
      <span className="sr-only">{options[0].word}</span>
      <span className="lw-pill" aria-hidden>
        <span key={`g${i}`} className="lw-pic">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor">{o.glyph}</svg>
        </span>
        <span className="lw-mask">
          <span ref={sizer} className="lw-sizer">
            {options.map((op) => (
              <span key={op.word} className="lw-word">{op.word}</span>
            ))}
          </span>
          <span key={`w${i}`} className="lw-word">
            {[...o.word].map((c, k) => (
              <span key={k} style={{ animationDelay: `${k * 32}ms` }}>
                {c === " " ? " " : c}
              </span>
            ))}
          </span>
        </span>
      </span>
    </span>
  );
}
