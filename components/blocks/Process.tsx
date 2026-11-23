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
// Depth. The line is a thread in space: as it runs across the screen it also
// swings towards and away from the viewer, and it casts a faint shadow on a
// floor below it. Everything is drawn through one perspective camera.
const DEPTH = 0.75; // how far back the far stretches go, as a share of the stage width
const FOCAL = 0.95; // focal length, as a share of the stage width
const HORIZON = 0.18; // vanishing height, as a share of the stage height
const FLOOR = 1.5; // the floor, in wave amplitudes below the baseline
// Depth along the line at u (0 left edge, 1 right edge): 0 is the front.
const zAt = (u: number) => 0.5 + 0.5 * Math.sin(Math.PI * 2 * u * 0.9 + 1.9);

// The method as a line that finds its shape, on one pinned screen with the
// section header above it. The line runs from one edge of the screen to the
// other. It starts drawing while the section is still scrolling into view,
// faint, shaky and hand-drawn. Scrolling on loads it from left to right: the
// loaded part turns white and settles into a clean curve through four points,
// one per step, and each step appears as the white reaches it. At the end the
// line flattens into a straight baseline.
export function Process({ index, version }: { index: string; version?: string }) {
  const pin = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const line = useRef<SVGPathElement>(null);
  const faint = useRef<SVGPathElement>(null);
  const shadow = useRef<SVGPathElement>(null);
  const drops = useRef<(SVGLineElement | null)[]>([]);
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
          // The camera: points further back shrink towards the vanishing
          // point, above the middle of the stage.
          const f = w * FOCAL;
          const hy = h * HORIZON;
          const floor = base + amp * FLOOR;
          const depth = w * DEPTH * (1 - flat * 0.35);
          const proj = (x: number, y: number, u: number) => {
            const k = f / (f + zAt(u) * depth);
            return { x: w / 2 + (x - w / 2) * k, y: hy + (y - hy) * k, k };
          };
          // Edge to edge: the line starts and ends well outside the screen,
          // so the far ends still reach the edges after the perspective.
          let d = "";
          let sd = "";
          let len = 0; // length of the line so far
          let loaded = 0; // length of the part the white has reached
          let px = 0, py = 0;
          for (let i = 0; i <= SAMPLES; i++) {
            const x = -w * 0.2 + (w * 1.4 * i) / SAMPLES;
            const u = x / w;
            const y = clean(x) + shake(x);
            const q = proj(x, y, u);
            const g = proj(x, floor, u);
            d += `${i ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
            sd += `${i ? "L" : "M"}${g.x.toFixed(1)} ${g.y.toFixed(1)}`;
            if (i) len += Math.hypot(q.x - px, q.y - py);
            if (x <= load * w) loaded = len;
            px = q.x;
            py = q.y;
          }
          if (shadow.current) {
            shadow.current.setAttribute("d", sd);
            shadow.current.style.opacity = String(draw * 0.5);
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
            const u = ANCHORS[k].x;
            const q = proj(ax[k], ay[k], u);
            const g = proj(ax[k], floor, u);
            // Nearer steps are larger, sharper and on top; far ones recede.
            const near = (q.k - f / (f + depth)) / Math.max(0.001, 1 - f / (f + depth));
            a.style.transform = `translate(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px) scale(${(0.72 + 0.28 * near).toFixed(3)})`;
            a.style.opacity = String(show * (0.55 + 0.45 * near));
            a.style.zIndex = String(Math.round(near * 10));
            const blur = Math.round((1 - near) * 2.5 * 4) / 4;
            a.style.filter = blur ? `blur(${blur}px)` : "none";
            const dl = drops.current[k];
            if (dl) {
              dl.setAttribute("x1", q.x.toFixed(1));
              dl.setAttribute("y1", q.y.toFixed(1));
              dl.setAttribute("x2", g.x.toFixed(1));
              dl.setAttribute("y2", g.y.toFixed(1));
              dl.style.opacity = String(show * 0.6);
            }
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
          <SectionHead index={index} label={version ? `${sections.method.label} · version ${version}` : sections.method.label} title={sections.method.title} aside={sections.method.desc} />
        </div>
        <div ref={stage} className="pstage">
          <svg ref={svg} className="pline" aria-hidden>
            <path ref={shadow} className="pline-shadow" />
            {steps.map((st, k) => (
              <line
                key={st.title}
                ref={(el) => {
                  drops.current[k] = el;
                }}
                className="pline-drop"
              />
            ))}
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
