"use client";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { transitionBus } from "@/lib/bus";
import { ease } from "@/lib/motion";

// A single scan line sweeps the screen while a page transforms.
export function Scan() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      transitionBus.subscribe((s) => {
        if (s.phase === "exiting") {
          gsap.fromTo(ref.current, { yPercent: -100, opacity: 1 }, { yPercent: 100, duration: 0.85, ease: ease.inOut });
        }
        if (s.phase === "entering") gsap.to(ref.current, { opacity: 0, duration: 0.3 });
      }),
    [],
  );
  return <div ref={ref} className="scan" aria-hidden />;
}
