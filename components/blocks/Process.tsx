"use client";
import { useEffect, useRef } from "react";
import { method, sections } from "@/content/copy";
import { prefersReducedMotion } from "@/lib/motion";
import { MethodIcon, SectionHead } from "./parts";

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// Anchor positions: x as a share of the screen width, y as a share of the wave
// amplitude (negative is up). Start low, peak, trough, settle near the middle.
const ANCHORS = [
  { x: 0.12, y: 0.7 },
  { x: 0.37, y: -1 },
  { x: 0.63, y: 0.85 },
  { x: 0.87, y: -0.35 },
];
const SAMPLES = 220;

// The method as a line that finds its shape, on one pinned screen with the
// section header above it. The line runs from one edge of the screen to the
// other. It starts drawing while the section is still scrolling into view,
// faint, shaky and hand-drawn. Scrolling on loads it from left to right: the
// loaded part turns white and settles into a clean curve through four points,
// one per step, and each step appears as the white reaches it. At the end the
// line flattens into a straight baseline.
export function Process({ index }: { index: string }) {
  const pin = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPathElement>(null);
  const faint = useRef<SVGPathElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const anchors = useRef<(HTMLDivElement | null)[]>([]);
  const steps = method.steps;

  useEffect(() => {
    const reduced = prefersReducedMotion();
    let raf = 0;
    const loop = () => {
      const el = pin.current;
      const st = stage.current;
      const path = line.current;
      if (el && st && path && svg.current) {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        if (r.bottom > 0 && r.top < vh) {
          // enter: 0 when the section's top edge appears at the bottom of the
          // screen, 1 when the section pins. p: progress through the pin.
          const enter = reduced ? 1 : clamp01((vh - r.top) / vh);
          const p = reduced ? 0.6 : clamp01(-r.top / Math.max(1, r.height - vh));
          const w = st.clientWidth;
          const h = st.clientHeight;
          svg.current.setAttribute("viewBox", `0 0 ${w} ${h}`);
          const base = h * 0.54;
          const amp = h * 0.21;

          const draw = smooth(0.3, 0.95, enter);
          // How far the white has come, as a share of the screen width. It
          // runs a little past the edge so the end of the line settles too.
          const load = clamp01((p - 0.03) / 0.42) * 1.14;
          const flat = smooth(0.8, 0.96, p);

          const ax = ANCHORS.map((a) => a.x * w);
          const ay = ANCHORS.map((a) => base + a.y * amp * (1 - flat));
          const clean = (x: number) => {
            if (x <= ax[0]) return ay[0];
            if (x >= ax[3]) return ay[3];
            let k = 0;
            while (x > ax[k + 1]) k++;
            const t = (x - ax[k]) / (ax[k + 1] - ax[k]);
            return ay[k] + ((ay[k + 1] - ay[k]) * (1 - Math.cos(Math.PI * t))) / 2;
          };
          const shake = (x: number) => {
            const u = x / w;
            return (
              (Math.sin(u * 23 + 1.3) * 0.22 +
                Math.sin(u * 51 + 0.4) * 0.09 +
                Math.sin(u * 97 + 2.1) * 0.04 +
                Math.sin(u * 7 + 0.2) * 0.35) *
              // Clean behind the white, still shaky ahead of it.
              amp * (1 - smooth(load + 0.1, load - 0.04, u)) * (1 - flat)
            );
          };
          // Edge to edge: the line starts and ends just outside the screen.
          let d = "";
          let len = 0; // length of the line so far
          let loaded = 0; // length of the part the white has reached
          let px = 0, py = 0;
          for (let i = 0; i <= SAMPLES; i++) {
            const x = -4 + ((w + 8) * i) / SAMPLES;
            const y = clean(x) + shake(x);
            d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
            if (i) len += Math.hypot(x - px, y - py);
            if (x <= load * w) loaded = len;
            px = x;
            py = y;
          }
          // The same line twice: a faint one that draws itself as the section
          // arrives, and a white one on top that loads with the scroll.
          path.setAttribute("d", d);
          path.style.strokeDashoffset = String(1 - Math.min(draw, loaded / Math.max(1, len)));
          if (faint.current) {
            faint.current.setAttribute("d", d);
            faint.current.style.strokeDashoffset = String(1 - draw);
          }

          anchors.current.forEach((a, k) => {
            if (!a) return;
            const show = smooth(ANCHORS[k].x - 0.03, ANCHORS[k].x + 0.05, load);
            a.style.transform = `translate(${ax[k]}px, ${ay[k]}px)`;
            a.style.opacity = String(show);
            a.style.setProperty("--show", String(show));
            a.toggleAttribute("data-up", ANCHORS[k].y < 0);
          });
          st.style.setProperty("--flat", String(flat));
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={pin} className="process-pin">
      <div className="process">
        <div className="container">
          <SectionHead index={index} label={sections.method.label} title={sections.method.title} aside={sections.method.desc} />
        </div>
        <div ref={stage} className="pstage">
          <svg ref={svg} className="pline" aria-hidden>
            <path ref={faint} pathLength={1} className="pline-path pline-faint" />
            <path ref={line} pathLength={1} className="pline-path" />
          </svg>
          {steps.map((s, k) => (
            <div
              key={s.title}
              ref={(el) => {
                anchors.current[k] = el;
              }}
              className="pa"
            >
              <span className="pa-handle" aria-hidden>
                <i />
                <i />
              </span>
              <span className="pa-dot" aria-hidden />
              <div className="pa-text">
                <MethodIcon name={s.key} />
                <h3 className="pa-title">
                  <span className="pa-index label">(0{k + 1})</span>
                  <span>{s.title}</span>
                </h3>
                <p className="pa-body body">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
        <ol className="psteps-list container">
          {steps.map((s, k) => (
            <li key={s.title}>
              <MethodIcon name={s.key} />
              <span className="pa-title">
                <span className="label accent">(0{k + 1})</span> {s.title}
              </span>
              <span className="body">{s.body}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
