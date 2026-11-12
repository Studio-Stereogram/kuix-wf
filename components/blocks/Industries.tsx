"use client";
import { useEffect, useRef } from "react";
import { industries, sections } from "@/content/copy";
import { prefersReducedMotion } from "@/lib/motion";
import { Reveal } from "../motion/Reveal";
import { TLink } from "../shell/TLink";
import { Arrow, Grad, SectionHead } from "./parts";

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// Holds each card at the top of the arch for part of its scroll range.
const dwell = (x: number) => Math.floor(x) + smooth(0.15, 0.85, x - Math.floor(x));

const RAD = Math.PI / 180;
const SVH_PER_CARD = 60; // scroll length per card, in screen heights (%)
// Depth, as on the services wheel. A card away from the top of the arch moves
// back from the viewer, follows the slope of the arch, turns its outer edge
// away and softens.
const PERSPECTIVE = 1100; // px; smaller is a stronger perspective
const DEPTH = 1.5; // how far back a card goes, relative to how far it has dropped
const SLOPE = 0.62; // following the arch (rotateZ) per degree round it
const TURN = 0.7; // outer edge turning away (rotateY) per degree
const BLUR = 2; // px of blur for a card one step from the top

// Home: one pinned screen with the section header on top and the industries
// underneath, on a wide arch. Scrolling carries them along it from right to
// left: a card rises up one side, is flat, sharp and largest at the top, and
// goes down the other side. On the way it follows the slope of the arch,
// turns away and drops back, so the row reads as a wheel seen from the front
// rather than a flat strip. A short caption travels under every card.
function IndustriesTrack({ index }: { index: string }) {
  const pin = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const thread = useRef<SVGPathElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const n = industries.length;

  useEffect(() => {
    const el = pin.current;
    const v = view.current;
    if (!el || !v) return;
    const reduced = prefersReducedMotion();
    // The arch: centre, radius and the turn between two cards.
    let W = 0, H = 0, R = 1, cy = 0, step = 0.5, iw = 0, cardH = 0;
    let s = 0; // which card is at the top, eased
    let raf = 0;
    let last = performance.now();
    let sized = false;

    const measure = () => {
      const first = items.current[0];
      W = v.clientWidth;
      H = v.clientHeight;
      if (!W || !H || !first) return;
      iw = first.offsetWidth;
      const ih = first.offsetHeight;
      cardH = (first.firstElementChild as HTMLElement | null)?.offsetHeight ?? ih * 0.7;
      // Half a circle would need more height than a screen has, so the radius
      // is as small as it can be while two neighbours still clear each other.
      const gap = clamp(W * 0.045, 24, 84);
      R = clamp(W * 0.52, iw * 1.3, 1040);
      step = Math.min(0.82, (iw + gap) / R);
      // The card at the top sits high in the stage; its neighbours hang lower.
      const top = Math.max(6, (H - ih) * 0.22);
      cy = top + cardH / 2 + R;
      if (svg.current && thread.current) {
        svg.current.setAttribute("viewBox", `0 0 ${W} ${H}`);
        let d = "";
        for (let k = 0; k <= 80; k++) {
          const a = (-100 + (200 * k) / 80) * RAD;
          d += `${k ? "L" : "M"}${(W / 2 + R * Math.sin(a)).toFixed(1)} ${(cy - R * Math.cos(a)).toFixed(1)}`;
        }
        thread.current.setAttribute("d", d);
      }
      sized = true;
      v.dataset.ready = "";
    };

    const draw = () => {
      items.current.forEach((it, i) => {
        if (!it) return;
        const u = i - s;
        const au = Math.abs(u);
        if (au > 2.4) {
          it.style.visibility = "hidden";
          return;
        }
        const a = u * step;
        const deg = a / RAD;
        const x = W / 2 + R * Math.sin(a);
        const y = cy - R * Math.cos(a);
        const tz = -(1 - Math.cos(a)) * R * DEPTH;
        it.style.visibility = "visible";
        it.style.transform =
          `translate3d(${(x - iw / 2).toFixed(1)}px, ${(y - cardH / 2).toFixed(1)}px, 0) perspective(${PERSPECTIVE}px) ` +
          `translateZ(${tz.toFixed(1)}px) rotateZ(${(deg * SLOPE).toFixed(2)}deg) rotateY(${(-deg * TURN).toFixed(2)}deg)`;
        it.style.opacity = (1 - smooth(0.2, 1.6, au) * 0.6).toFixed(3);
        // In quarter-pixel steps, so the cards are not redrawn on every frame.
        const blur = Math.round(Math.max(0, Math.min(au, 2) - 0.25) * BLUR * 4) / 4;
        it.style.filter = blur ? `blur(${blur}px)` : "none";
        it.style.zIndex = String(20 - Math.round(au * 4));
        it.style.setProperty("--near", (1 - smooth(0.15, 0.8, au)).toFixed(3));
        it.toggleAttribute("data-front", au < 0.5);
      });
    };

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (sized && r.bottom > -vh * 0.3 && r.top < vh * 1.3) {
        const p = clamp01(-r.top / Math.max(1, r.height - vh));
        // Before the section pins, the row is still swinging in from the right.
        const lead = reduced ? 0 : clamp01(r.top / vh) * 1.2;
        const target = dwell(clamp01((p - 0.03) / 0.92) * (n - 1) * 0.9999) - lead;
        s = reduced ? Math.round(target) : s + (target - s) * (1 - Math.exp(-dt * 7));
        draw();
      }
      raf = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(measure);
    ro.observe(v);
    if (items.current[0]) ro.observe(items.current[0]);
    measure();
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [n]);

  return (
    <div ref={pin} className="ind-pin" style={{ height: `${100 + (n - 1) * SVH_PER_CARD + 20}svh` }}>
      <div className="ind-sticky">
        <div className="container">
          <SectionHead index={index} label={sections.industries.label} title={sections.industries.title} aside={sections.industries.desc} />
        </div>
        <div ref={view} className="ind-view">
          <svg ref={svg} className="ind-thread" aria-hidden>
            <path ref={thread} />
          </svg>
          {industries.map((ind, i) => (
            <div
              key={ind.name}
              className="ind-item"
              ref={(el) => {
                items.current[i] = el;
              }}
            >
              <div className="ind-card">
                <Grad g={[2, 0, 4, 3, 5, 1][i % 6]} className="ind-card-bg" parallax={false} />
                <TLink href="/industries/" className="ind-card-link">
                  <span className="ind-card-top label">
                    <span>({String(i + 1).padStart(2, "0")})</span>
                    <Arrow />
                  </span>
                  <h3 className="ind-name">{ind.name}</h3>
                </TLink>
              </div>
              <p className="ind-cap">
                <span className="label">{String(ind.count).padStart(2, "0")} projects</span>
                <span className="body">{ind.body}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Industries({ index, detailed = false }: { index: string; detailed?: boolean }) {
  if (!detailed) return <IndustriesTrack index={index} />;
  return (
    <div className="industries container">
      <ul className="industry-list" data-detailed>
        {industries.map((ind, i) => (
          <li key={ind.name} className="industry-row">
            <Reveal delay={i * 0.05}>
              <TLink href="/industries/" className="industry-link">
                <span className="industry-name">{ind.name}</span>
                <span className="industry-body body">{ind.body}</span>
                <span className="label industry-count">{String(ind.count).padStart(2, "0")} projects</span>
                <Arrow />
              </TLink>
            </Reveal>
          </li>
        ))}
      </ul>
    </div>
  );
}
