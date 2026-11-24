"use client";
// The KUIX mark, as the kuix-branding project defines it: a grid-based K whose
// square position is a K + X and whose stretched position is a long-bridged
// K. The frames of that stretch (content/mark-frames.json) are generated from
// the branding project's own geometry, so every edge stays at 45° or 90°.
//
// Finish. "fold" is the Fold finish with the Rising layer order: the falling
// arm at the back, the spine over it, the rising arm in front, each arm with
// a gradient along its own stroke mixed between the ground and the mark
// colour. "flat" is one solid shape in the current text colour.
//
// Motion follows the branding project too: hold, morph, hold, morph back, on
// one clock shared by every mark on the page.
import { useEffect, useId, useRef, useState } from "react";
import data from "@/content/mark-frames.json";
import { reducedMotion, useOnScreen } from "./core";

type P = [number, number];
type Frame = { w: number; h: number; o: string; b: string; s: string; f: string; eb: P[]; ef: P[] };
const FRAMES = data as unknown as Frame[];
export const LAST = FRAMES.length - 1;

type RGB = [number, number, number];
const rgb = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)) as RGB;
const tone = (bg: RGB, ink: RGB, t: number) => `rgb(${bg.map((v, i) => Math.round(v + (ink[i] - v) * t)).join(",")})`;

type Tick = (t: number) => void;
const subs = new Set<Tick>();
let raf = 0;
const loop = (now: number) => {
  subs.forEach((f) => f(now / 1000));
  raf = subs.size ? requestAnimationFrame(loop) : 0;
};
const subscribe = (f: Tick) => {
  subs.add(f);
  if (!raf) raf = requestAnimationFrame(loop);
  return () => void subs.delete(f);
};
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

// morph: the mark stretches and returns while it is on screen. period is the
// length of one full cycle in seconds, phase shifts marks against each other,
// hold is the share of the cycle spent resting in each position.
export function Mark({
  size = 24,
  finish = "fold",
  bg = "#f2f1ec",
  ink = "#23261a",
  frame = 0,
  morph = false,
  period = 7,
  phase = 0,
  hold = 0.36,
  className,
  label,
}: {
  size?: number;
  finish?: "fold" | "flat";
  bg?: string;
  ink?: string;
  frame?: number;
  morph?: boolean;
  period?: number;
  phase?: number;
  hold?: number;
  className?: string;
  label?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ref = useRef<SVGSVGElement>(null);
  const on = useOnScreen(ref);
  const [i, setI] = useState(frame);
  const last = useRef(frame);
  useEffect(() => {
    if (!morph || !on || reducedMotion()) return;
    const move = 0.5 - hold;
    return subscribe((t) => {
      const u = ((((t + phase) % period) + period) % period) / period;
      const k = u < hold ? 0 : u < hold + move ? (u - hold) / move : u < hold * 2 + move ? 1 : 1 - (u - hold * 2 - move) / move;
      // A mark that rests stretched (frame > 0) runs the same cycle the other way round.
      const idx = Math.round((frame ? 1 - ease(k) : ease(k)) * LAST);
      if (idx !== last.current) {
        last.current = idx;
        setI(idx);
      }
    });
  }, [morph, on, period, phase, hold, frame]);

  const m = FRAMES[Math.min(LAST, Math.max(0, i))];
  const B = rgb(bg);
  const F = rgb(ink);
  const t = (v: number) => tone(B, F, v);
  return (
    <svg ref={ref} className={`mark ${className ?? ""}`} height={size} width={(size * m.w) / m.h} viewBox={`0 0 ${m.w} ${m.h}`} role={label ? "img" : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
      {finish === "flat" ? (
        <path d={m.o} fill="currentColor" />
      ) : (
        <>
          <defs>
            <clipPath id={`${id}c`}>
              <path d={m.o} />
            </clipPath>
            <linearGradient id={`${id}b`} gradientUnits="userSpaceOnUse" x1={m.eb[0][0]} y1={m.eb[0][1]} x2={m.eb[1][0]} y2={m.eb[1][1]}>
              <stop offset="0" stopColor={t(0.55)} />
              <stop offset="1" stopColor={t(0.94)} />
            </linearGradient>
            <linearGradient id={`${id}f`} gradientUnits="userSpaceOnUse" x1={m.ef[0][0]} y1={m.ef[0][1]} x2={m.ef[1][0]} y2={m.ef[1][1]}>
              <stop offset="0" stopColor={t(0.76)} />
              <stop offset="0.18" stopColor={t(0.8)} />
              <stop offset="1" stopColor={t(1)} />
            </linearGradient>
          </defs>
          <g clipPath={`url(#${id}c)`}>
            <path className="fold-back" d={m.b} fill={`url(#${id}b)`} />
            <path className="fold-spine" d={m.s} fill={t(0.76)} />
            <path className="fold-front" d={m.f} fill={`url(#${id}f)`} />
          </g>
        </>
      )}
    </svg>
  );
}
