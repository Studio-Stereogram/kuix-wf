"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { hero, partners } from "@/content/copy";
import { prefersReducedMotion, ready } from "@/lib/motion";
import { SwapWord, type SwapOption } from "../motion/SwapWord";
import { MaskText } from "../motion/MaskText";
import { Reveal } from "../motion/Reveal";
import { Stagger } from "../motion/Stagger";
import { TLink } from "../shell/TLink";
import { Arrow, CtaBody, Grad, IconGrid } from "./parts";

// Line icons for the words that change, one per option.
const GLYPHS_A: ReactNode[] = [
  <path key="p" d="M5 9h10v10H5zM9 5h10v10" />, // products: two stacked screens
  <path key="l" d="M12 4 3 8.5l9 4.5 9-4.5zM3 12.5l9 4.5 9-4.5M3 16.5 12 21l9-4.5" />, // platforms: layers
  <path key="i" d="M3 5h18v14H3zM3 9h18M6.5 7h.01M9 7h.01" />, // interfaces: a window
  <path key="s" d="M6 6h.01M18 6h.01M6 18h.01M18 18h.01M12 12h.01M6 6l6 6 6-6M6 18l6-6 6 6" />, // systems: nodes
  <path key="a" d="M12 3v4M12 17v4M3 12h4M17 12h4M12 8l1.5 2.5L16 12l-2.5 1.5L12 16l-1.5-2.5L8 12l2.5-1.5z" />, // agents: a spark
];
const GLYPHS_B: ReactNode[] = [
  <path key="w" d="M4 12.5 9.5 18 20 6" />, // work: a tick
  <path key="s" d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7" />, // scale: outwards
  <path key="l" d="M12 12c-2-3-6-3-6 0s4 3 6 0 4-3 6 0-4 3-6 0" />, // last: infinity
  <path key="h" d="M7 17 17 7M8 7h9v9" />, // ship: up and out
];
const optsA: SwapOption[] = hero.swapA.map((word, i) => ({ word, glyph: GLYPHS_A[i % GLYPHS_A.length], g: [0, 3, 5, 1, 4][i % 5] }));
const optsB: SwapOption[] = hero.swapB.map((word, i) => ({ word, glyph: GLYPHS_B[i % GLYPHS_B.length], g: [3, 0, 5, 1][i % 4] }));

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

  // Curtain: the hero holds still while the next section slides up over it,
  // sinking back a little as it is covered.
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
        block.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0) scale(${(1 - t * 0.06).toFixed(4)})`;
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
            <span className="hl-in">
              Digital <SwapWord options={optsA} label="What we build" />,
            </span>
          </span>{" "}
          <span className="hl hero-key">
            <span className="hl-in" style={{ transitionDelay: "0.16s" }}>
              built to <SwapWord options={optsB} label="What it does" />.
            </span>
          </span>
        </h1>
        <MaskText as="p" className="hero-lead" delay={0.5}>{hero.lead}</MaskText>
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
      <TLink href="/case-studies/" className="latest-card">
        <span className="latest-img">
          <Grad g={2} tag="span" parallax={false} />
          <span className="latest-tag label">{c.label}</span>
        </span>
        <span className="latest-body">
          <span className="latest-meta label">{c.client}</span>
          <span className="latest-title">{c.title}</span>
          <span className="latest-foot">
            <span className="label">{c.meta}</span>
            <Arrow />
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
