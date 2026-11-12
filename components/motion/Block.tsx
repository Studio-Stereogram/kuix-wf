"use client";
import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { sceneRegistry, type SceneSpec } from "@/lib/scene";

type Props = {
  id: string;
  label: string;
  index: string;
  scene: SceneSpec;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

// A content block. It registers its scene spec with the WebGL director, which
// blends it with whichever blocks sit before and after it in the page.
export function Block({ id, label, index, scene, className, style, children }: Props) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    return sceneRegistry.add({ el: ref.current, spec: scene, label, index });
  }, [scene, label, index]);

  return (
    <section
      ref={ref}
      id={id}
      data-block={id}
      data-tone={scene.tone}
      className={`block ${className ?? ""}`}
      style={style}
    >
      {children}
    </section>
  );
}
