"use client";
import dynamic from "next/dynamic";
import type { ReactNode } from "react";
import { Boot } from "./Boot";
import { Cursor } from "./Cursor";
import { Header } from "./Header";
import { Parallax } from "../motion/Parallax";
import { Scan } from "./Hud";
import { SmoothScroll } from "./SmoothScroll";
import { TransitionProvider } from "./TransitionProvider";

const Stage = dynamic(() => import("../gl/Stage"), { ssr: false });

// Everything here lives in the root layout and survives route changes: the
// WebGL stage, header, HUD and scroll. Only <main> content swaps.
export function Experience({ children }: { children: ReactNode }) {
  return (
    <TransitionProvider>
      <SmoothScroll />
      <Stage />
      <Header />
      <main id="main">{children}</main>
      <Scan />
      <Boot />
      <Cursor />
      <Parallax />
      {/* Liquid join for CTA shapes: blur the two pills together, then cut the
          alpha back to a hard edge so a pinched neck forms between them. */}
      <svg className="sr-only" width="0" height="0" aria-hidden focusable="false">
        <filter id="kx-goo" x="-20%" y="-50%" width="140%" height="200%" colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
          <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11" />
        </filter>
      </svg>
    </TransitionProvider>
  );
}
