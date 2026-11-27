"use client";
import { useEffect, useState } from "react";
import { Feed } from "@/components/feed/Feed";
import { generate, kuixHeader } from "@/lib/splats/generate";
import type { SplatScene } from "@/lib/splats/spec";
import { halos, type Halo } from "@/lib/splats/halos";
import { SplatBackdrop } from "./SplatBackdrop";

// The feed's opening over a splat backdrop, with a small panel to switch
// between the KUIX header scene and generated ones (?seed=42 opens a seed),
// and between the two pointer halos (?halo=push for the dispersing one).
export function Lab() {
  const [scene, setScene] = useState<SplatScene>(kuixHeader);
  const [halo, setHalo] = useState<Halo>("loupe");

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const s = Number(q.get("seed"));
    if (s) setScene(generate(s));
    if (q.get("halo") === "push") setHalo("push");
  }, []);

  const toggleHalo = () => {
    const next: Halo = halo === "loupe" ? "push" : "loupe";
    setHalo(next);
    const url = new URL(location.href);
    if (next === "push") url.searchParams.set("halo", "push");
    else url.searchParams.delete("halo");
    history.replaceState(null, "", url);
  };

  const show = (next: SplatScene, seed?: number) => {
    setScene(next);
    const url = new URL(location.href);
    if (seed) url.searchParams.set("seed", String(seed));
    else url.searchParams.delete("seed");
    history.replaceState(null, "", url);
  };

  const reroll = () => {
    const seed = 1 + Math.floor(Math.random() * 99999);
    show(generate(seed), seed);
  };

  return (
    <>
      <Feed backdrop={<SplatBackdrop scene={scene} halo={halo} />} />
      <div className="lab-panel" role="group" aria-label="Backdrop">
        <span className="meta">Scene: {scene.name}</span>
        <button type="button" className="btn btn-line" onClick={toggleHalo}>
          Halo: {halos[halo].name}
        </button>
        <button type="button" className="btn btn-line" onClick={() => show(kuixHeader)}>
          KUIX header
        </button>
        <button type="button" className="btn" onClick={reroll}>
          New scene
        </button>
      </div>
    </>
  );
}
