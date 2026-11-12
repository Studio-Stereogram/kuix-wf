"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ease, prefersReducedMotion, ready } from "@/lib/motion";

// A hairline that draws itself across when it scrolls into view.
export function Rule({ delay = 0, className }: { delay?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    gsap.set(el, { scaleX: 0 });
    let tween: gsap.core.Tween | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      ready.then(() => (tween = gsap.to(el, { scaleX: 1, duration: 1.4, ease: ease.out, delay })));
    });
    io.observe(el);
    return () => {
      io.disconnect();
      tween?.kill();
    };
  }, [delay]);
  return <span ref={ref} className={`rule ${className ?? ""}`} aria-hidden />;
}
