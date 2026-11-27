"use client";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { MAX_SHAPES, type Splats as SplatData } from "@/lib/splats/build";
import { FoldContext } from "@/lib/fold";
import { hexRgb } from "@/lib/splats/palettes";
import type { SplatScene } from "@/lib/splats/spec";
import { turns } from "@/lib/splats/turn";

const FOV = 30;
const CAMERA = 10;

// Three kinds of splat, drawn back to front so their soft edges blend:
// - body (1): large Gaussian discs lying flat on the surface. Seen at an
//   angle they squash into ellipses. Together they blur into the shape's mass.
// - grain (0): small marks over the body, which carry the texture.
// - loose (2): marks that broke away, stretched along the wind.
// Every splat has its own size and a slight oval stretch at its own angle.
// Away from the focus plane every splat grows by a blur disc and its
// colour spreads thinner, and far splats sink into the paper. Finally each
// pixel is drawn or skipped by chance in proportion to its opacity: that is
// the sprayed, dithered grain.
//
// Motion, all in the vertex shader:
// - idle: each shape spins slowly about the vertical through its centre and
//   tilts (the matrices come from turn.ts) and breathes, its surface rising
//   and settling splat by splat; loose splats wander.
// - scroll: splats lag behind the page by different amounts, so the shapes
//   stretch and smear vertically while it moves, as if pulled.
// - pointer: a wide, soft field around the pointer partly disperses the
//   bodies. Each splat in it drifts its own distance, partly away from the
//   pointer, partly off the surface and partly at random, so the shape loosens
//   and scatters rather than parting cleanly.
const vertex = /* glsl */ `
  attribute vec3 aColor;
  attribute vec3 aNormal;
  attribute float aSize;
  attribute float aSeed;
  attribute float aKind;
  attribute float aShape;
  attribute float aStretch;
  attribute float aAngle;
  uniform vec4 uCentre[${MAX_SHAPES}];
  uniform mat3 uTurn[${MAX_SHAPES}];
  uniform float uScale, uGrain, uBody, uLoose, uBlur, uHaze, uFocus;
  uniform float uTime, uMotion, uVel, uHover, uAspect;
  uniform vec2 uPointer;
  uniform vec3 uPaper, uWind;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vProfile;
  varying float vSeed;
  varying float vSquash;
  varying vec2 vAxis;

  void main() {
    bool body = aKind > 0.5 && aKind < 1.5;
    bool loose = aKind > 1.5;
    int si = int(aShape + 0.5);
    vec4 c = uCentre[si];
    float t = uTime * uMotion;

    // Idle: spin and tilt, a breath, a surface that rises and settles.
    mat3 R = uTurn[si];
    vec3 n = R * aNormal;
    vec3 lp = R * position;
    lp += n * sin(t * 0.6 + aSeed * 6.283) * 0.007 * uMotion;
    if (loose) lp += vec3(sin(t * 0.21 + aSeed * 40.0), sin(t * 0.17 + aSeed * 31.0), sin(t * 0.19 + aSeed * 23.0)) * 0.035 * uMotion;
    float breath = 1.0 + 0.018 * sin(t * 0.42 + aShape * 1.7) * uMotion;
    vec3 world = c.xyz + lp * c.w * breath;

    // Scroll: lag behind the page, each splat by its own amount.
    float vel = clamp(uVel, -2.5, 2.5);
    world.y -= vel * (0.25 + 0.75 * aSeed) * (loose ? 1.8 : 1.0) * 0.12 * c.w;

    // Pointer: where the splat sits on screen decides how much of the field
    // it feels. The camera looks straight down -z, so screen directions are
    // world x and y.
    vec4 clip0 = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
    vec2 d = (clip0.xy / clip0.w - uPointer) * vec2(uAspect, 1.0);
    float r = length(d);
    float radius = 0.7;
    float f = uHover * exp(-2.0 * (r * r) / (radius * radius));
    float share = smoothstep(0.15, 1.0, fract(aSeed * 13.7)) * (loose ? 1.5 : 1.0);
    vec3 rnd = normalize(vec3(fract(aSeed * 91.3), fract(aSeed * 47.1), fract(aSeed * 23.9)) - 0.5 + 1e-3);
    vec3 away = vec3(d / max(r, 1e-3), 0.0);
    world += (away * 0.55 + n * 0.45 + rnd * 0.7) * f * share * 0.32 * c.w;

    vec4 mv = modelViewMatrix * vec4(world, 1.0);
    float dist = -mv.z;
    gl_Position = projectionMatrix * mv;

    float base = body ? uBody : (loose ? uLoose : uGrain);
    // Grain never drops below 1.5 device pixels: smaller dots shimmer as the
    // shapes turn.
    float px = base * aSize * uScale / dist;
    if (!body) px = max(px, 1.5);
    float blurPx = abs(dist - uFocus) * uBlur * 0.06 * uScale / dist;
    float size = px + blurPx;
    float spread = px / size;
    vAlpha = (body ? 0.34 : 0.95) * max(spread * spread, 0.05);

    // Shape on screen. Body splats lie flat on the surface: squashed across
    // its direction, and a little drawn out along it. Grain and loose splats
    // take their own slight stretch and angle; loose ones turn towards the
    // wind, and grain swings vertical while the page moves.
    float stretch = aStretch;
    vec3 nv = normalize((viewMatrix * vec4(n, 0.0)).xyz);
    if (body) {
      vAxis = normalize(nv.xy + vec2(1e-4, 0.0));
      vSquash = max(abs(nv.z), 0.28) / stretch;
    } else {
      vec2 a = vec2(cos(aAngle), sin(aAngle));
      if (loose) {
        vec3 wv = (viewMatrix * vec4(uWind, 0.0)).xyz;
        vec2 w = normalize(wv.xy + vec2(1e-4, 0.0));
        a = normalize(mix(a, vec2(-w.y, w.x), 0.7));
        stretch = max(stretch, 1.8);
      }
      float m = clamp(abs(vel) * 0.8, 0.0, 1.0);
      a = normalize(mix(a, vec2(1.0, 0.0), m) + vec2(1e-4, 0.0));
      stretch *= 1.0 + abs(vel) * 0.9;
      vAxis = a;
      vSquash = 1.0 / stretch;
    }
    // Keep the area: the sprite grows along the stretch as it thins across.
    gl_PointSize = max(1.0, size * sqrt(stretch));
    vAlpha *= 1.0 - f * share * 0.35;

    // Profile: body splats are Gaussian, the rest soft-edged dots.
    vProfile = body ? 0.0 : 1.0;

    float haze = clamp((dist - uFocus) * uHaze, 0.0, 0.75);
    vColor = mix(mix(aColor, uPaper, haze), vec3(1.0), f * share * 0.16);
    vSeed = aSeed;
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform float uDither;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vProfile;
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
    float r = sqrt(r2);
    float a;
    if (vProfile < 0.5) a = exp(-r2 * 4.0);
    else a = 1.0 - smoothstep(0.2, 1.0, r);
    a *= vAlpha;
    float h = hash(gl_FragCoord.xy + vSeed * vec2(131.7, 97.3));
    a = mix(a, step(h, a) * 0.85, uDither);
    if (a < 0.004) discard;
    gl_FragColor = vec4(vColor, a);
  }
`;

const ease = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);

// Grain is laid on this many times as densely as the base budget; the large
// body splats, which cost the most to draw, stay as they are.
const GRAIN_DENSITY = { wide: 1.8, narrow: 1.6 };
// Safety valve: if the first seconds run slower than this (ms per frame),
// drop to one device pixel per CSS pixel, which cuts the drawing work most.
const SLOW_FRAME_MS = 20;

type Built = { id: number; splats: SplatData; centres: Float32Array; order: Uint32Array };

function Splats({ scene, live }: { scene: SplatScene; live: boolean }) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const setDpr = useThree((s) => s.setDpr);
  const canvas = useThree((s) => s.gl.domElement);
  const invalidate = useThree((s) => s.invalidate);
  const narrow = size.width < 768;
  const aspect = size.width / Math.max(1, size.height);
  const sizes = useMemo(() => scene.shapes.map((s) => s.size), [scene]);

  // Everything heavy happens in the worker: building the splats, placing the
  // shapes and every sort. The page only uploads what comes back.
  const [built, setBuilt] = useState<Built | null>(null);
  const work = useRef({ worker: null as Worker | null, build: 0, sort: 0, waiting: false, last: 0, every: 0.15 });
  const orderRef = useRef<((order: Uint32Array, centres?: Float32Array) => void) | null>(null);

  useEffect(() => {
    const w = work.current;
    const worker = new Worker(new URL("./splats.worker.ts", import.meta.url));
    worker.onmessage = (e: MessageEvent) => {
      const m = e.data;
      if (m.type === "built") {
        if (m.id === w.build) setBuilt({ id: m.id, splats: m.splats, centres: m.centres, order: m.order });
        return;
      }
      if (m.type === "sorted") w.waiting = false;
      if (m.id !== w.build && m.type === "placed") return;
      orderRef.current?.(m.order, m.centres);
    };
    w.worker = worker;
    return () => {
      worker.terminate();
      w.worker = null;
    };
  }, []);

  const frame = useMemo(() => ({ aspect, camera: CAMERA, fov: FOV }), [aspect]);
  const frameRef = useRef(frame);
  frameRef.current = frame;

  // A new build whenever the scene or the screen class changes.
  useEffect(() => {
    const w = work.current;
    if (!w.worker) return;
    w.build++;
    w.waiting = false;
    const budget = Math.round(scene.count * (narrow ? 0.4 : 1));
    const grainDensity = narrow ? GRAIN_DENSITY.narrow : GRAIN_DENSITY.wide;
    w.worker.postMessage({ type: "build", id: w.build, scene, budget, grainDensity, frame: frameRef.current });
  }, [scene, narrow]);

  // A new placement when the frame changes shape (after the first build).
  const builtId = built?.id;
  useEffect(() => {
    const w = work.current;
    if (!w.worker || builtId === undefined) return;
    w.worker.postMessage({ type: "place", id: w.build, frame });
  }, [frame, builtId]);

  const geometry = useMemo(() => {
    if (!built) return null;
    const sp = built.splats;
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(sp.local, 3));
    g.setAttribute("aNormal", new THREE.BufferAttribute(sp.normal, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(sp.color, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(sp.size, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(sp.seed, 1));
    g.setAttribute("aKind", new THREE.BufferAttribute(sp.kind, 1));
    g.setAttribute("aStretch", new THREE.BufferAttribute(sp.stretch, 1));
    g.setAttribute("aAngle", new THREE.BufferAttribute(sp.angle, 1));
    g.setAttribute("aShape", new THREE.BufferAttribute(Float32Array.from(sp.shape), 1));
    g.setIndex(new THREE.BufferAttribute(built.order, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
    // Larger sets are sorted a little less often.
    work.current.every = Math.max(0.15, sp.count / 1e6);
    return g;
  }, [built]);
  useEffect(() => () => geometry?.dispose(), [geometry]);

  const uniforms = useMemo(() => {
    const st = scene.style;
    return {
      uCentre: { value: Array.from({ length: MAX_SHAPES }, () => new THREE.Vector4()) },
      uTurn: { value: Array.from({ length: MAX_SHAPES }, () => new THREE.Matrix3()) },
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

  // New orders (and, after a placement, new centres) are copied in place.
  useLayoutEffect(() => {
    if (!built || !geometry) return;
    uniforms.uCentre.value.forEach((v, i) => v.fromArray(built.centres, i * 4));
    orderRef.current = (order, centres) => {
      const index = geometry.getIndex();
      if (!index || index.count !== order.length) return;
      (index.array as Uint32Array).set(order);
      index.needsUpdate = true;
      if (centres) uniforms.uCentre.value.forEach((v, i) => v.fromArray(centres, i * 4));
      invalidate();
    };
    invalidate();
    return () => {
      orderRef.current = null;
    };
  }, [built, geometry, uniforms, invalidate]);

  // Pixels per world unit at distance 1, in device pixels.
  uniforms.uScale.value = (size.height * dpr) / (2 * Math.tan((FOV * Math.PI) / 360));
  uniforms.uAspect.value = aspect;

  // Pointer and scroll. The pointer is followed with a soft lag and the field
  // fades in and out; scroll speed (screen heights per second) is smoothed so
  // the pull builds and settles rather than jumping.
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

  // Frame timing for the safety valve: measured between 0.5 s and 2.5 s after
  // the splats first show, once.
  const timing = useRef({ since: 0, frames: 0, spent: 0, done: false });

  const turnArray = useRef(new Float32Array(MAX_SHAPES * 9));
  useFrame((_, delta) => {
    if (!live || !geometry) return;
    const tm = timing.current;
    if (!tm.done) {
      tm.since += delta;
      if (tm.since > 0.5) {
        tm.frames++;
        tm.spent += delta;
      }
      if (tm.since > 2.5) {
        tm.done = true;
        if ((tm.spent / tm.frames) * 1000 > SLOW_FRAME_MS && dpr > 1) setDpr(1);
      }
    }

    const dt = Math.min(delta, 0.05);
    const k = input.current;
    k.x += (k.tx - k.x) * ease(4, dt);
    k.y += (k.ty - k.y) * ease(4, dt);
    k.hover += ((k.inside ? 1 : 0) - k.hover) * ease(1.8, dt);
    const sy = window.scrollY;
    const v = (sy - k.scroll) / Math.max(dt, 1e-3) / window.innerHeight;
    k.scroll = sy;
    k.vel += (Math.max(-4, Math.min(4, v)) - k.vel) * ease(5, dt);

    const t = (uniforms.uTime.value += dt);
    uniforms.uMotion.value = 1;
    uniforms.uPointer.value.set(k.x, k.y);
    uniforms.uHover.value = k.hover;
    uniforms.uVel.value = k.vel;
    turns(sizes, t, turnArray.current);
    uniforms.uTurn.value.forEach((m, i) => m.fromArray(turnArray.current, i * 9));

    const w = work.current;
    if (w.worker && !w.waiting && t - w.last > w.every) {
      w.waiting = true;
      w.last = t;
      w.sort++;
      w.worker.postMessage({ type: "sort", id: w.sort, turns: turnArray.current.slice() });
    }
  });

  if (!geometry) return null;
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

// Runs continuously only while it is on screen, not covered by the curtain,
// and the reader has not asked for less motion; otherwise it draws a still
// frame when something changes.
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

  const { covered } = useContext(FoldContext);
  const live = visible && !still && !covered;
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
