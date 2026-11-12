"use client";
import { useEffect, useRef, type ElementType, type ComponentPropsWithoutRef } from "react";
import type React from "react";
import gsap from "gsap";
import { dur, ease, prefersReducedMotion, ready } from "@/lib/motion";

type Props<T extends ElementType> = {
  as?: T;
  delay?: number;
  /** Travel distance in px. */
  y?: number;
  /** Trigger as soon as any part is on screen (for things at the very bottom of a screen). */
  eager?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

// "Layer in view": fades, lifts and settles an element the first time it
// enters the viewport. Exit is handled globally by the page transition.
export function Reveal<T extends ElementType = "div">({ as, delay = 0, y = 32, eager = false, children, ...rest }: Props<T>) {
  const Tag = (as ?? "div") as "div";
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1 });
      return;
    }
    gsap.set(el, { opacity: 0, y, scale: 0.985 });
    let tween: gsap.core.Tween | undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        ready.then(() => {
          tween = gsap.to(el, { opacity: 1, y: 0, scale: 1, duration: dur.slow, ease: ease.out, delay });
        });
      },
      { rootMargin: eager ? "0px" : "0px 0px -3% 0px" },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      tween?.kill();
    };
  }, [delay, y, eager]);

  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} data-reveal="" {...rest}>
      {children}
    </Tag>
  );
}
