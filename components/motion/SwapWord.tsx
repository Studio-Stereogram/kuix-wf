"use client";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

export type SwapOption = { word: string; glyph: ReactNode };

// A word in a heading that changes when clicked, with a small icon beside it.
// The word sits on a tinted box that is also its mask: the old word leaves
// upwards as the new one rises in, and the box eases to the new word's width
// so the words around it make room. On hover the box fills with the primary
// colour and the word rolls, like the buttons. The icon (a primary tile with a
// fine-line diagram icon, as on the buttons) pops out and back in with each
// change. Keyboard: it is a button, so Enter and Space work.
export function SwapWord({ options, label }: { options: SwapOption[]; label: string }) {
  const [state, setState] = useState({ cur: 0, prev: -1, n: 0 });
  const mask = useRef<HTMLSpanElement>(null);
  const items = useRef<(HTMLSpanElement | null)[]>([]);

  useLayoutEffect(() => {
    const m = mask.current;
    if (!m) return;
    const fit = () => {
      const it = items.current[state.cur];
      if (it) m.style.setProperty("--sw-w", `${it.offsetWidth}px`);
    };
    fit();
    const ro = new ResizeObserver(fit);
    items.current.forEach((it) => it && ro.observe(it));
    return () => ro.disconnect();
  }, [state.cur]);

  const next = () => setState((s) => ({ cur: (s.cur + 1) % options.length, prev: s.cur, n: s.n + 1 }));
  const o = options[state.cur];

  return (
    <button type="button" className="sw" onClick={next} data-cursor-label="Change" aria-label={`${label}: ${o.word}. Change`}>
      <span ref={mask} className="sw-mask">
        {options.map((op, i) => (
          <span
            key={op.word}
            ref={(el) => {
              items.current[i] = el;
            }}
            className="sw-item"
            data-state={i === state.cur ? "in" : i === state.prev ? "out" : "wait"}
            aria-hidden
          >
            <span className="sw-roll" data-text={op.word}>{op.word}</span>
          </span>
        ))}
      </span>
      <span key={state.n} className="sw-pic" aria-hidden>
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor">
          {o.glyph}
        </svg>
      </span>
    </button>
  );
}
