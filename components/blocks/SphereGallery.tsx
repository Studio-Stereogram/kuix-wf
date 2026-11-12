"use client";
import { useEffect, useRef } from "react";
import { prefersReducedMotion, ready } from "@/lib/motion";
import { Placeholder } from "./parts";

// Eight team photos floating on a sphere, each large enough to read. Nothing
// shows until the section is well into view. Then the photos arrive one after
// another: each starts small, far back in the middle, and flies out to its
// place on the sphere while it grows and fades in. The sphere starts turning
// as it opens and keeps turning slowly. Drag to spin it; it carries on with
// some momentum. Cards always face the viewer: near ones are larger and on top,
// far ones smaller and dimmer.

const COUNT = 8;
const RATIOS = ["3 / 4", "1 / 1", "4 / 5", "4 / 3", "3 / 4", "1 / 1", "4 / 3", "4 / 5"];
const CAMERA = 3.2; // camera distance in sphere radii
const FLY_T = 1.7; // seconds a photo takes to reach its place
const EACH_T = 0.1; // seconds between two photos setting off
const SPIN_T = 2.6; // seconds until the sphere turns at full speed

type V = [number, number, number];
const ease = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 4);
const mix = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function layouts(n: number) {
  const sphere: V[] = [];
  const origin: V[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    // Half a step in from the poles, so no card sits dead on top or bottom.
    const y = (1 - ((i + 0.5) / n) * 2) * 0.82;
    const r = Math.sqrt(1 - y * y);
    const a = golden * i;
    sphere.push([Math.cos(a) * r, y, Math.sin(a) * r]);
    // Where a photo sets off from: close to the middle and far behind the sphere.
    const k = Math.sin(i * 12.9898) * 43758.5453;
    const j = k - Math.floor(k);
    origin.push([(j - 0.5) * 0.3, (((k * 7) % 1) - 0.5) * 0.3, -2.4]);
  }
  return { sphere, origin };
}

export function SphereGallery() {
  const stage = useRef<HTMLDivElement>(null);
  const cards = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const reduced = prefersReducedMotion();
    const { sphere, origin } = layouts(COUNT);
    let rotY = 0.4;
    let rotX = -0.18;
    let vy = reduced ? 0 : 0.12; // rad/s
    let vx = 0;
    let start = reduced ? 0 : -1; // when the photos set off; -1 until then
    let raf = 0;
    let last = performance.now();
    let visible = false;
    let drag: { x: number; y: number; t: number } | null = null;

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = reduced ? 99 : start < 0 ? -1 : (now - start) / 1000;
      const spin = ease(t / SPIN_T);

      if (!drag) {
        vy += (0.12 - vy) * (1 - Math.exp(-dt * 0.8));
        vx += (0 - vx) * (1 - Math.exp(-dt * 2));
        rotY += vy * dt * (reduced ? 0 : 1);
        rotX = Math.max(-0.9, Math.min(0.9, rotX + vx * dt));
      }
      // The sphere only starts turning as it opens.
      const ry = rotY * spin;
      const rx = rotX * spin;
      const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
      const w = el.clientWidth;
      const h = el.clientHeight;
      // A wide ellipsoid rather than a ball, so eight large cards have room.
      // Its height is whatever the stage leaves once the tallest card is
      // accounted for, so no photo ever reaches past the top or bottom.
      const tall = Math.max(0, ...cards.current.map((c) => (c ? c.offsetHeight : 0)));
      // Phones: taller than wide. The photos reach the top and bottom of the
      // stage and stay inside the sides of the screen.
      const phone = w < 768;
      const wide = cards.current[0]?.offsetWidth ?? 0;
      const ex = phone ? Math.max(60, w / 2 - wide * 0.46) : Math.min(w * 0.38, 620);
      const ey = phone ? Math.max(40, (h / 2 - tall * 0.5) / 0.8) : Math.max(40, Math.min(h * 0.36, h / 2 - tall * 0.64));

      cards.current.forEach((c, i) => {
        if (!c) return;
        const q = ease((t - i * EACH_T) / FLY_T);
        const p = mix(origin[i], sphere[i], q);
        // rotate around Y, then X
        const x1 = p[0] * cy + p[2] * sy;
        const z1 = -p[0] * sy + p[2] * cy;
        const y2 = p[1] * cx - z1 * sx;
        const z2 = p[1] * sx + z1 * cx;
        const s = CAMERA / (CAMERA - z2);
        const depth = Math.min(1, Math.max(0, (z2 + 1) / 2)); // 0 far, 1 near
        c.style.transform = `translate3d(${x1 * ex * s}px, ${y2 * ey * s}px, 0) translate(-50%, -50%) scale(${s * (0.75 + depth * 0.25)})`;
        c.style.zIndex = String(Math.round(depth * 100));
        c.style.opacity = String((0.5 + depth * 0.5) * Math.min(1, q * 2.5));
      });
      raf = visible ? requestAnimationFrame(render) : 0;
    };

    let asked = false;
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        // The photos set off once two fifths of the stage is on screen.
        if (!asked && e.intersectionRatio >= 0.4) {
          asked = true;
          ready.then(() => {
            if (start < 0) start = performance.now();
          });
        }
        if (visible && !raf) {
          last = performance.now();
          raf = requestAnimationFrame(render);
        }
      },
      { threshold: [0.05, 0.4] },
    );
    io.observe(el);
    // Hide the photos until then.
    render(performance.now());

    const down = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY, t: performance.now() };
      el.setPointerCapture(e.pointerId);
      el.dataset.dragging = "";
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const now = performance.now();
      const dt = Math.max(8, now - drag.t) / 1000;
      const dx = (e.clientX - drag.x) * 0.006;
      const dy = (e.clientY - drag.y) * 0.006;
      rotY += dx;
      rotX = Math.max(-0.9, Math.min(0.9, rotX - dy));
      vy = dx / dt;
      vx = -dy / dt;
      drag = { x: e.clientX, y: e.clientY, t: now };
    };
    const up = () => {
      if (!drag) return;
      drag = null;
      vy = Math.max(-4, Math.min(4, vy));
      vx = Math.max(-3, Math.min(3, vx));
      delete el.dataset.dragging;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, []);

  return (
    <div ref={stage} className="sphere" aria-label="Photos of team life" data-cursor="drag">
      <span className="sphere-label label" aria-hidden>Life at KUIX</span>
      {Array.from({ length: COUNT }, (_, i) => (
        <div
          key={i}
          ref={(c) => {
            cards.current[i] = c;
          }}
          className="sphere-card"
        >
          <Placeholder g={i} ratio={RATIOS[i % RATIOS.length]} />
        </div>
      ))}
    </div>
  );
}
