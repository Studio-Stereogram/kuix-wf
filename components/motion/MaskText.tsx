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
// Headings (chars): the text is split into lines, each in its own clipping
// mask. One after another the lines rise into place, going from blurred and
// faint to sharp and full.
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
      // Headings: line by line, each line rises out of its own mask while it
      // comes into focus (from blurred to sharp) and from faint to full.
      split = SplitText.create(el, {
        type: "lines",
        mask: "lines",
        linesClass: "kx-hline",
        autoSplit: true,
        onSplit(self) {
          gsap.set(self.lines, shown ? { yPercent: 0, opacity: 1, filter: "blur(0px)" } : { yPercent: 100, opacity: 0, filter: "blur(14px)" });
          el.style.visibility = "visible";
        },
      });
      play = () => {
        tween = gsap.to(split.lines, {
          yPercent: 0,
          opacity: 1,
          filter: "blur(0px)",
          duration: 1.15,
          ease: "expo.out",
          stagger: stagger ?? 0.16,
          delay,
          clearProps: "filter",
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
      // Headings wait until they are well inside the screen, so the letters
      // are still moving when the eye gets to them.
      { rootMargin: chars ? "0px 0px -20% 0px" : "0px 0px -8% 0px" },
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
