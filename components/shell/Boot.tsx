"use client";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { transitionBus } from "@/lib/bus";
import { ease, markReady, prefersReducedMotion } from "@/lib/motion";
import { KXMark } from "./Logo";

// First-load sequence. Plays once; client navigation never shows it again.
export function Boot() {
  const root = useRef<HTMLDivElement>(null);
  const count = useRef<HTMLSpanElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const finish = () => {
      markReady();
      transitionBus.set({ phase: "idle" });
      setDone(true);
    };
    if (prefersReducedMotion()) return finish();
    const counter = { v: 0 };
    const tl = gsap.timeline({ onComplete: finish });
    tl.from(".boot-mark", { scale: 0.6, opacity: 0, duration: 0.6, ease: ease.out })
      .to(counter, {
        v: 100,
        duration: 1.1,
        ease: "power2.inOut",
        onUpdate: () => {
          if (count.current) count.current.textContent = String(Math.round(counter.v)).padStart(3, "0");
        },
      }, 0.1)
      .to(".boot-bar-fill", { scaleX: 1, duration: 1.1, ease: "power2.inOut" }, 0.1)
      .add(() => markReady(), 1.15)
      .to(root.current, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.9, ease: ease.inOut }, 1.25);
    return () => void tl.kill();
  }, []);

  if (done) return null;
  return (
    <div ref={root} className="boot" aria-hidden>
      <KXMark size={44} className="boot-mark" />
      <div className="boot-meta label">
        <span>KUIX</span>
        <span ref={count}>000</span>
      </div>
      <div className="boot-bar">
        <span className="boot-bar-fill" />
      </div>
    </div>
  );
}
