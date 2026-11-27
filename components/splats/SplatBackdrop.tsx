"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { build, layout, MAX_SHAPES } from "@/lib/splats/build";
import { hexRgb } from "@/lib/splats/palettes";
import type { SplatScene } from "@/lib/splats/spec";

const FOV = 30;
const CAMERA = 10;

// Three kinds of splat, drawn back to front so their soft edges blend:
// - body (1): large Gaussian discs lying flat on the surface. Seen at an
//   angle they squash into ellipses. Together they blur into the shape's mass.
// - grain (0): small dots over the body, which carry the texture.
// - loose (2): dots that broke away, stretched along the wind.
// Away from the focus plane every splat grows by a blur disc and its colour
// spreads thinner, and far splats sink into the paper. Finally each pixel is
// drawn or skipped by chance in proportion to its opacity: that is the
// sprayed, dithered grain.
//
// Motion, all in the vertex shader:
// - idle: each shape sways very slowly about its own centre and breathes, its
//   surface rising and settling splat by splat; loose splats wander.
// - scroll: splats lag behind the page by different amounts, so the shapes
//   stretch and smear vertically while it moves, as if pulled.
// - pointer: splats near the pointer are pushed outwards with a slight swirl
//   and lighten, leaving a clear core inside a bright rim.
const vertex = /* glsl */ `
  attribute vec3 aColor;
  attribute vec3 aNormal;
  attribute float aSize;
  attribute float aSeed;
  attribute float aKind;
  attribute float aShape;
  uniform vec4 uCentre[${MAX_SHAPES}];
  uniform float uScale, uGrain, uBody, uLoose, uBlur, uHaze, uFocus;
  uniform float uTime, uMotion, uVel, uHover, uAspect;
  uniform vec2 uPointer;
  uniform vec3 uPaper, uWind;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vKind;
  varying float vSeed;
  varying float vSquash;
  varying vec2 vAxis;

  mat3 turn(float yaw, float pitch) {
    float cy = cos(yaw), sy = sin(yaw), cp = cos(pitch), sp = sin(pitch);
    return mat3(cy, 0.0, -sy, 0.0, 1.0, 0.0, sy, 0.0, cy) * mat3(1.0, 0.0, 0.0, 0.0, cp, sp, 0.0, -sp, cp);
  }

  void main() {
    bool body = aKind > 0.5 && aKind < 1.5;
    bool loose = aKind > 1.5;
    int si = int(aShape + 0.5);
    vec4 c = uCentre[si];
    float ph = aShape * 1.7;
    float t = uTime * uMotion;

    // Idle: a slow sway about the shape's centre (a few degrees, minutes per
    // swing) and a breath.
    mat3 R = turn(0.34 * sin(t * 0.031 + ph), 0.09 * sin(t * 0.047 + ph * 1.3));
    vec3 n = R * aNormal;
    vec3 lp = R * position;
    lp += n * sin(t * 0.6 + aSeed * 6.283) * 0.007 * uMotion;
    if (loose) lp += vec3(sin(t * 0.21 + aSeed * 40.0), sin(t * 0.17 + aSeed * 31.0), sin(t * 0.19 + aSeed * 23.0)) * 0.035 * uMotion;
    float breath = 1.0 + 0.018 * sin(t * 0.42 + ph) * uMotion;
    vec3 world = c.xyz + lp * c.w * breath;

    // Scroll: lag behind the page, each splat by its own amount.
    float vel = clamp(uVel, -2.5, 2.5);
    world.y -= vel * (0.25 + 0.75 * aSeed) * (loose ? 1.8 : 1.0) * 0.12 * c.w;

    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    float dist = -mv.z;
    vec4 clip = projectionMatrix * mv;

    // Pointer: push outwards in screen space, nearer splats further.
    vec2 ndc = clip.xy / clip.w;
    vec2 d = (ndc - uPointer) * vec2(uAspect, 1.0);
    float r = length(d);
    float radius = 0.3;
    float f = uHover * exp(-1.6 * (r * r) / (radius * radius));
    vec2 dir = d / max(r, 1e-4);
    dir = normalize(dir + vec2(-dir.y, dir.x) * 0.35);
    ndc += dir * f * radius * 0.75 * (0.6 + 0.4 * aSeed) * (uFocus / dist) / vec2(uAspect, 1.0);
    clip.xy = ndc * clip.w;
    gl_Position = clip;

    float base = body ? uBody : (loose ? uLoose : uGrain);
    float px = base * aSize * uScale / dist;
    float blurPx = abs(dist - uFocus) * uBlur * 0.06 * uScale / dist;
    float size = px + blurPx;
    gl_PointSize = max(1.0, size);

    float spread = px / size;
    vAlpha = (body ? 0.34 : 0.95) * max(spread * spread, 0.05);

    // The squashed axis of the splat on screen: across the surface direction
    // for body splats, across the wind for loose ones. Grain is round at rest
    // and streaks vertically while the page moves.
    vec3 nv = normalize((viewMatrix * vec4(n, 0.0)).xyz);
    vec3 wv = (viewMatrix * vec4(uWind, 0.0)).xyz;
    if (body) {
      vAxis = normalize(nv.xy + vec2(1e-4, 0.0));
      vSquash = max(abs(nv.z), 0.28);
    } else if (loose) {
      vec2 w = normalize(wv.xy + vec2(1e-4, 0.0));
      vAxis = vec2(-w.y, w.x);
      vSquash = 0.45;
    } else {
      vAxis = vec2(1.0, 0.0);
      vSquash = 1.0 / (1.0 + abs(vel) * 0.9);
    }

    float haze = clamp((dist - uFocus) * uHaze, 0.0, 0.75);
    vColor = mix(mix(aColor, uPaper, haze), vec3(1.0), f * 0.5);
    vKind = aKind;
    vSeed = aSeed;
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform float uDither;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vKind;
  varying float vSeed;
  varying float vSquash;
  varying vec2 vAxis;
  float hash(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    c.y = -c.y;
    float u = dot(c, vAxis) / vSquash;
    float w = dot(c, vec2(-vAxis.y, vAxis.x));
    float r2 = u * u + w * w;
    if (r2 > 1.0) discard;
    bool body = vKind > 0.5 && vKind < 1.5;
    float a = body ? exp(-r2 * 4.0) : 1.0 - smoothstep(0.2, 1.0, sqrt(r2));
    a *= vAlpha;
    float h = hash(gl_FragCoord.xy + vSeed * vec2(131.7, 97.3));
    a = mix(a, step(h, a) * 0.85, uDither);
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

const ease = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);

function Splats({ scene, live }: { scene: SplatScene; live: boolean }) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const canvas = useThree((s) => s.gl.domElement);
  const invalidate = useThree((s) => s.invalidate);
  const narrow = size.width < 768;
  const aspect = size.width / Math.max(1, size.height);

  const splats = useMemo(() => build(scene, Math.round(scene.count * (narrow ? 0.4 : 1))), [scene, narrow]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(splats.local, 3));
    g.setAttribute("aNormal", new THREE.BufferAttribute(splats.normal, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(splats.color, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(splats.size, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(splats.seed, 1));
    g.setAttribute("aKind", new THREE.BufferAttribute(splats.kind, 1));
    g.setAttribute("aShape", new THREE.BufferAttribute(Float32Array.from(splats.shape), 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
    return g;
  }, [splats]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(() => {
    const st = scene.style;
    return {
      uCentre: { value: Array.from({ length: MAX_SHAPES }, () => new THREE.Vector4()) },
      uScale: { value: 1 },
      uGrain: { value: st.grain },
      uBody: { value: st.body },
      uLoose: { value: st.loose },
      uDither: { value: st.dither },
      uBlur: { value: st.blur },
      uHaze: { value: st.haze },
      uFocus: { value: CAMERA },
      uWind: { value: new THREE.Vector3(...scene.wind).normalize() },
      uPaper: { value: new THREE.Vector3(...hexRgb(scene.paper)) },
      uTime: { value: 0 },
      uMotion: { value: 0 },
      uVel: { value: 0 },
      uHover: { value: 0 },
      uAspect: { value: 1 },
      uPointer: { value: new THREE.Vector2(0, 0) },
    };
  }, [scene]);

  useLayoutEffect(() => {
    const { centres, order } = layout(scene, splats, { aspect, camera: CAMERA, fov: FOV });
    uniforms.uCentre.value.forEach((v, i) => v.fromArray(centres, i * 4));
    geometry.setIndex(new THREE.BufferAttribute(order, 1));
    invalidate();
  }, [scene, splats, geometry, uniforms, aspect, invalidate]);

  // Pixels per world unit at distance 1, in device pixels.
  uniforms.uScale.value = (size.height * dpr) / (2 * Math.tan((FOV * Math.PI) / 360));
  uniforms.uAspect.value = aspect;

  // Pointer and scroll. The pointer is followed with a little lag and the
  // halo fades in and out; scroll speed (screen heights per second) is
  // smoothed so the pull builds and settles rather than jumping.
  const input = useRef({ tx: 0, ty: 0, x: 0, y: 0, inside: false, hover: 0, scroll: 0, vel: 0 });
  useEffect(() => {
    const k = input.current;
    k.scroll = window.scrollY;
    const move = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 2 - 1;
      const y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      k.inside = x > -1 && x < 1 && y > -1 && y < 1;
      if (k.hover < 0.02) {
        k.x = x;
        k.y = y;
      }
      k.tx = x;
      k.ty = y;
    };
    const leave = () => (k.inside = false);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, [canvas]);

  useFrame((_, delta) => {
    if (!live) return;
    const dt = Math.min(delta, 0.05);
    const k = input.current;
    k.x += (k.tx - k.x) * ease(8, dt);
    k.y += (k.ty - k.y) * ease(8, dt);
    k.hover += ((k.inside ? 1 : 0) - k.hover) * ease(3, dt);
    const sy = window.scrollY;
    const v = (sy - k.scroll) / Math.max(dt, 1e-3) / window.innerHeight;
    k.scroll = sy;
    k.vel += (Math.max(-4, Math.min(4, v)) - k.vel) * ease(5, dt);

    uniforms.uTime.value += dt;
    uniforms.uMotion.value = 1;
    uniforms.uPointer.value.set(k.x, k.y);
    uniforms.uHover.value = k.hover;
    uniforms.uVel.value = k.vel;
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertex}
        fragmentShader={fragment}
        transparent
        depthTest={false}
        depthWrite={false}
      />
    </points>
  );
}

// Runs continuously only while it is on screen and the reader has not asked
// for less motion; otherwise it draws a still frame when something changes.
export function SplatBackdrop({ scene }: { scene: SplatScene }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setStill(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    const el = ref.current;
    const io = el ? new IntersectionObserver(([e]) => setVisible(e.isIntersecting)) : null;
    if (el && io) io.observe(el);
    return () => {
      mq.removeEventListener("change", sync);
      io?.disconnect();
    };
  }, []);

  const live = visible && !still;
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0 }}>
      <Canvas
        frameloop={live ? "always" : "demand"}
        dpr={[1, 1.5]}
        camera={{ fov: FOV, position: [0, 0, CAMERA], near: 0.1, far: 60 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={[scene.paper]} />
        <Splats scene={scene} live={live} />
      </Canvas>
    </div>
  );
}
