"use client";
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { people, type Author, type Who } from "@/content/feed";
import { KXMark } from "../shell/Logo";

export const INK = "35,38,26";
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const expoOut = (p: number) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p));
export const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// ready: the build-up has finished, posts may start arriving.
export const FeedContext = createContext<{ ready: boolean; filter: Who | null; setFilter: (w: Who | null) => void; goTo: (id: string) => void }>({
  ready: false,
  filter: null,
  setFilter: () => {},
  goTo: () => {},
});
// seen: this post has entered the screen once. Blocks inside start on it.
export const PostContext = createContext<{ seen: boolean }>({ seen: false });
export const usePost = () => useContext(PostContext);

// True while the element is on screen (or, with once, from the first time on).
export function useInView<T extends Element>(ref: RefObject<T | null>, { once = false, margin = "0px 0px -15% 0px", enabled = true } = {}) {
  const [inView, set] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          set(true);
          if (once) io.disconnect();
        } else if (!once) set(false);
      },
      { rootMargin: margin },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, once, margin, enabled]);
  return inView;
}

// Masked text. Every word sits in its own clipped box and rises into place
// when an ancestor gets data-in; words are delayed by the line they land on,
// so the text arrives line by line whatever the width. [Brackets] in the text
// mark the lead, set in full ink.
export function Mask({ text, as: Tag = "p", className, delay = 0, each = 0.07 }: { text: string; as?: "p" | "div" | "h2" | "h3" | "span"; className?: string; delay?: number; each?: number }) {
  const ref = useRef<HTMLElement>(null);
  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      let top: number | null = null;
      let line = -1;
      el.querySelectorAll<HTMLElement>(".w").forEach((w) => {
        if (w.offsetTop !== top) {
          top = w.offsetTop;
          line++;
        }
        (w.firstElementChild as HTMLElement).style.setProperty("--dl", `${(delay + line * each).toFixed(2)}s`);
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [text, delay, each]);

  const words = (t: string, key: string) =>
    t.split(/(\s+)/).map((part, i) =>
      /^\s*$/.test(part) ? (
        part ? " " : null
      ) : (
        <span key={`${key}-${i}`} className="w">
          <span className="wi">{part}</span>
        </span>
      ),
    );
  const T = Tag as "p";
  return (
    <T ref={ref as RefObject<HTMLParagraphElement>} className={`mask ${className ?? ""}`}>
      {text.split(/(\[[^\]]+\])/).map((part, i) =>
        part.startsWith("[") ? (
          <b key={i} className="lead">{words(part.slice(1, -1), `l${i}`)}</b>
        ) : (
          words(part, `t${i}`)
        ),
      )}
    </T>
  );
}

// A person's picture. With halftone it first appears as a screen of dots,
// grown from nothing, which then gives way to the photo.
export function Avatar({ who, size = 40, play = true, halftone = false, className }: { who: Author; size?: number; play?: boolean; halftone?: boolean; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const src = who === "kuix" ? null : people[who].img;

  useEffect(() => {
    const c = canvas.current;
    const im = img.current;
    if (!halftone || !play || !c || !im || !src) return;
    if (reducedMotion()) {
      im.style.opacity = "1";
      return;
    }
    let raf = 0;
    let dead = false;
    const source = new Image();
    source.onload = () => {
      const d = Math.min(2, window.devicePixelRatio || 1);
      const px = Math.round(size * d);
      const n = Math.max(8, Math.round(size / 3.4));
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
        const p = Math.min(1, (now - t0) / 1500);
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

  const style = { ["--s" as string]: `${size}px` } as CSSProperties;
  if (who === "kuix")
    return (
      <span className={`av av-kuix ${className ?? ""}`} data-on={play || undefined} style={style} aria-hidden>
        <KXMark size={Math.round(size * 0.46)} />
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

// A field of dots whose sizes come from a function of position and time. It
// only paints while it is on screen.
export type DotFn = (x: number, y: number, t: number, ratio: number) => number;
export function Dots({ fn, cell = 7, alpha = 0.4, className }: { fn: DotFn; cell?: number; alpha?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const visible = useInView(ref, { margin: "0px" });
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

// A number that counts up once `play` turns true.
export function Counter({ value, decimals = 0, suffix = "", play }: { value: number; decimals?: number; suffix?: string; play: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !play || reducedMotion()) return;
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / 1900);
      el.textContent = (value * expoOut(p)).toFixed(decimals) + suffix;
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [play, value, decimals, suffix]);
  return (
    <span ref={ref} className="num">
      {value.toFixed(decimals) + suffix}
    </span>
  );
}

// Typing dots, then the text.
export function Typing() {
  return (
    <span className="typing" aria-hidden>
      <i />
      <i />
      <i />
    </span>
  );
}
