"use client";
import { useEffect, useRef } from "react";
import { industries, sections } from "@/content/copy";
import { prefersReducedMotion } from "@/lib/motion";
import { Reveal } from "../motion/Reveal";
import { TLink } from "../shell/TLink";
import { Arrow, Grad, SectionHead } from "./parts";

// Home: one pinned screen with the section header on top and the industry
// cards underneath. The cards hang on a thin thread that weaves up and down;
// scrolling pulls the thread sideways. Each card turns with its place on the
// screen, as if the row ran round the inside of a wide drum: flat in the
// middle, turned inwards at the sides, and tipped along the thread. A short
// caption sits under every card. The scroll ends when the last card is in.
function IndustriesTrack({ index }: { index: string }) {
  const pin = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const thread = useRef<SVGPathElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const n = industries.length;

  useEffect(() => {
    const reduced = prefersReducedMotion();
    let raf = 0;
    let travel = 0;
    let built = "";
    const measure = () => {
      const el = pin.current;
      const v = view.current;
      const t = track.current;
      const first = cards.current[0];
      const lastCard = cards.current[n - 1];
      if (!el || !v || !t || !first || !lastCard) return;
      // The row starts with the first card on the left margin and stops with
      // the last card on the right margin.
      const pad = parseFloat(getComputedStyle(t).paddingLeft) || 0;
      travel = Math.max(0, lastCard.offsetLeft + lastCard.offsetWidth + pad - v.clientWidth);
      el.style.height = `${travel + window.innerHeight}px`;

      // Thread: a smooth line through the middle of every card.
      const pts = cards.current.filter(Boolean).map((c) => ({ x: c!.offsetLeft + c!.offsetWidth / 2, y: c!.offsetTop + c!.offsetHeight / 2 }));
      const key = pts.map((q) => `${q.x | 0},${q.y | 0}`).join(" ");
      if (key !== built && thread.current && svg.current && pts.length > 1) {
        built = key;
        const gap = pts[1].x - pts[0].x;
        const all = [{ x: pts[0].x - gap, y: pts[1].y }, ...pts, { x: pts[n - 1].x + gap, y: pts[n - 2].y }];
        let d = `M${all[0].x} ${all[0].y}`;
        for (let i = 1; i < all.length; i++) {
          const a = all[i - 1];
          const b = all[i];
          const mx = (a.x + b.x) / 2;
          d += `C${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`;
        }
        svg.current.setAttribute("viewBox", `0 0 ${t.scrollWidth} ${t.clientHeight}`);
        svg.current.style.width = `${t.scrollWidth}px`;
        thread.current.setAttribute("d", d);
      }
    };
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener("resize", measure);
    measure();

    const loop = () => {
      const el = pin.current;
      const t = track.current;
      if (el && t) {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const vw = window.innerWidth;
        if (r.bottom > 0 && r.top < vh) {
          const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - vh)));
          const x = -p * travel;
          t.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
          cards.current.forEach((c, i) => {
            if (!c) return;
            // -1 at the left edge of the screen, 0 in the middle, 1 at the right.
            const u = Math.max(-1.4, Math.min(1.4, (c.offsetLeft + c.offsetWidth / 2 + x - vw / 2) / (vw / 2)));
            const turn = reduced ? 0 : -u * 22;
            const tip = reduced ? 0 : (i % 2 ? -1 : 1) * 2.2 + u * 1.5;
            const back = reduced ? 0 : -Math.abs(u) * 60;
            c.style.transform = `perspective(1400px) translateZ(${back.toFixed(1)}px) rotateY(${turn.toFixed(2)}deg) rotateZ(${tip.toFixed(2)}deg)`;
          });
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [n]);

  return (
    <div ref={pin} className="ind-pin">
      <div className="ind-sticky">
        <div className="container">
          <SectionHead index={index} label={sections.industries.label} title={sections.industries.title} aside={sections.industries.desc} />
        </div>
        <div ref={view} className="ind-view">
          <div ref={track} className="ind-track">
            <svg ref={svg} className="ind-thread" aria-hidden>
              <path ref={thread} />
            </svg>
            {industries.map((ind, i) => (
              <div key={ind.name} className="ind-item">
                <div
                  className="ind-card"
                  ref={(el) => {
                    cards.current[i] = el;
                  }}
                >
                  <Grad g={[2, 0, 4, 3, 5, 1][i % 6]} className="ind-card-bg" />
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
