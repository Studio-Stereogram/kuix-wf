"use client";
import { useEffect, useRef } from "react";

// Morphing dot cursor: a small white dot, inverted against what is under it, that follows the pointer with a slight lag.
// Over anything clickable (links, buttons, form controls) it opens into a ring
// around the pointer; on press it tightens a little. Over text fields it steps
// aside for the text cursor, and where a label follows the pointer (the case
// study rows) only the label shows. Only for fine pointers (mouse, trackpad).
export function Cursor() {
  const root = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    const ly = layer.current;
    if (!el || !ly || !window.matchMedia("(pointer: fine)").matches) return;
    document.documentElement.dataset.cursor = "";
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let cx = x;
    let cy = y;
    let raf = 0;
    const tick = () => {
      cx += (x - cx) * 0.3;
      cy += (y - cy) * 0.3;
      for (const n of [el, ly]) {
        n.style.setProperty("--x", `${cx}px`);
        n.style.setProperty("--y", `${cy}px`);
      }
      raf = Math.abs(x - cx) + Math.abs(y - cy) > 0.1 ? requestAnimationFrame(tick) : 0;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x = e.clientX;
      y = e.clientY;
      el.dataset.on = "";
      look(e.target as Element | null);
      if (!raf) raf = requestAnimationFrame(tick);
    };
    // What is under the pointer decides the cursor's shape.
    const look = (t: Element | null) => {
      const hot = t?.closest("a, button, label, select, [role='button']");
      const drag = t?.closest("[data-cursor='drag']");
      const text = t?.closest("input, textarea, select");
      // Places marked data-cursor-label get a label that follows the cross.
      const lab = label.current;
      const says = t?.closest<HTMLElement>("[data-cursor-label]")?.dataset.cursorLabel;
      if (lab) {
        if (says && lab.textContent !== says) lab.textContent = says;
        lab.toggleAttribute("data-show", !!says);
      }
      el.dataset.mode = text ? "text" : drag ? "drag" : says ? "label" : hot ? "hot" : "";
    };
    // The page can move under a still pointer (scrolling, page changes).
    let sraf = 0;
    const scroll = () => {
      if (sraf || !("on" in el.dataset)) return;
      sraf = requestAnimationFrame(() => {
        sraf = 0;
        look(document.elementFromPoint(x, y));
      });
    };
    window.addEventListener("scroll", scroll, { passive: true });
    const leave = () => delete el.dataset.on;
    const down = () => (el.dataset.down = "");
    const up = () => delete el.dataset.down;
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(sraf);
      window.removeEventListener("scroll", scroll);
      delete document.documentElement.dataset.cursor;
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, []);

  return (
    <>
      {/* The dot is white and drawn in "difference" against the page, so it
          reads white on dark backgrounds and black on light ones. */}
      <div ref={root} className="xhair" aria-hidden>
        <span className="mdot" />
      </div>
      {/* The label sits on its own layer so it keeps its own colours. */}
      <div ref={layer} className="xhair-layer" aria-hidden>
        <span ref={label} className="xhair-label" />
      </div>
    </>
  );
}
