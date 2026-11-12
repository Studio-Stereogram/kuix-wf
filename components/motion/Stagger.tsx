"use client";
import { useEffect, useRef, type ComponentPropsWithoutRef, type ElementType } from "react";
import type React from "react";
import { prefersReducedMotion, ready } from "@/lib/motion";

type Props<T extends ElementType> = {
  as?: T;
  /** How the children arrive; see [data-stagger] in globals.css. */
  fx?: "rise" | "tilt" | "rows" | "letters";
  /** Seconds between two children that arrive together. */
  each?: number;
  /** Seconds before the first one. */
  delay?: number;
  /** How far inside the screen a child must be before it arrives. */
  margin?: string;
  /** Watch the group, not each child: when it comes into view, all arrive in order. */
  whole?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "as">;

// "Layer in view" for a group. Every direct child arrives once, the first time
// it comes into view. Children that come into view together arrive one after
// another, in order; a child that is scrolled to later arrives on its own.
// The motion itself is CSS: a child gets data-in and its delay in --d, and
// data-done once it has settled, so its own hover transitions take over again.
export function Stagger<T extends ElementType = "div">({
  as,
  fx = "rise",
  each = 0.09,
  delay = 0,
  margin = "0px 0px -9% 0px",
  whole = false,
  children,
  ...rest
}: Props<T>) {
  const Tag = (as ?? "div") as "div";
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const kids = [...el.children] as HTMLElement[];
    if (prefersReducedMotion()) {
      kids.forEach((k) => {
        k.setAttribute("data-in", "");
        k.setAttribute("data-done", "");
      });
      return;
    }
    const timers: number[] = [];
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
        if (!hit.length) return;
        const batch = whole ? kids : hit.sort((a, b) => kids.indexOf(a) - kids.indexOf(b));
        if (whole) io.disconnect();
        batch.forEach((k, i) => {
          io.unobserve(k);
          ready.then(() => {
            const d = delay + i * each;
            k.style.setProperty("--d", `${d.toFixed(2)}s`);
            k.setAttribute("data-in", "");
            timers.push(window.setTimeout(() => k.setAttribute("data-done", ""), (d + 1.8) * 1000));
          });
        });
      },
      { rootMargin: margin },
    );
    if (whole) io.observe(el);
    else kids.forEach((k) => io.observe(k));
    return () => {
      io.disconnect();
      timers.forEach(clearTimeout);
    };
  }, [each, delay, margin, whole]);

  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} data-stagger={fx} {...rest}>
      {children}
    </Tag>
  );
}
