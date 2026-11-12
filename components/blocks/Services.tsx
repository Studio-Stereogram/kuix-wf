"use client";
import { useEffect, useRef } from "react";
import { sections, services } from "@/content/copy";
import { prefersReducedMotion } from "@/lib/motion";
import { TLink } from "../shell/TLink";
import { CtaBody, IconPlus, SectionHead, ServiceIcon } from "./parts";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 4);
// Holds each card in focus for part of its scroll range.
const dwell = (x: number) => Math.floor(x) + smooth(0.18, 0.82, x - Math.floor(x));

const RAD = Math.PI / 180;
const SVH_PER_CARD = 65; // scroll length per card, in screen heights (%)
// Depth. A card away from the focus point swings back around its point on the
// wheel: it moves away from the viewer, leans back like the face of a drum,
// turns its far edge away and follows the slope of the circle.
const PERSPECTIVE = 1000; // px; smaller is a stronger perspective
const DEPTH = 2.6; // how far back a card goes, relative to how far it has moved round
const LEAN = 0.95; // drum lean (rotateX) per degree round the wheel
const TURN = 0.55; // far edge turning away (rotateY) per degree
const SLOPE = 0.38; // following the circle (rotateZ) per degree
const BLUR = 2.4; // px of blur for a card one step from focus

// One light screen, pinned while you scroll. Left: the section header,
// description and CTA, in a wide column. Right of it: a large wheel, of which
// only the right-hand arc is drawn, through the right half of the screen. Each service hangs off the
// wheel by a small node: an icon, a title and a description. Scrolling turns
// the wheel. The card at the rightmost point is in focus, flat and sharp; the
// ones before and after it sit further round, and so further back in space.
// Nothing of the wheel shows until the section has almost reached the top of
// the screen. Then the arc draws itself from the bottom and the cards ride up
// it into place. Scrolling back up plays this in reverse.
export function Services({ index }: { index: string }) {
  const pin = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const side = useRef<HTMLDivElement>(null);
  const arc = useRef<SVGPathElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const grad = useRef<SVGLinearGradientElement>(null);
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const n = services.length;

  useEffect(() => {
    const el = pin.current;
    const st = stage.current;
    if (!el || !st) return;
    const reduced = prefersReducedMotion();
    const narrow = window.matchMedia("(max-width: 767px)");
    // The wheel: centre, radius, the turn between two cards, and card sizes.
    let W = 0, H = 0, cx = 0, cy = 0, R = 1, step = 0.4, gap = 36, phone = false;
    let hs: number[] = [];
    let s = 0; // which card is in focus, eased
    let intro = reduced ? 1 : 0; // 0 hidden, 1 fully arrived
    let raf = 0;
    let last = performance.now();
    let sized = false;

    const measure = () => {
      phone = narrow.matches;
      W = st.clientWidth;
      H = st.clientHeight;
      if (!W || !H) return;
      const sr = side.current?.getBoundingClientRect();
      const s0 = st.getBoundingClientRect();
      const margin = sr ? sr.left - s0.left : 24;
      // On phones the wheel sits under the header and text.
      const top = phone && sr ? sr.bottom - s0.top + 12 : 0;
      gap = phone ? 22 : clamp(W * 0.025, 28, 44);
      // Where the wheel's rightmost point is: in the right half on desktop,
      // clear of the text column, and at the left edge on phones.
      const xf = phone ? margin + 4 : Math.max(W * 0.61, (sr ? sr.right - s0.left : 0) + W * 0.035);
      const cw = phone ? W - xf - gap - margin : Math.min(W - xf - gap - margin, 600);
      st.style.setProperty("--cw", `${cw.toFixed(1)}px`);
      st.style.setProperty("--gap", `${gap.toFixed(1)}px`);
      hs = cards.current.map((c) => (c ? c.offsetHeight : 0));
      const tall = Math.max(1, ...hs);
      R = phone ? (H - top) * 0.95 : H * 0.62;
      cx = xf - R;
      cy = phone ? top + (H - top) * 0.5 : H * 0.5 + 14;
      // Turn the wheel far enough per card that two neighbours never touch.
      step = Math.asin(clamp((tall * 0.9 + (phone ? 30 : 60)) / R, 0.2, 0.9));
      if (svg.current && arc.current) {
        svg.current.setAttribute("viewBox", `0 0 ${W} ${H}`);
        // Only the part of the right half that is on screen, from the bottom up.
        // On phones it stops under the text.
        const y0 = phone ? top - 4 : -24;
        const a0 = Math.asin(clamp((H + 24 - cy) / R, -1, 1));
        const a1 = Math.asin(clamp((y0 - cy) / R, -1, 1));
        let d = "";
        for (let k = 0; k <= 72; k++) {
          const a = a0 + ((a1 - a0) * k) / 72;
          d += `${k ? "L" : "M"}${(cx + R * Math.cos(a)).toFixed(1)} ${(cy + R * Math.sin(a)).toFixed(1)}`;
        }
        arc.current.setAttribute("d", d);
        // The line is strongest at the focus point and thins out towards the ends.
        grad.current?.setAttribute("y1", String(Math.max(0, y0)));
        grad.current?.setAttribute("y2", String(H));
      }
      sized = true;
      st.dataset.ready = "";
    };

    const draw = () => {
      if (arc.current) {
        arc.current.style.strokeDashoffset = String(1 - smooth(0, 0.8, intro));
        arc.current.style.opacity = String(smooth(0, 0.15, intro));
      }
      cards.current.forEach((c, i) => {
        if (!c) return;
        const u0 = i - s;
        // Arriving: each card starts further round the wheel, below the screen.
        const e = easeOut(intro * 1.35 - Math.max(0, u0) * 0.22);
        const u = u0 + (1 - e) * 1.15;
        const au = Math.abs(u);
        if (au > 2.3) {
          c.style.opacity = "0";
          c.style.visibility = "hidden";
          return;
        }
        const a = u * step;
        const deg = a / RAD;
        const x = cx + R * Math.cos(a);
        const y = cy + R * Math.sin(a);
        const near = smooth(0, 1, au);
        const tz = -(1 - Math.cos(a)) * R * DEPTH;
        // Cards dim as they leave focus and are gone before the next one round.
        // On phones a card that has passed must be gone before it reaches the text.
        const out = u < 0 && phone ? smooth(1.05, 1.4, au) : smooth(1.35, 2.1, au);
        const show = (1 - near * 0.58) * (1 - out) * smooth(0, 0.5, e);
        c.style.visibility = "visible";
        c.style.transform =
          `translate3d(${(x + gap).toFixed(1)}px, ${(y - (hs[i] || 0) / 2).toFixed(1)}px, 0) perspective(${PERSPECTIVE}px) ` +
          `translateZ(${tz.toFixed(1)}px) rotateZ(${(deg * SLOPE).toFixed(2)}deg) rotateX(${(-deg * LEAN).toFixed(2)}deg) rotateY(${(Math.abs(deg) * TURN).toFixed(2)}deg)`;
        c.style.opacity = show.toFixed(3);
        // In quarter-pixel steps, so the text is not redrawn on every frame.
        const blur = Math.round(Math.min(au, 2) * BLUR * 4) / 4;
        c.style.filter = blur ? `blur(${blur}px)` : "none";
        c.style.zIndex = String(20 - Math.round(au * 4));
        c.toggleAttribute("data-front", au < 0.5);
      });
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (sized && r.bottom > -vh * 0.3 && r.top < vh * 1.3) {
        const p = clamp01(-r.top / Math.max(1, r.height - vh));
        const target = dwell(clamp01((p - 0.04) / 0.9) * (n - 1) * 0.9999);
        if (reduced) {
          s = Math.round(target);
        } else {
          s += (target - s) * (1 - Math.exp(-dt * 7));
          // Arrive when the section is nearly at the top; leave again once it
          // has dropped back to the middle of the screen.
          const want = r.top < vh * 0.22 ? 1 : r.top > vh * 0.5 ? 0 : intro > 0.5 ? 1 : 0;
          intro = clamp01(intro + (want ? dt / 1.5 : -dt / 0.5));
        }
        draw();
      }
      raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(st);
    if (side.current) ro.observe(side.current);
    narrow.addEventListener("change", measure);
    measure();
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      narrow.removeEventListener("change", measure);
    };
  }, [n]);

  return (
    <div ref={pin} className="svc-pin" style={{ height: `${100 + (n - 1) * SVH_PER_CARD + 25}svh` }}>
      <div className="svc-sticky">
        <div ref={stage} className="svc-stage">
          <svg ref={svg} className="svc-arc" aria-hidden>
            <defs>
              <linearGradient ref={grad} id="svc-arc-fade" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopOpacity="0" />
                <stop offset="0.3" stopOpacity="0.55" />
                <stop offset="0.7" stopOpacity="0.55" />
                <stop offset="1" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path ref={arc} pathLength={1} stroke="url(#svc-arc-fade)" />
          </svg>
          <ol className="svc-cards">
            {services.map((s, i) => (
              <li
                key={s.title}
                ref={(el) => {
                  cards.current[i] = el;
                }}
                className="svc-card"
              >
                <ServiceIcon name={s.icon} className="svc-icon" />
                <h3 className="svc-title">{s.title}</h3>
                <p className="body">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="svc container">
          <div ref={side} className="svc-side">
            <SectionHead index={index} label={sections.services.label} title={sections.services.title} aside={sections.services.desc} className="shead-col" />
            <TLink href="/services/" className="cta cta-soft">
              <CtaBody icon={<IconPlus />}>Explore our services</CtaBody>
            </TLink>
          </div>
        </div>
      </div>
    </div>
  );
}
