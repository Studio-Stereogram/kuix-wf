"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { hudBus, sceneSignals } from "@/lib/bus";
import { palette, sceneRegistry, type SceneEntry, type SceneSpec } from "@/lib/scene";
import { prefersReducedMotion } from "@/lib/motion";
import { Background } from "./Background";
import { Signal } from "./Signal";

const SHOW_FORM = false;

type Resolved = {
  base: THREE.Color;
  glow: THREE.Color;
  light: number;
  morph: number;
  x: number;
  y: number;
  scale: number;
  opacity: number;
};

const makeResolved = (): Resolved => ({
  base: new THREE.Color().setStyle("#121212", THREE.LinearSRGBColorSpace),
  glow: new THREE.Color().setStyle("#161616", THREE.LinearSRGBColorSpace),
  light: 0,
  morph: 0,
  x: 0.4,
  y: 0,
  scale: 1,
  opacity: 1,
});

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (v: number) => v * v * (3 - 2 * v);
const lerp = THREE.MathUtils.lerp;

function specInto(out: Resolved, spec: SceneSpec, t: number, mobile: boolean) {
  const m = mobile ? { ...spec, ...spec.mobile } : spec;
  // Colours stay in display (sRGB) values, so a blend between a dark and a
  // light section passes evenly through the greys instead of jumping to light.
  out.base.setStyle(spec.bg[0], THREE.LinearSRGBColorSpace);
  out.glow.setStyle(spec.bg[1], THREE.LinearSRGBColorSpace);
  out.light = spec.tone === "light" ? 1 : 0;
  out.morph = Array.isArray(spec.morph) ? lerp(spec.morph[0], spec.morph[1], smooth(t)) : spec.morph;
  out.x = m.x ?? 0;
  out.y = m.y ?? 0;
  out.scale = m.scale ?? 1;
  out.opacity = m.opacity ?? 1;
}

function mixInto(a: Resolved, b: Resolved, k: number) {
  a.base.lerp(b.base, k);
  a.glow.lerp(b.glow, k);
  a.light = lerp(a.light, b.light, k);
  a.morph = lerp(a.morph, b.morph, k);
  a.x = lerp(a.x, b.x, k);
  a.y = lerp(a.y, b.y, k);
  a.scale = lerp(a.scale, b.scale, k);
  a.opacity = lerp(a.opacity, b.opacity, k);
}

function Director() {
  const bg = useRef<THREE.ShaderMaterial>(null);
  const sig = useRef<THREE.ShaderMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const { size, viewport } = useThree();
  const mobile = size.width < 768;
  const count = mobile ? 7000 : 16000;

  const state = useMemo(
    () => ({
      target: makeResolved(),
      next: makeResolved(),
      current: makeResolved(),
      pulse: 0,
      pointer: new THREE.Vector2(),
      tone: "dark" as "dark" | "light",
      lastEntry: null as SceneEntry | null,
      reduced: prefersReducedMotion(),
      ink: new THREE.Color(),
      inkDark: new THREE.Color(palette.paper),
      inkLight: new THREE.Color(palette.ink),
    }),
    [],
  );

  useFrame((three, delta) => {
    const dt = Math.min(delta, 1 / 20);
    const vh = window.innerHeight;
    const center = vh * 0.5;
    const list = sceneRegistry.list();

    // Find the block under the viewport centre and blend into the next one
    // over the final stretch of the current block.
    if (list.length) {
      let i = list.findIndex((e) => {
        const r = e.el.getBoundingClientRect();
        return r.top <= center && r.bottom > center;
      });
      if (i < 0) i = list[0].el.getBoundingClientRect().top > center ? 0 : list.length - 1;
      const entry = list[i];
      const r = entry.el.getBoundingClientRect();
      const t = clamp01((center - r.top) / r.height);
      specInto(state.target, entry.spec, t, mobile);
      const next = list[i + 1];
      if (next) {
        // The blend starts when the next block appears at the bottom of the
        // screen and is complete when the join reaches the middle.
        const zone = Math.min(r.height * 0.45, vh * 0.5);
        const k = clamp01((center - (r.bottom - zone)) / zone);
        if (k > 0) {
          specInto(state.next, next.spec, 0, mobile);
          mixInto(state.target, state.next, smooth(k));
        }
      }
      if (state.lastEntry !== entry) {
        state.lastEntry = entry;
        hudBus.set({ label: entry.label, index: entry.index });
      }
    }


    // Damp towards the target. Shape changes are slower than colour so the
    // object feels like it has mass.
    const c = state.current;
    const tg = state.target;
    const k = state.reduced ? 1 : 1 - Math.exp(-dt * 4);
    const km = state.reduced ? 1 : 1 - Math.exp(-dt * 2.2);
    c.base.lerp(tg.base, k);
    c.glow.lerp(tg.glow, k);
    c.light = lerp(c.light, tg.light, k);
    c.morph = lerp(c.morph, tg.morph, km);
    c.x = lerp(c.x, tg.x, km);
    c.y = lerp(c.y, tg.y, km);
    c.scale = lerp(c.scale, tg.scale, km);
    c.opacity = lerp(c.opacity, tg.opacity, k);
    state.pulse = lerp(state.pulse, sceneSignals.pulse, 1 - Math.exp(-dt * 6));

    const tone = c.light > 0.5 ? "light" : "dark";
    if (tone !== state.tone) {
      state.tone = tone;
      document.documentElement.dataset.tone = tone;
    }

    const time = state.reduced ? 0 : three.clock.elapsedTime;
    if (bg.current) {
      const u = bg.current.uniforms;
      u.uTime.value = time;
      u.uBase.value.copy(c.base);
      u.uGlow.value.copy(c.glow);
      u.uLight.value = c.light;
      u.uPulse.value = state.pulse;
      u.uAspect.value = size.width / size.height;
      u.uFocus.value.set(c.x, c.y);
    }
    if (sig.current) {
      const u = sig.current.uniforms;
      u.uTime.value = time;
      u.uMorph.value = c.morph;
      u.uPulse.value = state.pulse;
      u.uPixelRatio.value = three.gl.getPixelRatio();
      u.uOpacity.value = c.opacity * (1 - c.light * 0.25);
      u.uInk.value.copy(state.inkDark).lerp(state.inkLight, c.light);
      u.uSize.value = mobile ? 22 : 26;
    }
    if (group.current) {
      const g = group.current;
      state.pointer.lerp(three.pointer, 1 - Math.exp(-dt * 3));
      // Field and vortex read best tilted towards the viewer.
      const orbit = smooth(clamp01(c.morph - 1)) * 0.6 + smooth(clamp01(c.morph - 2)) * 0.4;
      g.rotation.y = (state.reduced ? 0 : time * 0.06) + state.pointer.x * 0.25;
      g.rotation.x = -0.3 - orbit * 0.75 + state.pointer.y * -0.12 + state.pulse * 0.3;
      g.rotation.z = orbit * 0.18;
      g.position.set((c.x * viewport.width) / 2, (c.y * viewport.height) / 2, 0);
      const fit = Math.min(1, viewport.width / 7.5);
      g.scale.setScalar(c.scale * fit * (1 + state.pulse * 0.08));
    }
  });

  return (
    <>
      <Background ref={bg} />
      {/* The morphing particle form is switched off while the background
          moves towards a curved-space treatment. Set SHOW_FORM to bring it back. */}
      {SHOW_FORM && (
        <group ref={group}>
          <Signal ref={sig} count={count} />
        </group>
      )}
    </>
  );
}

export default function Stage() {
  return (
    <div className="stage" aria-hidden>
      <Canvas
        dpr={[1, 1.75]}
        gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
        camera={{ fov: 35, position: [0, 0, 9], near: 0.1, far: 50 }}
        eventSource={typeof document !== "undefined" ? document.body : undefined}
        eventPrefix="client"
      >
        <Director />
      </Canvas>
    </div>
  );
}
