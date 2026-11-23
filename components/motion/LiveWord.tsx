"use client";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { prefersReducedMotion } from "@/lib/motion";

export type LiveOption = { word: string; glyph: ReactNode };

// A word in running text that changes by itself every few seconds: a soft
// pill with a small icon tile and the word. On each change the old word fades
// out, the new one types in letter by letter from a blur, the icon pops, and
// the pill eases to the new width so the sentence makes room. It only runs
// while it is on screen. Screen readers get the first word only, as plain
// text, so the sentence reads normally.
export function LiveWord({ options, period = 3200, offset = 0 }: { options: LiveOption[]; period?: number; offset?: number }) {
  const [i, setI] = useState(0);
  const root = useRef<HTMLSpanElement>(null);
  const word = useRef<HTMLSpanElement>(null);

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

  // The pill eases to the width of the new word.
  useLayoutEffect(() => {
    const el = root.current;
    const w = word.current;
    if (!el || !w) return;
    const fit = () => el.style.setProperty("--lw-w", `${w.offsetWidth}px`);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(w);
    return () => ro.disconnect();
  }, [i]);

  const o = options[i];
  return (
    <span ref={root} className="lw">
      <span className="sr-only">{options[0].word}</span>
      <span className="lw-pill" aria-hidden>
        <span key={`g${i}`} className="lw-pic">
          <svg viewBox="0 0 18 18" fill="none" stroke="currentColor">{o.glyph}</svg>
        </span>
        <span className="lw-mask">
          <span key={`w${i}`} ref={word} className="lw-word">
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
