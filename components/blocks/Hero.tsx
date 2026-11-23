"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { hero, partners } from "@/content/copy";
import { prefersReducedMotion, ready } from "@/lib/motion";
import { LiveWord, type LiveOption } from "../motion/LiveWord";
import { Reveal } from "../motion/Reveal";
import { Stagger } from "../motion/Stagger";
import { TLink } from "../shell/TLink";
import { Arrow, CtaBody, Grad, IconGrid } from "./parts";

// Line icons for the words that change, one per option.
// Icons for the changing words in the lead, drawn like the button icons:
// hairlines on an 18-unit grid with small square nodes. One per word.
const nd = (x: number, y: number, z = 2.4) => <rect key={`n${x}-${y}`} x={x - z / 2} y={y - z / 2} width={z} height={z} fill="currentColor" stroke="none" />;
const G: Record<string, ReactNode> = {
  // stacked layers
  platforms: <g><path d="M9 2.5 15.5 6 9 9.5 2.5 6z" /><path d="M2.5 9.5 9 13l6.5-3.5" /><path d="M2.5 12.5 9 16l6.5-3.5" strokeDasharray="1.2 1.8" /></g>,
  // two screens, one behind the other
  products: <g><path d="M2.5 6.5h9v8h-9z" /><path d="M6 6.5V3.5h9.5v8h-4" strokeDasharray="1.2 1.6" />{nd(15.5, 3.5)}</g>,
  // a spark
  agents: <g><path d="M9 2.5v3M9 12.5v3M2.5 9h3M12.5 9h3" /><path d="M9 6 12 9 9 12 6 9z" />{nd(9, 9, 1.6)}</g>,
  // a service desk: a bell
  services: <g><path d="M3 13.5h12M4.5 13.5a4.5 4.5 0 0 1 9 0M9 6.5V5" />{nd(9, 4)}<path d="M2.5 15.5h13" strokeDasharray="1.2 1.6" /></g>,
  // a chart
  dashboards: <g><path d="M2.5 15.5h13M4.5 12.5l3.5-4 3 2.5 4-5.5" />{nd(4.5, 12.5)}{nd(15, 5.5)}</g>,
  // a list with ticks
  requirements: <g><path d="M7 4.5h8.5M7 9h8.5M7 13.5h6" />{nd(3.5, 4.5)}{nd(3.5, 9)}<path d="M2.5 13.5h2" strokeDasharray="1 1" /></g>,
  // steps joined by a path
  workflows: <g><path d="M3 4h4v4H3zM11 10h4v4h-4zM7 6h2.5a1.5 1.5 0 0 1 1.5 1.5V10" />{nd(13, 4)}<path d="M13 5.5V10" strokeDasharray="1.2 1.6" /></g>,
  // a loop of arrows
  processes: <g><path d="M14.5 7A6 6 0 0 0 3.5 6.5M3.5 11a6 6 0 0 0 11 .5" /><path d="M3.5 3v3.5H7M14.5 15v-3.5H11" />{nd(9, 9)}</g>,
  // a database
  data: <g><ellipse cx="9" cy="4.5" rx="5.5" ry="2" /><path d="M3.5 4.5v9c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2v-9" /><path d="M3.5 9c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2" strokeDasharray="1.2 1.6" /></g>,
  // a wrench
  tools: <g><path d="M11 3.5a3.5 3.5 0 0 0-3 5L3 13.5 4.5 15l5-5a3.5 3.5 0 0 0 5-3l-2 1-1.5-1.5 1-2z" />{nd(4, 14, 1.6)}</g>,
  // a window
  interfaces: <g><path d="M2.5 3.5h13v11h-13zM2.5 7h13" />{nd(4.75, 5.25, 1.4)}{nd(6.75, 5.25, 1.4)}<path d="M5 10h5M5 12h3" strokeDasharray="1.2 1.6" /></g>,
  // a phone
  apps: <g><path d="M5.5 2.5h7v13h-7z" /><path d="M8 13.5h2" />{nd(9, 4.5, 1.4)}</g>,
};
const liveOpts: LiveOption[][] = hero.live.map((list) => list.map((word) => ({ word, glyph: G[word] })));

// The lead, with the changing words set in. They change at different times.
function Lead() {
  const parts = hero.leadLive.split(/\{(\d)\}/);
  return (
    <Reveal as="p" className="hero-lead" delay={0.5} eager>
      {parts.map((p, k) =>
        k % 2 ? <LiveWord key={k} options={liveOpts[Number(p)]} period={3600} offset={1800 + Number(p) * 1200} /> : p,
      )}
    </Reveal>
  );
}

// On load, once the boot screen lifts: the gradient blooms, the header drops
// in, the two-line title rolls in letter by letter, then the description, the
// button and the logos follow.
// One screen, left-aligned: a short title in two lines (the first lighter),
// a short description under it and one button. Along the bottom, a line about
// who trusts us and the client logos. Behind it sits a grainy gradient that
// drifts slowly, lags behind the scroll and fades as the hero leaves.
export function Hero() {
  const bg = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const [inView, setIn] = useState(false);

  // The title arrives like every heading: line by line, each rising out of
  // its mask from blurred to sharp.
  useEffect(() => {
    if (prefersReducedMotion()) return setIn(true);
    ready.then(() => setIn(true));
  }, []);

  // Curtain: the hero holds still while the next section slides up over it.
  // The hero itself does not move back; only its content drifts up a little.
  useEffect(() => {
    const block = root.current?.closest<HTMLElement>(".block-hero");
    const next = block?.nextElementSibling as HTMLElement | null;
    if (!block || !next || prefersReducedMotion()) return;
    block.dataset.curtained = "";
    next.dataset.curtain = "dark";
    let raf = 0;
    let last = -1;
    const loop = () => {
      const h = block.offsetHeight;
      const y = Math.min(Math.max(0, window.scrollY), h);
      if (y !== last) {
        last = y;
        const t = y / Math.max(1, h);
        block.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
        block.style.setProperty("--covered", t.toFixed(3));
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      delete block.dataset.curtained;
      delete next.dataset.curtain;
      block.style.transform = "";
    };
  }, []);

  useEffect(() => {
    const el = bg.current;
    if (!el || prefersReducedMotion()) return;
    let raf = 0;
    const loop = () => {
      const h = el.offsetHeight || 1;
      const p = Math.min(1, Math.max(0, window.scrollY / h));
      if (p < 1) {
        el.style.transform = `translate3d(0, ${(p * h * 0.28).toFixed(1)}px, 0)`;
        el.style.opacity = String(1 - p * p * 0.9);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={root} className="hero">
      <div className="hero-bg-clip" aria-hidden>
        <div ref={bg} className="hero-bg">
          <i className="hero-blob hero-blob-a" />
          <i className="hero-blob hero-blob-b" />
          <i className="hero-blob hero-blob-c" />
          <span className="gg-grain" />
        </div>
      </div>
      <div className="hero-main container">
        <h1 className="hero-title" data-in={inView || undefined}>
          <span className="hl">
            <span className="hl-in">{hero.title[0]}</span>
          </span>{" "}
          <span className="hl hero-key">
            <span className="hl-in" style={{ transitionDelay: "0.16s" }}>{hero.title[1]}</span>
          </span>
        </h1>
        <Lead />
        <Stagger className="hero-actions" delay={0.8} each={0.14} margin="0px" whole>
          <TLink href="/case-studies/" className="cta">
            <CtaBody icon={<IconGrid />}>{hero.cta}</CtaBody>
          </TLink>
        </Stagger>
      </div>
      <Latest />
      <Partners />
    </div>
  );
}

// The newest case study, as a small card at the bottom right of the hero.
function Latest() {
  const c = hero.latest;
  return (
    <Reveal className="latest" delay={1.25} eager>
      <TLink href="/case-studies/" className="latest-card" aria-label={`${c.label}: ${c.client}, ${c.title}`}>
        <span className="latest-img">
          <Grad g={2} tag="span" parallax={false} />
        </span>
        <span className="latest-body">
          <span className="latest-meta label">{c.client}</span>
          <span className="latest-title">{c.title}</span>
          <span className="latest-foot">
            <span className="label">{c.meta}</span>
            <span className="latest-go" aria-hidden><Arrow /></span>
          </span>
        </span>
      </TLink>
    </Reveal>
  );
}

// Placeholder client logos: a simple mark and a wordmark each, in one colour.
// Swap for the real SVG logos when they arrive.
const marks: ReactNode[] = [
  <path key="0" d="M3 21 12 3l9 18zM12 12v9" />,
  <><circle key="a" cx="12" cy="12" r="9" /><circle key="b" cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" /></>,
  <path key="2" d="M3 3h8v8H3zM13 13h8v8h-8zM13 3h8v8M3 13v8h8" />,
  <path key="3" d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6 5.6 18.4" />,
  <><circle key="a" cx="9" cy="12" r="6" /><circle key="b" cx="15" cy="12" r="6" /></>,
  <path key="5" d="M3 20 9 5l3 8 3-8 6 15" />,
  <><path key="a" d="M4 4h16v16H4z" /><path key="b" d="M4 12h16M12 4v16" strokeDasharray="1.5 2.5" /></>,
  <path key="7" d="M4 20V4h9a5 5 0 0 1 0 10H4M10 14l8 6" />,
];

export function Partners() {
  const row = (hidden?: boolean) =>
    partners.map((p, i) => (
      <span key={`${p}-${hidden ? "b" : "a"}`} className="partner" aria-hidden={hidden || undefined}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          {marks[i % marks.length]}
        </svg>
        {p}
      </span>
    ));
  return (
    <Reveal className="partners container" delay={1.1} eager>
      <p className="partners-label">{hero.trust}</p>
      <div className="marquee">
        <div className="marquee-track">
          {row()}
          {row(true)}
        </div>
      </div>
    </Reveal>
  );
}
