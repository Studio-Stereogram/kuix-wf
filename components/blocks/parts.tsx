"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import gsap from "gsap";
import { ready, prefersReducedMotion } from "@/lib/motion";
import { MaskText } from "../motion/MaskText";
import { Reveal } from "../motion/Reveal";

export function Eyebrow({ index, children }: { index?: string; children: ReactNode }) {
  return (
    <Reveal className="idx">
      {index && <span className="accent">({index}) </span>}
      <span>{children}</span>
    </Reveal>
  );
}

// Section index label, e.g. "(04) WHAT WE OFFER". Set in JetBrains Mono.
export function Idx({ index, label, className }: { index: string; label: ReactNode; className?: string }) {
  return (
    <MaskText as="div" className={`idx ${className ?? ""}`}>
      <span className="accent">({index})</span> {label}
    </MaskText>
  );
}

// Every section opens the same way: a short index label, the section name as
// the H2 beneath it, and an optional description on the opposite side (under
// the title on phones). Descriptions are one or two short sentences.
export function SectionHead({
  index,
  label,
  title,
  aside,
  tag = "h2",
  className,
}: {
  index: string;
  label: string;
  title: ReactNode;
  aside?: ReactNode;
  tag?: "h1" | "h2";
  className?: string;
}) {
  return (
    <header className={`shead ${className ?? ""}`}>
      <div className="shead-title">
        <Idx index={index} label={label} />
        <MaskText as={tag} className="h2" chars>{title}</MaskText>
      </div>
      {aside && <MaskText as="p" className="shead-aside" delay={0.15}>{aside}</MaskText>}
    </header>
  );
}

// Inside of a CTA: a label pill and an icon pill drawn as one liquid shape
// (see the #kx-goo filter), with the text laid over it.
export function CtaBody({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <>
      <span className="cta-shape" aria-hidden>
        <span className="cta-a" />
        <span className="cta-b" />
      </span>
      <span className="cta-label">
        {typeof children === "string" ? <Scramble text={children} /> : children}
      </span>
      <span className="cta-icon" aria-hidden>{icon ?? <Arrow />}</span>
    </>
  );
}

// Button hover: the label clears, comes back as symbols and settles into the
// words again from left to right. The typeface is monospaced and the number of
// characters never changes, so the button keeps its width throughout.
const GLYPHS = "!+&%:;@^#*=?/<>XZQWHYT";
function Scramble({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    const host = el?.closest<HTMLElement>(".cta");
    const node = el?.firstChild;
    if (!el || !host || !node || prefersReducedMotion()) return;
    let raf = 0;
    const run = () => {
      cancelAnimationFrame(raf);
      const n = text.length;
      const t0 = performance.now();
      let swapped = 0;
      let noise: string[] = [];
      const frame = (now: number) => {
        const t = now - t0;
        // The symbols type in over the first part; the real letters follow.
        const typed = Math.min(n, Math.floor((t / 200) * n));
        const settled = clamp(Math.floor(((t - 150) / 420) * n), 0, n);
        if (now - swapped > 48) {
          noise = Array.from({ length: n }, () => GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
          swapped = now;
        }
        let out = "";
        for (let i = 0; i < n; i++) {
          const ch = text[i];
          out += ch === " " || i < settled ? ch : i < typed ? noise[i] : "\u00a0";
        }
        node.nodeValue = out;
        raf = settled < n ? requestAnimationFrame(frame) : 0;
      };
      raf = requestAnimationFrame(frame);
    };
    host.addEventListener("pointerenter", run);
    host.addEventListener("focus", run);
    return () => {
      cancelAnimationFrame(raf);
      host.removeEventListener("pointerenter", run);
      host.removeEventListener("focus", run);
      node.nodeValue = text;
    };
  }, [text]);
  return (
    <>
      <span className="sr-only">{text}</span>
      <span ref={ref} aria-hidden>{text}</span>
    </>
  );
}
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

// Counts up once it scrolls into view.
export function Counter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = String(value);
      return;
    }
    const o = { v: 0 };
    let tween: gsap.core.Tween | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      ready.then(() => {
        tween = gsap.to(o, {
          v: value,
          duration: 1.6,
          ease: "expo.out",
          onUpdate: () => {
            el.textContent = String(Math.round(o.v));
          },
        });
      });
    });
    io.observe(el);
    return () => {
      io.disconnect();
      tween?.kill();
    };
  }, [value, suffix]);
  return (
    <span>
      <span ref={ref}>0</span>
      {suffix && (
        <span className="counter-suffix" data-word={/[a-z]/i.test(suffix) || undefined}>
          {suffix}
        </span>
      )}
    </span>
  );
}

// Grainy gradient: the stand-in for every image until photography arrives.
// `g` picks one of six colour sets (see .gg in globals.css). The picture is cut
// larger than its frame and slides inside it with the scroll (see Parallax).
export function Grad({
  g = 0,
  className,
  style,
  parallax = 1,
  tag: Tag = "div",
}: {
  g?: number;
  className?: string;
  style?: CSSProperties;
  parallax?: number | false;
  tag?: "div" | "span";
}) {
  return (
    <Tag className={`gg ${className ?? ""}`} data-g={((g % 6) + 6) % 6} data-parallax={parallax === false ? undefined : parallax} style={style} aria-hidden>
      <Tag className="gg-art" />
      <Tag className="gg-grain" />
    </Tag>
  );
}

export function Placeholder({ g = 0, label, ratio = "4 / 3" }: { g?: number; label?: string; ratio?: string }) {
  return (
    <div className="ph" style={{ aspectRatio: ratio }}>
      <Grad g={g} className="ph-fill" />
      {label && <span className="ph-label label">{label}</span>}
    </div>
  );
}

// ---------- Button icons ----------
// Fine-line icons in the manner of a technical diagram: hairline strokes with
// small square nodes. Each CTA gets the one that says where it goes.
const icon = (name: string, children: ReactNode) =>
  function Icon() {
    return (
      <svg className="arrow" data-icon={name} width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.15" aria-hidden>
        {children}
      </svg>
    );
  };
const node = (x: number, y: number, s = 3) => <rect x={x - s / 2} y={y - s / 2} width={s} height={s} fill="currentColor" stroke="none" />;

export const Arrow = icon("up-right", <><path d="M5 13 13.5 4.5M7.5 4.5h6v6" />{node(4, 14)}</>);
export const IconArrowRight = icon("right", <><path d="M4.5 9h10.5M11 5l4 4-4 4" />{node(3, 9)}</>);
export const IconPlus = icon("plus", <><path d="M9 2.5v4M9 11.5v4M2.5 9h4M11.5 9h4" />{node(9, 9)}</>);
export const IconGrid = icon("grid", <><path d="M3 3h4.5v4.5H3zM10.5 3H15v4.5h-4.5zM3 10.5h4.5V15H3z" /><rect x="10.5" y="10.5" width="4.5" height="4.5" fill="currentColor" /></>);
export const IconChat = icon("chat", <><path d="M2.5 3.5h13v8.5H8.5l-3 3v-3h-3z" />{node(6, 7.75, 1.6)}{node(9, 7.75, 1.6)}{node(12, 7.75, 1.6)}</>);
export const IconSend = icon("send", <path d="M2.5 9 15.5 2.5 12 15.5 8.5 10.5zM8.5 10.5l7-8" />);
export const IconStack = icon("stack", <><path d="M9 2.5 15.5 6 9 9.5 2.5 6z" /><path d="M2.5 9.5 9 13l6.5-3.5" /><path d="M2.5 12.5 9 16l6.5-3.5" strokeDasharray="1.2 1.8" /></>);
export const IconPeople = icon("people", <><circle cx="6.5" cy="5.5" r="2.5" /><path d="M2 15c0-2.6 2-4.4 4.5-4.4S11 12.4 11 15" /><circle cx="12.75" cy="6.5" r="1.9" strokeDasharray="1.2 1.6" /><path d="M13.2 11c1.7.4 2.8 1.9 2.8 4" strokeDasharray="1.2 1.6" /></>);

// ---------- Method icons ----------
// One per step, drawn like small technical diagrams: 1px lines, dotted
// secondary lines, small square nodes.
const dim = { opacity: 0.5 };
const dots = { strokeDasharray: "1 3", strokeLinecap: "round" as const };
const sq = (x: number, y: number, s = 5, filled = true) => (
  <rect x={x - s / 2} y={y - s / 2} width={s} height={s} fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"} />
);

const methodIcons: Record<string, ReactNode> = {
  // Personas: one person in focus, two more sketched in beside them.
  personas: (
    <>
      <circle cx="48" cy="22" r="8" />
      <path d="M30 54c0-10 8-17 18-17s18 7 18 17" />
      <g style={dim} {...dots}>
        <circle cx="19" cy="29" r="6" />
        <path d="M7 54c0-7 5-12 12-12" />
        <circle cx="77" cy="29" r="6" />
        <path d="M89 54c0-7-5-12-12-12" />
      </g>
      <path d="M4 62h88" style={dim} />
      {sq(48, 62)}
    </>
  ),
  // User journeys: a route from start to finish through a few stops.
  journeys: (
    <>
      <path d="M10 52h14c11 0 11-30 22-30h4c11 0 11 22 22 22h12" />
      <path d="M10 52 84 44" style={dim} {...dots} />
      {sq(10, 52, 6)}
      <circle cx="24" cy="52" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="48" cy="22" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="72" cy="44" r="2.5" fill="currentColor" stroke="none" />
      {sq(86, 44, 6, false)}
      <path d="M4 62h88" style={dim} />
    </>
  ),
  // Features: a set of parts, one of them picked.
  features: (
    <>
      <g style={dim}>
        {[20, 38.5, 57, 75.5].map((x) => (
          <rect key={x} x={x - 5.5} y="10" width="11" height="11" />
        ))}
      </g>
      <g style={dim} {...dots}>
        {[20, 38.5, 57, 75.5].map((x) => (
          <path key={x} d={`M${x} 24v20`} />
        ))}
      </g>
      {[20, 38.5, 75.5].map((x) => (
        <rect key={x} x={x - 5.5} y="47" width="11" height="11" />
      ))}
      <rect x="51.5" y="47" width="11" height="11" fill="currentColor" />
    </>
  ),
  // Clear plan: staggered stages on a timeline with a milestone.
  plan: (
    <>
      <path d="M10 18h28M30 34h28M50 50h28" />
      {sq(10, 18)}
      {sq(30, 34)}
      {sq(50, 50)}
      {sq(80, 50, 6, false)}
      <path d="M58 8v54" style={dim} {...dots} />
      <path d="M55 8h6M58 5v6" />
      <path d="M4 62h88" style={dim} />
    </>
  ),
};

// ---------- Service icons ----------
// One per service, in the same manner as the method icons.
const serviceIcons: Record<string, ReactNode> = {
  // Discovery: a lens over the field, with the point it has found.
  discovery: (
    <>
      <circle cx="42" cy="30" r="15" />
      <path d="M53 41 68 56" />
      <circle cx="42" cy="30" r="25" style={dim} {...dots} />
      <path d="M42 9v7M42 44v7M21 30h7M56 30h7" style={dim} />
      {sq(42, 30)}
      {sq(70, 58, 6, false)}
      <path d="M4 62h60" style={dim} />
    </>
  ),
  // Planning: a board laid out in parts, one of them placed.
  planning: (
    <>
      <rect x="14" y="8" width="68" height="46" />
      <path d="M14 20h68M38 20v34" style={dim} />
      <path d="M46 30h28M46 38h20M46 46h24" style={dim} {...dots} />
      <rect x="20" y="27" width="12" height="12" fill="currentColor" stroke="none" />
      <rect x="20" y="43" width="12" height="6" style={dim} />
      {sq(82, 8, 5)}
      <path d="M4 62h88" style={dim} />
    </>
  ),
  // Implementation: code brackets around the part being built.
  implementation: (
    <>
      <path d="M30 16 12 34l18 18M66 16l18 18-18 18" />
      <path d="M56 10 40 58" style={dim} {...dots} />
      {sq(48, 34, 7)}
      <path d="M22 34h16M58 34h16" style={dim} />
      <path d="M4 62h88" style={dim} />
    </>
  ),
  // Maintenance: a loop that keeps running, with a steady pulse inside.
  maintenance: (
    <>
      <path d="M70 34a22 22 0 1 1-6.5-15.6" />
      <path d="M64.5 7.5v11h-11" />
      <circle cx="48" cy="34" r="30" style={dim} {...dots} />
      <path d="M33 34h7l4-8 5 16 4-8h8" style={dim} />
      {sq(70, 34)}
    </>
  ),
};

export function ServiceIcon({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={`micon ${className ?? ""}`} viewBox="0 0 96 68" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
      {serviceIcons[name]}
    </svg>
  );
}

export function MethodIcon({ name, className }: { name: string; className?: string }) {
  return (
    <svg className={`micon ${className ?? ""}`} viewBox="0 0 96 68" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
      {methodIcons[name]}
    </svg>
  );
}
