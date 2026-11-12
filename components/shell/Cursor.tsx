"use client";
import { useEffect, useRef } from "react";

// Crosshair cursor: one vertical and one horizontal hairline across the whole
// screen, crossing at the pointer with a small "+". Over links the "+" turns
// chartreuse and grows a little; over buttons it stays as it is. Only for fine
// pointers (mouse, trackpad).
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.dataset.cursor = "";
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let cx = x;
    let cy = y;
    let raf = 0;
    const tick = () => {
      cx += (x - cx) * 0.35;
      cy += (y - cy) * 0.35;
      el.style.setProperty("--x", `${cx}px`);
      el.style.setProperty("--y", `${cy}px`);
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.1 ? requestAnimationFrame(tick) : 0;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      el.dataset.on = "";
      const t = e.target as Element | null;
      const hot = t?.closest("a, button, label, [role='button']");
      const drag = t?.closest("[data-cursor='drag']");
      const text = t?.closest("input, textarea, select");
      // Places marked data-cursor-label get a label that follows the cross.
      const lab = label.current;
      const says = t?.closest<HTMLElement>("[data-cursor-label]")?.dataset.cursorLabel;
      if (lab) {
        if (says && lab.textContent !== says) lab.textContent = says;
        lab.toggleAttribute("data-show", !!says);
      }
      // Buttons leave the cross as it is.
      const button = t?.closest(".cta");
      el.dataset.mode = text ? "text" : drag ? "drag" : hot && !button ? "hot" : "";
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const leave = () => delete el.dataset.on;
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      cancelAnimationFrame(raf);
      delete document.documentElement.dataset.cursor;
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
    };
  }, []);

  return (
    <div ref={root} className="xhair" aria-hidden>
      <span className="xhair-v" />
      <span className="xhair-h" />
      <span className="xhair-mark" />
      <span ref={label} className="xhair-label" />
    </div>
  );
}
