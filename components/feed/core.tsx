"use client";
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { people, type Author } from "@/content/feed";
import { FoldMark } from "./Mark";

export const INK = "35,38,26";
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const expoOut = (p: number) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
export const vars = (v: Record<string, string | number>) => v as CSSProperties;

// ready: the build-up has finished, things may start arriving.
export const FeedContext = createContext<{ ready: boolean; goTo: (id: string) => void }>({ ready: false, goTo: () => {} });

// ---- Arriving. One shared observer tells each element the first time it
// comes on screen. Everything animates when it is itself visible, not when
// the post it belongs to is, so nothing plays out of sight further down.
const waiting = new WeakMap<Element, () => void>();
let observer: IntersectionObserver | null = null;
const watch = (el: Element, cb: () => void) => {
  observer ??= new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        waiting.get(e.target)?.();
        waiting.delete(e.target);
        observer?.unobserve(e.target);
      }),
    { rootMargin: "0px 0px -8% 0px" },
  );
  waiting.set(el, cb);
  observer.observe(el);
  return () => {
    waiting.delete(el);
    observer?.unobserve(el);
  };
};
export function useSeen<T extends Element>(ref: RefObject<T | null>, enabled = true) {
  const { ready } = useContext(FeedContext);
  const [seen, set] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !ready || !enabled || seen) return;
    return watch(el, () => set(true));
  }, [ref, ready, enabled, seen]);
  return seen;
}
// True while the element is on screen; for loops that should only run then.
export function useOnScreen<T extends Element>(ref: RefObject<T | null>) {
  const [on, set] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => set(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return on;
}

// ---- Text. All text on the page goes through T. It is split into the lines
// it actually breaks into at the current width; each line sits in its own
// clipped box and slides up into it, one line after the other. [Brackets]
// mark the lead of a paragraph, set in full ink.
// play: leave it out and the text arrives when it comes on screen; pass a
// boolean to decide from outside (false sends it back down).
type Word = { t: string; s: boolean };
type Tag = "span" | "p" | "div" | "h2" | "h3" | "b" | "figcaption" | "li";
export function T({ text, as = "span", className, delay = 0, play }: { text: string; as?: Tag; className?: string; delay?: number; play?: boolean }) {
  const ref = useRef<HTMLElement>(null);
  const own = useSeen(ref, play === undefined);
  const on = play ?? own;
  const [lines, setLines] = useState<Word[][] | null>(null);
  // The lines must be on the page, hidden, for a frame before they can rise.
  const [armed, setArmed] = useState(false);
  const width = useRef(0);
  const split = lines !== null;
  useEffect(() => {
    if (!split || armed) return;
    const id = requestAnimationFrame(() => setArmed(true));
    return () => cancelAnimationFrame(id);
  }, [split, armed]);

  const words: Word[] = [];
  text.split(/(\[[^\]]+\])/).forEach((part) => {
    const s = part.startsWith("[");
    (s ? part.slice(1, -1) : part).split(/\s+/).forEach((t) => t && words.push({ t, s }));
  });

  // Measure which words share a line, then render the lines.
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || lines) return;
    const out: Word[][] = [];
    let top: number | null = null;
    el.querySelectorAll<HTMLElement>(".tw").forEach((w, i) => {
      if (w.offsetTop !== top) {
        top = w.offsetTop;
        out.push([]);
      }
      out[out.length - 1].push(words[i]);
    });
    width.current = el.offsetWidth;
    setLines(out.length ? out : [words]);
  });
  useEffect(() => setLines(null), [text]);
  // A new width means new line breaks.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (Math.abs(el.offsetWidth - width.current) > 0.5) setLines(null);
    });
    ro.observe(el);
    const fonts = document.fonts;
    fonts?.ready.then(() => setLines(null));
    return () => ro.disconnect();
  }, []);

  const run = (ws: Word[], key: string) => {
    // Neighbouring words of the same kind are written as one run.
    const groups: Word[] = [];
    ws.forEach((w) => {
      const last = groups[groups.length - 1];
      if (last && last.s === w.s) last.t += ` ${w.t}`;
      else groups.push({ ...w });
    });
    return groups.map((g, i) => (
      <span key={`${key}-${i}`}>
        {i > 0 && " "}
        {g.s ? <b className="lead">{g.t}</b> : g.t}
      </span>
    ));
  };
  const Root = as as "span";
  return (
    <Root ref={ref as RefObject<HTMLSpanElement>} className={`t ${className ?? ""}`} data-lines={lines ? "" : undefined} data-in={(on && armed) || undefined} style={vars({ "--d": `${delay}s` })}>
      {lines
        ? lines.map((l, i) => (
            <span key={i} className="ln" style={vars({ "--l": i })}>
              <span className="ln-i">{run(l, `l${i}`)}</span>
            </span>
          ))
        : words.map((w, i) => (
            <span key={i}>
              {i > 0 && " "}
              <span className={w.s ? "tw lead" : "tw"}>{w.t}</span>
            </span>
          ))}
    </Root>
  );
}

// ---- Surfaces. A panel, picture or icon is uncovered by a wipe; a hairline
// draws across. kind picks which (see feed.css).
export function Rv({ children, as = "div", kind = "wipe", className, delay = 0, play, style, ...rest }: { children?: ReactNode; as?: "div" | "span" | "figure" | "ul" | "li"; kind?: "wipe" | "wipe-x" | "rule" | "pop"; className?: string; delay?: number; play?: boolean; style?: CSSProperties } & Record<string, unknown>) {
  const ref = useRef<HTMLElement>(null);
  const own = useSeen(ref, play === undefined);
  const Root = as as "div";
  return (
    <Root ref={ref as RefObject<HTMLDivElement>} className={`rv rv-${kind} ${className ?? ""}`} data-in={(play ?? own) || undefined} style={{ ...vars({ "--d": `${delay}s` }), ...style }} {...rest}>
      {children}
    </Root>
  );
}

// ---- A person's picture. With halftone it first appears as a screen of
// dots, grown from nothing, which then gives way to the photo.
export function Avatar({ who, size = 40, play = true, halftone = false, className }: { who: Author; size?: number; play?: boolean; halftone?: boolean; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const src = who === "kuix" ? null : people[who].img;

  useEffect(() => {
    const c = canvas.current;
    const im = img.current;
    if (!halftone || !play || !c || !im || !src) return;
    if (reducedMotion()) return void (im.style.opacity = "1");
    let raf = 0;
    let dead = false;
    const source = new Image();
    source.onload = () => {
      const d = Math.min(2, window.devicePixelRatio || 1);
      const px = Math.round(size * d);
      const n = Math.max(8, Math.round(size / 3));
      c.width = c.height = px;
      const off = document.createElement("canvas");
      off.width = off.height = n;
      const og = off.getContext("2d");
      const g = c.getContext("2d");
      if (!og || !g) return void (im.style.opacity = "1");
      og.drawImage(source, 0, 0, n, n);
      const data = og.getImageData(0, 0, n, n).data;
      const cell = px / n;
      const t0 = performance.now();
      const step = (now: number) => {
        if (dead) return;
        const p = Math.min(1, (now - t0) / 1400);
        const grow = expoOut(Math.min(1, p / 0.6));
        const fade = clamp((p - 0.5) / 0.5);
        g.clearRect(0, 0, px, px);
        g.fillStyle = `rgb(${INK})`;
        g.beginPath();
        for (let y = 0; y < n; y++)
          for (let x = 0; x < n; x++) {
            const i = (y * n + x) * 4;
            const lum = (data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11) / 255;
            const r = cell * 0.56 * (1 - lum * 0.9) * grow;
            if (r > 0.2) {
              const cx = (x + 0.5) * cell;
              const cy = (y + 0.5) * cell;
              g.moveTo(cx + r, cy);
              g.arc(cx, cy, r, 0, 6.2832);
            }
          }
        g.fill();
        c.style.opacity = String(1 - fade);
        im.style.opacity = String(fade);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    source.onerror = () => void (im.style.opacity = "1");
    source.src = src;
    return () => {
      dead = true;
      cancelAnimationFrame(raf);
    };
  }, [halftone, play, src, size]);

  const style = vars({ "--s": `${size}px` });
  if (who === "kuix")
    return (
      <span className={`av av-kuix ${className ?? ""}`} data-on={play || undefined} style={style} aria-hidden>
        <FoldMark size={Math.round(size * 0.5)} bg="#23261a" ink="#f2f1ec" />
      </span>
    );
  return (
    <span className={`av ${className ?? ""}`} data-who={who} data-on={play || undefined} style={style} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img ref={img} src={src!} alt="" width={size} height={size} style={halftone ? { opacity: 0 } : undefined} />
      {halftone && <canvas ref={canvas} />}
    </span>
  );
}

// ---- A field of dots whose sizes come from a function of position and
// time. It only paints while it is on screen.
export type DotFn = (x: number, y: number, t: number, ratio: number) => number;
export function Dots({ fn, cell = 7, alpha = 0.4, className }: { fn: DotFn; cell?: number; alpha?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const visible = useOnScreen(ref);
  useEffect(() => {
    const c = ref.current;
    if (!c || !visible) return;
    const g = c.getContext("2d");
    if (!g) return;
    const d = Math.min(2, window.devicePixelRatio || 1);
    const size = () => {
      c.width = Math.round(c.offsetWidth * d);
      c.height = Math.round(c.offsetHeight * d);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(c);
    const still = reducedMotion();
    let raf = 0;
    const t0 = performance.now();
    const draw = (now: number) => {
      const W = c.width;
      const H = c.height;
      const s = cell * d;
      const t = still ? 0 : (now - t0) / 1000;
      g.clearRect(0, 0, W, H);
      g.fillStyle = `rgba(${INK},${alpha})`;
      g.beginPath();
      for (let y = s / 2; y < H; y += s)
        for (let x = s / 2; x < W; x += s) {
          const v = fn(x / W, y / H, t, W / H);
          if (v > 0.04) {
            const r = s * 0.48 * v;
            g.moveTo(x + r, y);
            g.arc(x, y, r, 0, 6.2832);
          }
        }
      g.fill();
      if (!still) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [fn, cell, alpha, visible]);
  return <canvas ref={ref} className={className} aria-hidden />;
}

// The loader, and the same ring of dots wherever KUIX needs a glyph.
export const ring: DotFn = (x, y, t) => {
  const d = Math.abs(Math.hypot(x - 0.5, y - 0.5) - 0.3);
  return d < 0.1 ? 0.5 + 0.5 * Math.sin(Math.atan2(y - 0.5, x - 0.5) * 3 + t * 2.4) ** 2 : 0;
};
// Slow weather: clouds of dots drifting across a wide band.
export const weather: DotFn = (x, y, t, ratio) => {
  const n = Math.sin(x * 2 * ratio + t * 0.22) + Math.sin(y * 5.3 - t * 0.17 + x * 2.2 * ratio * 0.4) + Math.sin((x * ratio * 0.5 + y) * 4.2 + t * 0.12);
  return clamp((n - 0.1) / 2.4);
};

// ---- A number that rises out of its line and counts up as it does.
export function Counter({ value, decimals = 0, suffix = "", className }: { value: number; decimals?: number; suffix?: string; className?: string }) {
  const root = useRef<HTMLSpanElement>(null);
  const num = useRef<HTMLSpanElement>(null);
  const seen = useSeen(root);
  useEffect(() => {
    const el = num.current;
    if (!el || !seen || reducedMotion()) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 1800);
      el.textContent = (value * expoOut(p)).toFixed(decimals) + suffix;
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [seen, value, decimals, suffix]);
  return (
    <span ref={root} className={`t num ${className ?? ""}`} data-lines="" data-in={seen || undefined}>
      <span className="ln">
        <span ref={num} className="ln-i">
          {value.toFixed(decimals) + suffix}
        </span>
      </span>
    </span>
  );
}

export function Typing({ on }: { on: boolean }) {
  return (
    <span className="typing" data-on={on || undefined} aria-hidden>
      <i />
      <i />
      <i />
    </span>
  );
}
