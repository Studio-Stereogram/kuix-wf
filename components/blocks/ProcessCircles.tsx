"use client";
import { useEffect, useRef } from "react";
import { method, sections } from "@/content/copy";
import { prefersReducedMotion } from "@/lib/motion";
import { MethodIcon, SectionHead } from "./parts";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// Holds each planet in front for part of its scroll range.
const dwell = (x: number) => Math.floor(x) + smooth(0.2, 0.8, x - Math.floor(x));

const RAD = Math.PI / 180;
const CAM = 2.6; // camera distance, in planet diameters
const RING = 1.55; // radius of the shared orbit, in planet diameters
const PITCH_END = 6 * RAD; // how far above the orbit plane the camera ends up
const DESCEND: [number, number] = [0.05, 0.36]; // part of the scroll spent coming down
const TOP_TURN = -135 * RAD; // from above, step one sits top left and the rest follow clockwise

// Method, version B: a small solar system. The four steps are planets on one
// shared orbit, each with a dashed ring of its own that keeps turning.
// - First you look straight down on the system, like at the lid of a box: the
//   orbit is a full circle with the four planets spaced around it.
// - Scrolling swings the camera down through almost ninety degrees, to the
//   side of the box. The orbit and the rings tip over into thin ellipses, the
//   first planet comes round to the front and the others wait further back.
// - Scrolling on turns the orbit: each planet in turn comes round to the
//   front, holds, then moves on.
// Positions are worked out with a small camera model, so the layout holds at
// any screen size.
export function ProcessCircles({ index }: { index: string }) {
  const pin = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const orbit = useRef<SVGPathElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const steps = method.steps;
  const n = steps.length;

  useEffect(() => {
    const reduced = prefersReducedMotion();
    const STEP = (2 * Math.PI) / n;
    let raf = 0;
    let s = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const el = pin.current;
      const st = stage.current;
      if (el && st) {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        if (r.bottom > -vh * 0.5 && r.top < vh * 1.5) {
          const p = reduced ? 1 : clamp01(-r.top / Math.max(1, r.height - vh));
          const descend = smooth(DESCEND[0], DESCEND[1], p);
          const q = clamp01((p - DESCEND[1]) / (1 - DESCEND[1]));
          const target = dwell(q * (n - 1) * 0.9999);
          s = reduced ? Math.round(target) : s + (target - s) * (1 - Math.exp(-dt * 8));

          const w = st.clientWidth;
          const h = st.clientHeight;
          const d = items.current[0]?.offsetWidth ?? 400;
          const top = head.current ? head.current.offsetTop + head.current.offsetHeight : 0;
          const cx = w / 2;
          const cy = (top + h) / 2;
          // Looking down: zoomed out until the whole orbit fits under the header.
          // The planets sit on the diagonals, so that is how far the system reaches.
          const span = RING * 1.42 + 1.5;
          const zoom0 = Math.min(0.5, ((h - top) * 0.96) / (span * d), (w * 0.94) / (span * d));
          // The camera tilts first and moves in second, so the far side of the
          // orbit never swings up over the header.
          const pitch = lerp(Math.PI / 2, PITCH_END, smooth(0, 0.8, descend));
          const move = smooth(0.3, 1, descend);
          const zoom = lerp(zoom0, 1, move);
          // The orbit turns as the camera comes down, and then once per step.
          const turn = lerp(TOP_TURN, 0, descend) + s * STEP;
          // The camera looks at the middle of the orbit from above, and at the
          // planet in front once it is down.
          const look = RING * move;
          const cp = Math.cos(pitch), sp = Math.sin(pitch);

          // a: angle round the orbit; 0 is the point nearest the camera.
          const project = (a: number) => {
            const x = RING * Math.sin(a);
            const z = look - RING * Math.cos(a);
            const zv = z * cp;
            const sc = CAM / Math.max(0.3, CAM + zv);
            return { x: cx + x * sc * zoom * d, y: cy - z * sp * sc * zoom * d, sc: sc * zoom, zv };
          };

          items.current.forEach((it, i) => {
            if (!it) return;
            const a = turn - i * STEP;
            const v = project(a);
            const off = Math.abs(Math.atan2(Math.sin(a), Math.cos(a))); // angle away from the front
            const far = 1 - clamp01(v.zv / (CAM * 1.5)) * 0.72;
            const focus = Math.max(0, 1 - off / STEP) * descend;
            it.style.transform = `translate3d(${v.x.toFixed(1)}px, ${v.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${v.sc.toFixed(4)})`;
            it.style.opacity = String(lerp(1, far, descend));
            it.style.zIndex = String(Math.round(1000 - v.zv * 100));
            it.style.setProperty("--focus", focus.toFixed(3));
            it.style.setProperty("--sc", v.sc.toFixed(4));
            it.toggleAttribute("data-front", focus > 0.5);
          });
          st.style.setProperty("--squash", sp.toFixed(4));
          st.style.setProperty("--over", String(1 - smooth(0, 0.6, descend)));

          // The shared orbit: a circle from above, a thin ellipse from the side.
          if (orbit.current && svg.current) {
            svg.current.setAttribute("viewBox", `0 0 ${w} ${h}`);
            let path = "";
            for (let k = 0; k <= 96; k++) {
              const v = project((k / 96) * Math.PI * 2);
              path += `${k ? "L" : "M"}${v.x.toFixed(1)} ${v.y.toFixed(1)}`;
            }
            orbit.current.setAttribute("d", path + "Z");
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [n]);

  const ring = (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none">
      <circle cx="50" cy="50" r="49.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );

  return (
    <div ref={pin} className="pc-pin" style={{ height: `${170 + (n - 1) * 75}svh` }}>
      <div className="pc-sticky">
        <div ref={head} className="pc-head container">
          <SectionHead index={index} label={`${sections.method.label} · version B`} title={sections.method.title} />
        </div>
        <div ref={stage} className="pc-stage">
          <svg ref={svg} className="pc-path" aria-hidden>
            <path ref={orbit} />
          </svg>
          {steps.map((st, i) => (
            <div
              key={st.title}
              ref={(el) => {
                items.current[i] = el;
              }}
              className="pc-item"
            >
              <span className="pc-orbit pc-orbit-back" aria-hidden>{ring}</span>
              <span className="pc-disc" aria-hidden />
              <span className="pc-orbit pc-orbit-front" aria-hidden>{ring}</span>
              <div className="pc-text">
                <MethodIcon name={st.key} />
                <span className="pc-index label">(0{i + 1})</span>
                <h3 className="pc-title">{st.title}</h3>
                <p className="pc-body body">{st.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
