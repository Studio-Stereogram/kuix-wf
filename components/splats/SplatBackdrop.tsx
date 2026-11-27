"use client";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { build, layout } from "@/lib/splats/build";
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
const vertex = /* glsl */ `
  attribute vec3 aColor;
  attribute vec3 aNormal;
  attribute float aSize;
  attribute float aSeed;
  attribute float aKind;
  uniform float uScale, uGrain, uBody, uLoose, uBlur, uHaze, uFocus;
  uniform vec3 uPaper, uWind;
  varying vec3 vColor;
  varying float vAlpha;
  varying float vKind;
  varying float vSeed;
  varying float vSquash;
  varying vec2 vAxis;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float dist = -mv.z;
    bool body = aKind > 0.5 && aKind < 1.5;
    bool loose = aKind > 1.5;
    float base = body ? uBody : (loose ? uLoose : uGrain);
    float px = base * aSize * uScale / dist;
    float blurPx = abs(dist - uFocus) * uBlur * 0.06 * uScale / dist;
    float size = px + blurPx;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.0, size);

    float spread = px / size;
    vAlpha = (body ? 0.34 : 0.95) * max(spread * spread, 0.05);

    // The squashed axis of the splat on screen: across the surface direction
    // for body splats, across the wind for loose ones, none for grain.
    vec3 nv = normalize((viewMatrix * vec4(aNormal, 0.0)).xyz);
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
      vSquash = 1.0;
    }

    float haze = clamp((dist - uFocus) * uHaze, 0.0, 0.75);
    vColor = mix(aColor, uPaper, haze);
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

function Splats({ scene }: { scene: SplatScene }) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const invalidate = useThree((s) => s.invalidate);
  const narrow = size.width < 768;
  const aspect = size.width / Math.max(1, size.height);

  const splats = useMemo(() => build(scene, Math.round(scene.count * (narrow ? 0.4 : 1))), [scene, narrow]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(splats.count * 3), 3));
    g.setAttribute("aNormal", new THREE.BufferAttribute(splats.normal, 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(splats.color, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(splats.size, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(splats.seed, 1));
    g.setAttribute("aKind", new THREE.BufferAttribute(splats.kind, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
    return g;
  }, [splats]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(() => {
    const st = scene.style;
    const wind = new THREE.Vector3(...scene.wind).normalize();
    return {
      uScale: { value: 1 },
      uGrain: { value: st.grain },
      uBody: { value: st.body },
      uLoose: { value: st.loose },
      uDither: { value: st.dither },
      uBlur: { value: st.blur },
      uHaze: { value: st.haze },
      uFocus: { value: CAMERA },
      uWind: { value: wind },
      uPaper: { value: new THREE.Vector3(...hexRgb(scene.paper)) },
    };
  }, [scene]);

  useLayoutEffect(() => {
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const { order } = layout(scene, splats, { aspect, camera: CAMERA, fov: FOV }, pos.array as Float32Array);
    pos.needsUpdate = true;
    geometry.setIndex(new THREE.BufferAttribute(order, 1));
    invalidate();
  }, [scene, splats, geometry, aspect, invalidate]);

  // Pixels per world unit at distance 1, in device pixels.
  uniforms.uScale.value = (size.height * dpr) / (2 * Math.tan((FOV * Math.PI) / 360));

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

export function SplatBackdrop({ scene }: { scene: SplatScene }) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ fov: FOV, position: [0, 0, CAMERA], near: 0.1, far: 60 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={[scene.paper]} />
      <Splats scene={scene} />
    </Canvas>
  );
}
