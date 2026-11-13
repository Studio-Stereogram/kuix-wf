"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { hero, partners } from "@/content/copy";
import { prefersReducedMotion } from "@/lib/motion";
import { MaskText } from "../motion/MaskText";
import { Rotator } from "../motion/Rotator";
import { Reveal } from "../motion/Reveal";
import { Stagger } from "../motion/Stagger";
import { TLink } from "../shell/TLink";
import { CtaBody, IconGrid } from "./parts";

// On load, once the boot screen lifts: the gradient blooms from the middle, the
// header drops in, the title rolls in letter by letter, its last line (a word
// that keeps changing) rises into place, then the two buttons, the scroll
// indicator and the logos follow.
// One screen: the statement centred, the two CTAs under it, a scroll indicator
// and the client logos along the bottom. Behind it sits a grainy gradient (off-white running
// into blue and orange) that drifts slowly, lags behind the scroll and fades
// as the hero leaves. It is a stand-in until the 3D background arrives.
export function Hero() {
  const bg = useRef<HTMLDivElement>(null);

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

  // The title line by line. Words in [brackets] take the key colour.
  const title = hero.lines.map((line, i) => (
    <span key={i} className="hero-line">
      {line.split(/(\[[^\]]+\])/).map((part, j) =>
        part.startsWith("[") ? (
          <span key={j} className="hero-key">{part.slice(1, -1)}</span>
        ) : (
          // A | is a line break on phones only.
          part.split("|").flatMap((t, k) => (k ? [<br key={`${j}-${k}`} className="hero-br-m" />, t] : [t]))
        ),
      )}{" "}
    </span>
  ));

  return (
    <div className="hero">
      <div className="hero-bg-clip" aria-hidden>
        <div ref={bg} className="hero-bg">
          <i className="hero-blob hero-blob-a" />
          <i className="hero-blob hero-blob-b" />
          <i className="hero-blob hero-blob-c" />
          <span className="gg-grain" />
        </div>
      </div>
      <div className="hero-main container">
        {/* The last line of the title is a word that changes. */}
        <h1 className="hero-title">
          <MaskText as="span" className="hero-title-in" chars>{title}</MaskText>
          <Rotator items={hero.rotate} className="hero-key" delay={0.75} />
        </h1>
        <Stagger className="hero-actions" delay={0.85} each={0.14} margin="0px" whole>
          <TLink href="/contact/" className="cta">
            <CtaBody>Start a project</CtaBody>
          </TLink>
          <TLink href="/case-studies/" className="cta cta-soft">
            <CtaBody icon={<IconGrid />}>Selected work</CtaBody>
          </TLink>
        </Stagger>
      </div>
      <Reveal className="hero-scroll" delay={1.2} y={0} eager aria-hidden>
        <span className="label">Scroll</span>
        <span className="hero-scroll-line" />
      </Reveal>
      <Partners />
    </div>
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
      <span className="label partners-label">Worked with</span>
      <div className="marquee">
        <div className="marquee-track">
          {row()}
          {row(true)}
        </div>
      </div>
    </Reveal>
  );
}
