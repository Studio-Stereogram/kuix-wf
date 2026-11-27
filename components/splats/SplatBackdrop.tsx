"use client";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { build, layout } from "@/lib/splats/build";
import { hexRgb } from "@/lib/splats/palettes";
import type { SplatScene } from "@/lib/splats/spec";

const FOV = 30;
const CAMERA = 10;

// Each bead is a point drawn as a small shaded sphere with a feathered edge.
// Beads away from the focus plane grow and fade (a cheap depth of field) and
// far ones sink into the paper. They are drawn back to front, so the soft
// edges blend without a depth buffer.
const vertex = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aSeed;
  uniform float uScale, uBead, uSoft, uBlur, uHaze, uFocus;
  uniform vec3 uPaper;
  varying vec3 vColor;
  varying float vSoft;
  varying float vAlpha;
  varying float vFlat;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float dist = -mv.z;
    float coc = abs(dist - uFocus) * uBlur;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.0, uBead * aSize * uScale / dist * (1.0 + coc));
    vSoft = clamp(uSoft + coc * 0.5, 0.05, 1.0);
    vAlpha = 0.92 / (1.0 + coc * 1.5);
    vFlat = clamp(coc * 0.8, 0.0, 1.0);
    float haze = clamp((dist - uFocus) * uHaze, 0.0, 0.75);
    vColor = mix(aColor, uPaper, haze);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vSoft;
  varying float vAlpha;
  varying float vFlat;
  void main() {
    vec2 c = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(c, c);
    if (r2 > 1.0) discard;
    float r = sqrt(r2);
    // The bead's own little sphere: a gentle light from the upper left and a
    // small highlight. Out-of-focus beads flatten into plain colour.
    vec3 n = vec3(c.x, -c.y, sqrt(1.0 - r2));
    float diff = 0.8 + 0.26 * dot(n, normalize(vec3(-0.45, 0.65, 0.6)));
    float spec = pow(max(dot(n, normalize(vec3(-0.3, 0.45, 1.0))), 0.0), 18.0) * 0.16;
    vec3 col = vColor * mix(diff, 1.0, vFlat) + spec * (1.0 - vFlat);
    float a = (1.0 - smoothstep(1.0 - vSoft, 1.0, r)) * vAlpha;
    gl_FragColor = vec4(col, a);
  }
`;

function Beads({ scene }: { scene: SplatScene }) {
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);
  const invalidate = useThree((s) => s.invalidate);
  const narrow = size.width < 768;
  const aspect = size.width / Math.max(1, size.height);

  const beads = useMemo(() => build(scene, Math.round(scene.count * (narrow ? 0.4 : 1))), [scene, narrow]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(beads.count * 3), 3));
    g.setAttribute("aColor", new THREE.BufferAttribute(beads.color, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(beads.size, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(beads.seed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 100);
    return g;
  }, [beads]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uScale: { value: 1 },
      uBead: { value: scene.bead.size },
      uSoft: { value: scene.bead.softness },
      uBlur: { value: scene.bead.blur },
      uHaze: { value: scene.bead.haze },
      uFocus: { value: CAMERA },
      uPaper: { value: new THREE.Vector3(...hexRgb(scene.paper)) },
    }),
    [scene],
  );

  useLayoutEffect(() => {
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const { order } = layout(scene, beads, { aspect, camera: CAMERA, fov: FOV }, pos.array as Float32Array);
    pos.needsUpdate = true;
    geometry.setIndex(new THREE.BufferAttribute(order, 1));
    invalidate();
  }, [scene, beads, geometry, aspect, invalidate]);

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
      <Beads scene={scene} />
    </Canvas>
  );
}
