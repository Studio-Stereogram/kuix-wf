"use client";
import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/motion";

// One loop for every image on the page. An element marked data-parallax keeps
// its frame, and the picture inside it (its first child, which is cut larger
// than the frame) slides against the scroll: lower on the screen it sits
// higher in the frame, and the other way round.
export function Parallax() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let raf = 0;
    let frame = 0;
    let els: HTMLElement[] = [];
    const loop = () => {
      if (frame++ % 30 === 0) els = [...document.querySelectorAll<HTMLElement>("[data-parallax]")];
      const vh = window.innerHeight;
      for (const el of els) {
        const art = el.firstElementChild as HTMLElement | null;
        if (!art) continue;
        const r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80 || r.width === 0) continue;
        const t = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)));
        const k = Number(el.dataset.parallax) || 1;
        art.style.transform = `translate3d(0, ${(-t * 10 * k).toFixed(2)}%, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  return null;
}
