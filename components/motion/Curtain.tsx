"use client";
import { useEffect, useRef } from "react";
import { prefersReducedMotion, ready } from "@/lib/motion";

type Props = {
  /** "scroll": the curtain lifts with the scroll as its parent comes up the
   *  screen. "reveal": it lifts once, the first time its parent is in view. */
  mode?: "scroll" | "reveal";
  /** Colour of the curtain. */
  color?: string;
  /** Seconds before a reveal curtain lifts. */
  delay?: number;
  className?: string;
};

// A curtain over its parent (which must be positioned): a solid panel that
// rises away from the bottom edge up, uncovering what is underneath.
// - scroll: tied to the scroll position. The panel covers the parent while
//   its top edge enters the screen and is fully raised by the time that edge
//   reaches the top fifth of the screen. Used on the footer, so the light
//   section above seems to be drawn up over it like a curtain.
// - reveal: plays once, in time, the first time the parent is in view.
export function Curtain({ mode = "reveal", color = "var(--bg)", delay = 0, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host) return;
    if (prefersReducedMotion()) {
      el.style.transform = "scaleY(0)";
      return;
    }
    if (mode === "reveal") {
      const io = new IntersectionObserver(
        ([e]) => {
          if (!e.isIntersecting) return;
          io.disconnect();
          ready.then(() => {
            el.style.transitionDelay = `${delay}s`;
            el.dataset.open = "";
          });
        },
        { rootMargin: "0px 0px -12% 0px" },
      );
      io.observe(host);
      return () => io.disconnect();
    }
    let raf = 0;
    let last = -1;
    const loop = () => {
      const r = host.getBoundingClientRect();
      const vh = window.innerHeight;
      const t = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.8)));
      // Eased, so the panel starts slowly and speeds up as it rises.
      const e = t * t * (3 - 2 * t);
      if (e !== last) {
        last = e;
        el.style.transform = `scaleY(${(1 - e).toFixed(4)})`;
        host.style.setProperty("--curtain", e.toFixed(4));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [mode, delay]);

  return <span ref={ref} className={`curtain ${className ?? ""}`} data-mode={mode} style={{ background: color }} aria-hidden />;
}
