"use client";
import { useEffect, useRef } from "react";
import { industries, sections } from "@/content/copy";
import { slug } from "@/content/site";
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

const RAD = Math.PI / 180;
// Reference width: on wider screens the cards fade and blur over the same
// share of the screen as they do here, instead of after the same number of
// steps (which on a wide screen is only a short way from the middle).
const REF_W = 1140;
// Depth, as on the services wheel. A card away from the bottom of the arc
// moves back from the viewer, follows the slope of the arc, turns its outer
// edge away and softens.
const PERSPECTIVE = 1100; // px; smaller is a stronger perspective
const DEPTH = 4; // how far back a card goes, relative to how far it has risen
const SLOPE = 1.35; // following the arc (rotateZ) per degree round it
const TURN = 1.9; // outer edge turning away (rotateY) per degree, so the inner (taller) edge faces the card in focus
const BLUR = 2; // px of blur for a card one step from the middle
// At the start of the row the first card does not sit in the middle: it rests
// this many steps to the left, with the second card coming in on the right.
// From the second card on, the card in focus is in the middle. Phones show one
// card at a time, so the offset there is small.
const START_WIDE = 0.42;
const START_PHONE = 0.14;

// Home: one pinned screen with the section header on top and the industries
// underneath, on a wide, shallow arc that hangs like a bowl: lowest in the
// middle of the screen, rising towards both edges. Dragging (mouse, pen or a
// finger) carries the cards along it, and a flick keeps them going for a
// moment before they settle with one card in the middle: a card comes down one side, is flat, sharp and
// largest at the bottom, and goes up the other side. On the way it follows the
// slope of the arc, turns away and drops back, so the row reads as a wheel
// seen from the front rather than a flat strip. A short caption travels under
// every card.
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
    // The arc: centre (above the cards), radius and the turn between two cards.
    let W = 0, H = 0, R = 1, cy = 0, step = 0.5, iw = 0, cardH = 0;
    let START = window.innerWidth < 768 ? START_PHONE : START_WIDE;
    let s = START; // which card is at the bottom, eased
    let pos = START; // where the drag puts it
    let gapPx = 48;
    // Width of one step in px, measured at the reference screen width, so a
    // card is in the same place on every screen.
    let unit = 1;
    let raf = 0;
    let last = performance.now();
    let sized = false;

    const measure = () => {
      const was = START;
      START = window.innerWidth < 768 ? START_PHONE : START_WIDE;
      if (pos === was) pos = START;
      const first = items.current[0];
      W = v.clientWidth;
      H = v.clientHeight;
      if (!W || !H || !first) return;
      iw = first.offsetWidth;
      const ih = first.offsetHeight;
      cardH = (first.firstElementChild as HTMLElement | null)?.offsetHeight ?? ih * 0.7;
      // A shallow arc, nearly twice as wide as the screen: between the middle
      // and the edges of the screen it rises by about a seventh of the
      // screen's half-width.
      const gap = clamp(W * 0.045, 24, 84);
      gapPx = gap;
      R = clamp(W * 1.8, iw * 2.5, 3600);
      step = Math.min(0.6, (iw + gap) / R);
      // The card in the middle sits as low in the stage as its caption
      // allows; its neighbours are a little higher and stay clear of the
      // header above.
      const free = Math.max(0, H - ih);
      const top = Math.max(0, free - clamp(H * 0.05, 16, 44));
      cy = top + cardH / 2 - R;
      if (svg.current && thread.current) {
        svg.current.setAttribute("viewBox", `0 0 ${W} ${H}`);
        let d = "";
        for (let k = 0; k <= 80; k++) {
          const a = (-60 + (120 * k) / 80) * RAD;
          d += `${k ? "L" : "M"}${(W / 2 + R * Math.sin(a)).toFixed(1)} ${(cy + R * Math.cos(a)).toFixed(1)}`;
        }
        thread.current.setAttribute("d", d);
      }
      // How far, as a share of half the screen, a card one step from the
      // middle sits on a 1140px screen; used to fade cards by screen position.
      const rw = Math.min(W, REF_W);
      const riw = clamp(rw * 0.27, 250, 420);
      const rR = clamp(rw * 1.8, riw * 2.5, 3600);
      const rstep = Math.min(0.6, (riw + clamp(rw * 0.045, 24, 84)) / rR);
      unit = (rR * Math.sin(rstep)) / (rw / 2);
      sized = true;
      v.dataset.ready = "";
    };

    const draw = () => {
      // The point the cards fade and blur away from: the first card while the
      // row is at its start, the middle of the screen from the second card on.
      const start = clamp01((1 - s) / (1 - START)); // 1 at the start of the row, 0 from the second card on
      const fu = -START * start;
      const fx = W / 2 + R * Math.sin(fu * step);
      items.current.forEach((it, i) => {
        if (!it) return;
        const u = i - s;
        if (Math.abs(u) > 3.4) {
          it.style.visibility = "hidden";
          return;
        }
        const a = u * step;
        const deg = a / RAD;
        const x = W / 2 + R * Math.sin(a);
        const y = cy + R * Math.cos(a);
        const tz = -(1 - Math.cos(a)) * R * DEPTH;
        // Distance from the focus point in "steps of a 1140px screen".
        const au = Math.abs(x - fx) / (W / 2) / unit;
        if (Math.abs(x - W / 2) / (W / 2) / unit > 2.4) {
          it.style.visibility = "hidden";
          return;
        }
        it.style.visibility = "visible";
        it.style.transform =
          `translate3d(${(x - iw / 2).toFixed(1)}px, ${(y - cardH / 2).toFixed(1)}px, 0) perspective(${PERSPECTIVE}px) ` +
          `translateZ(${tz.toFixed(1)}px) rotateZ(${(-deg * SLOPE).toFixed(2)}deg) rotateY(${(deg * TURN).toFixed(2)}deg)`;
        // Full in the middle, about half one step away, and almost gone at the
        // edges of the screen. The card stays opaque (a veil of the page
        // colour dims it), so the arc line never shows through it.
        // Fading is measured from the middle of the screen, shifted out by the
        // start offset while the row is at its start, so the card on the far
        // right is as visible then as a neighbour is later.
        const ac = Math.abs(x - W / 2) / (W / 2) / unit;
        const off = START * start;
        it.style.setProperty("--fade", (1 - smooth(0.35 + off, 1.8 + off, ac)).toFixed(3));
        // In quarter-pixel steps, so the cards are not redrawn on every frame.
        const blur = Math.round(Math.max(0, Math.min(au, 2) - 0.25) * BLUR * 4) / 4;
        it.style.filter = blur ? `blur(${blur}px)` : "none";
        it.style.zIndex = String(20 - Math.round(au * 4));
        it.style.setProperty("--near", (1 - smooth(0.15, 0.8, au)).toFixed(3));
        it.toggleAttribute("data-front", au < 0.5);
      });
    };

    // ---- Drag ----
    let dragging = false;
    let moved = 0;
    let lastX = 0;
    let lastT = 0;
    let vel = 0; // cards per second
    let coasting = false;
    const perPx = () => 1 / Math.max(1, iw + gapPx);
    const bound = (x: number) => clamp(x, START - 0.35, n - 1 + 0.35);
    // Resting places: the start position, then one per card from the second on.
    const rest = (x: number) => {
      const k = clamp(Math.round(x), 0, n - 1);
      return k === 0 ? START : k;
    };
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      dragging = true;
      coasting = false;
      moved = 0;
      vel = 0;
      lastX = e.clientX;
      lastT = performance.now();
      v.dataset.dragging = "";
    };
    const move = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const now = performance.now();
      const dt = Math.max(1, now - lastT) / 1000;
      lastX = e.clientX;
      lastT = now;
      moved += Math.abs(dx);
      if (moved > 6 && !v.hasPointerCapture(e.pointerId)) v.setPointerCapture(e.pointerId);
      const d = -dx * perPx();
      pos = bound(pos + d);
      vel = vel * 0.6 + (d / dt) * 0.4;
    };
    const up = () => {
      if (!dragging) return;
      dragging = false;
      delete v.dataset.dragging;
      coasting = true;
    };
    // A drag is not a click on the card under it.
    const click = (e: MouseEvent) => {
      if (moved > 6) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    // Sideways trackpad swipes move the row too; vertical scrolling is left
    // to the page.
    let wheelT = 0;
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      pos = bound(pos + e.deltaX * perPx());
      coasting = false;
      window.clearTimeout(wheelT);
      wheelT = window.setTimeout(() => {
        vel = 0;
        coasting = true;
      }, 140);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      pos = rest(Math.round(pos) + (e.key === "ArrowRight" ? 1 : -1));
      coasting = false;
    };
    v.addEventListener("pointerdown", down);
    v.addEventListener("pointermove", move);
    v.addEventListener("pointerup", up);
    v.addEventListener("pointercancel", up);
    v.addEventListener("lostpointercapture", up);
    v.addEventListener("click", click, true);
    v.addEventListener("wheel", wheel, { passive: false });
    v.addEventListener("keydown", key);

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (coasting) {
        // Keep going with the flick, slowing down, then settle on a card.
        pos = bound(pos + vel * dt);
        vel *= Math.exp(-dt * 5);
        if (Math.abs(vel) < 0.6) {
          const snap = rest(pos + vel * 0.15);
          pos += (snap - pos) * (1 - Math.exp(-dt * 9));
          if (Math.abs(snap - pos) < 0.001) {
            pos = snap;
            coasting = false;
          }
        }
      }
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (sized && r.bottom > -vh * 0.3 && r.top < vh * 1.3) {
        // As the section comes up the screen, the row swings in from the right.
        const lead = reduced ? 0 : clamp01(r.top / vh) * 1.2;
        const target = pos - lead;
        s = reduced ? target : s + (target - s) * (1 - Math.exp(-dt * 9));
        // Land exactly, so the cards either side are true mirror images.
        if (Math.abs(target - s) < 0.002) s = target;
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
      window.clearTimeout(wheelT);
      ro.disconnect();
      v.removeEventListener("pointerdown", down);
      v.removeEventListener("pointermove", move);
      v.removeEventListener("pointerup", up);
      v.removeEventListener("pointercancel", up);
      v.removeEventListener("lostpointercapture", up);
      v.removeEventListener("click", click, true);
      v.removeEventListener("wheel", wheel);
      v.removeEventListener("keydown", key);
    };
  }, [n]);

  return (
    <div ref={pin} className="ind-pin">
      <div className="ind-sticky">
        <div className="container">
          <SectionHead index={index} label={sections.industries.label} title={sections.industries.title} aside={sections.industries.desc} />
        </div>
        <div ref={view} className="ind-view" data-cursor-label="Drag" tabIndex={0} role="region" aria-label="Industries, drag or use the arrow keys">
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
                <TLink href={`/industries/${slug(ind.name)}/`} className="ind-card-link">
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
              <TLink href={`/industries/${slug(ind.name)}/`} className="industry-link">
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
