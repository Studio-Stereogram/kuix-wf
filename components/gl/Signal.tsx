"use client";
import { forwardRef, useMemo } from "react";
import * as THREE from "three";
import { simplex3 } from "./noise.glsl";
import { buildTargets } from "./targets";

// The signal object: one particle system that resolves from noise into a
// loose nebula, a wave field and finally a vortex as the narrative progresses.
export const Signal = forwardRef<THREE.ShaderMaterial, { count: number }>(function Signal(
  { count },
  ref,
) {
  const geometry = useMemo(() => {
    const t = buildTargets(count);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(t.noise, 3));
    g.setAttribute("aNebula", new THREE.BufferAttribute(t.nebula, 3));
    g.setAttribute("aField", new THREE.BufferAttribute(t.field, 3));
    g.setAttribute("aVortex", new THREE.BufferAttribute(t.vortex, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(t.seeds, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4);
    return g;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uPulse: { value: 0 },
      uSize: { value: 26 },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 1 },
      uInk: { value: new THREE.Color("#ECECE7") },
      uAccent: { value: new THREE.Color("#C5F23A") },
    }),
    [],
  );

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={ref}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        vertexShader={/* glsl */ `
          uniform float uTime, uMorph, uPulse, uSize, uPixelRatio;
          attribute vec3 aNebula, aField, aVortex;
          attribute float aSeed;
          varying float vAlpha;
          varying float vSeed;
          ${simplex3}
          float stage(float m, float i){ return smoothstep(0.0, 1.0, clamp(m - i, 0.0, 1.0)); }
          void main(){
            // Each particle runs slightly ahead or behind, so morphs ripple
            // through the cloud instead of snapping in unison.
            float m = clamp(uMorph + (aSeed - 0.5) * 0.35, 0.0, 3.0);
            vec3 p = mix(position, aNebula, stage(m, 0.0));
            p = mix(p, aField, stage(m, 1.0));
            p = mix(p, aVortex, stage(m, 2.0));
            // Never fully settled: a floor of drift keeps every shape soft.
            float chaos = (1.0 - smoothstep(0.0, 1.1, m)) * 0.5 + 0.16 + uPulse * 0.9;
            float t = uTime * 0.18;
            vec3 q = p * 0.55;
            p += vec3(snoise(q + t), snoise(q + 17.0 + t), snoise(q + 41.0 + t)) * chaos;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = uSize * uPixelRatio * (0.45 + aSeed * 0.9) / -mv.z;
            vAlpha = 0.25 + 0.75 * aSeed;
            vSeed = aSeed;
          }
        `}
        fragmentShader={/* glsl */ `
          precision highp float;
          uniform vec3 uInk, uAccent;
          uniform float uOpacity;
          varying float vAlpha;
          varying float vSeed;
          void main(){
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.15, d);
            vec3 col = mix(uInk, uAccent, step(0.955, vSeed));
            gl_FragColor = vec4(col, a * vAlpha * uOpacity);
          }
        `}
      />
    </points>
  );
});
