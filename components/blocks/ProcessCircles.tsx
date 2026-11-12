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

const CAM = 2.6; // camera distance, in planet diameters
const PITCH_END = (34 * Math.PI) / 180; // how far above the plane the camera ends up
const DESCEND: [number, number] = [0.05, 0.3]; // part of the scroll spent coming down

// Method, version B: a small solar system. The four steps are planets on one
// orbit line, each with a dashed ring that keeps turning.
// - First you look straight down on the system: four circles in a row with
//   their rings around them.
// - Scrolling brings the camera down towards the plane. The rings tip over
//   into ellipses, the first planet comes up close, and the others wait
//   further out, smaller and dimmer.
// - Scrolling on flies along the orbit: each planet in turn comes towards you,
//   holds, then passes by.
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
          const mobile = w < 768;
          // World spacing between neighbours, in planet diameters.
          const sx = mobile ? 0.62 : 1.45;
          const sz = mobile ? 2 : 1.3;
          const alpha = Math.atan2(sz, sx);
          const top = head.current ? head.current.offsetTop + head.current.offsetHeight : 0;
          const cx = w / 2;
          const cy = (top + h) / 2;
          // Looking down: the row of planets is turned to run across the screen
          // (down the screen on phones) and zoomed out until all of it fits.
          const span = (n - 1) * Math.hypot(sx, sz) + 1.5;
          const zoom0 = mobile ? Math.min(0.36, ((h - top) * 0.94) / (span * d)) : Math.min(0.42, (w * 0.92) / (span * d));
          const yaw = (mobile ? -Math.PI / 2 - alpha : -alpha) * (1 - descend);
          const pitch = lerp(Math.PI / 2, PITCH_END, descend);
          const zoom = lerp(zoom0, 1, descend);
          const f = lerp((n - 1) / 2, s, descend);
          const cyaw = Math.cos(yaw), syaw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);

          const project = (i: number) => {
            const dx = (i - f) * sx;
            const dz = (i - f) * sz;
            const x1 = dx * cyaw - dz * syaw;
            const z1 = dx * syaw + dz * cyaw;
            const zv = z1 * cp;
            const sc = CAM / Math.max(0.3, CAM + zv);
            return { x: cx + x1 * sc * zoom * d, y: cy - z1 * sp * sc * zoom * d, sc: sc * zoom, zv };
          };

          items.current.forEach((it, i) => {
            if (!it) return;
            const v = project(i);
            const near = v.zv < 0 ? clamp01(1 + v.zv / (CAM * 0.4)) : 1;
            const far = 1 - clamp01(v.zv / (CAM * 1.5)) * 0.72;
            const focus = Math.max(0, 1 - Math.abs(i - f)) * descend;
            it.style.transform = `translate3d(${v.x.toFixed(1)}px, ${v.y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${v.sc.toFixed(4)})`;
            it.style.opacity = String(lerp(1, near * far, descend));
            it.style.zIndex = String(Math.round(1000 - v.zv * 100));
            it.style.setProperty("--focus", focus.toFixed(3));
            it.style.setProperty("--sc", v.sc.toFixed(4));
            it.toggleAttribute("data-front", focus > 0.5);
          });
          st.style.setProperty("--squash", sp.toFixed(4));
          st.style.setProperty("--over", String(1 - smooth(0, 0.6, descend)));

          // The orbit line through all the planets, and a little beyond.
          if (orbit.current && svg.current) {
            svg.current.setAttribute("viewBox", `0 0 ${w} ${h}`);
            let path = "";
            for (let k = 0; k <= 48; k++) {
              const v = project(-1.5 + (k / 48) * (n + 2));
              if (v.zv < -CAM * 0.7) continue;
              path += `${path ? "L" : "M"}${v.x.toFixed(1)} ${v.y.toFixed(1)}`;
            }
            orbit.current.setAttribute("d", path);
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
              <div className="pc-over" aria-hidden>
                <span className="pc-over-index">(0{i + 1})</span>
                <span className="pc-over-title">{st.title}</span>
              </div>
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
