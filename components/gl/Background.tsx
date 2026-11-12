"use client";
import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { simplex3 } from "./noise.glsl";

// Full-screen shader backdrop. Colours are driven by the director, so the
// background shifts as content blocks pass through the viewport.
export const Background = forwardRef<THREE.ShaderMaterial>(function Background(_, ref) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBase: { value: new THREE.Color().setStyle("#121212", THREE.LinearSRGBColorSpace) },
      uGlow: { value: new THREE.Color().setStyle("#161616", THREE.LinearSRGBColorSpace) },
      uAccent: { value: new THREE.Color("#C5F23A") },
      uLight: { value: 0 },
      uPulse: { value: 0 },
      uAspect: { value: 1 },
      uFocus: { value: new THREE.Vector2(0.4, 0) },
    }),
    [],
  );

  return (
    <mesh frustumCulled={false} renderOrder={-1}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={ref}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
        vertexShader={/* glsl */ `
          varying vec2 vUv;
          void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
        `}
        fragmentShader={/* glsl */ `
          precision highp float;
          varying vec2 vUv;
          uniform float uTime, uLight, uPulse, uAspect;
          uniform vec3 uBase, uGlow, uAccent;
          uniform vec2 uFocus;
          ${simplex3}
          float fbm(vec3 p){
            float a = 0.5, s = 0.0;
            for(int i = 0; i < 4; i++){ s += a * snoise(p); p *= 2.02; a *= 0.5; }
            return s;
          }
          float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
          void main(){
            vec2 uv = vUv;
            vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
            float t = uTime * 0.04;
            // Domain-warped flow field gives a slow, liquid colour drift.
            vec2 q = vec2(fbm(vec3(p * 1.2, t)), fbm(vec3(p * 1.2 + 5.2, t)));
            float f = fbm(vec3(p * 1.4 + q * 1.6, t * 1.5));
            float glow = smoothstep(-0.35, 0.85, f);
            // A soft pool of light sits behind the signal object.
            vec2 fp = (uFocus * 0.5) * vec2(uAspect, 1.0);
            float focus = exp(-dot(p - fp, p - fp) * 3.2);
            vec3 col = mix(uBase, uGlow, glow * 0.55 + focus * 0.4);
            col += uAccent * (uPulse * 0.04 * glow);
            // Colours arrive as display values, so #121212 and #F5F5F5 come
            // out as specified. A light vignette on top.
            float vig = smoothstep(1.25, 0.25, length(p));
            col *= mix(mix(0.92, 0.99, uLight), 1.0, vig);
            // The noise here only breaks up colour banding. The visible
            // grain is a CSS layer over the canvas (.stage::after).
            col += (hash(uv * 900.0) - 0.5) * mix(0.012, 0.010, uLight);
            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  );
});
