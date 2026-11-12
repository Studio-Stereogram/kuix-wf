"use client";
import { useEffect, useRef, type ElementType, type ReactNode } from "react";
import type React from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { prefersReducedMotion, ready } from "@/lib/motion";

gsap.registerPlugin(SplitText);

type Props = {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  id?: string;
  /** Heading animation: every letter rolls into place in its own mask. */
  chars?: boolean;
};

// Text that animates in once, the first time it enters the viewport.
//
// Headings (chars): the text is split into letters, each in its own clipping
// mask. Letters roll into place one after another, alternating from below and
// from above, while they go from dim to full brightness. The pace is steady
// and quick: a short title takes about a second, a long one about two.
//
// Everything else: the text is split into lines and each line rises out of
// its mask.
export function MaskText({ as = "p", children, className, delay = 0, stagger, id, chars = false }: Props) {
  const Tag = as as "div";
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.visibility = "visible";
      return;
    }
    let shown = false;
    let tween: gsap.core.Tween | undefined;
    let play = () => {};
    let split: SplitText;

    if (chars) {
      split = SplitText.create(el, {
        type: "words,chars",
        mask: "chars",
        wordsClass: "kx-word",
        charsClass: "kx-char",
      });
      const n = split.chars.length;
      const each = stagger ?? Math.min(0.045, Math.max(0.011, 0.62 / Math.max(1, n)));
      gsap.set(split.chars, { yPercent: (i: number) => (i % 2 ? -118 : 118), opacity: 0.2 });
      el.style.visibility = "visible";
      play = () => {
        tween = gsap.to(split.chars, {
          yPercent: 0,
          opacity: 1,
          duration: 1,
          ease: "expo.out",
          stagger: each,
          delay,
        });
      };
    } else {
      split = SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "kx-line",
        autoSplit: true,
        onSplit(self) {
          gsap.set(self.lines, { yPercent: shown ? 0 : 105 });
          el.style.visibility = "visible";
        },
      });
      play = () => {
        tween = gsap.fromTo(
          split.lines,
          { yPercent: 105 },
          { yPercent: 0, duration: 1.05, ease: "power3.out", stagger: stagger ?? 0.12, delay },
        );
      };
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || shown) return;
        shown = true;
        io.disconnect();
        ready.then(play);
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      tween?.kill();
      split.revert();
    };
  }, [delay, stagger, chars]);

  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} id={id} className={className} data-mask="">
      {children}
    </Tag>
  );
}
