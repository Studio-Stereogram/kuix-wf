import gsap from "gsap";
import { ease } from "./motion";

const inView = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < window.innerHeight;
};

// Section-based exit: everything currently on screen leaves in reading
// order (masked lines slide up, layers drop away) instead of a blanket fade.
export function playExit(): Promise<void> {
  const main = document.getElementById("main");
  if (!main) return Promise.resolve();
  const lines = [...main.querySelectorAll(".kx-line")].filter(inView);
  const layers = [...main.querySelectorAll("[data-reveal]")].filter(inView);
  const offscreen = [...main.querySelectorAll("[data-block]")];
  const tl = gsap.timeline();
  tl.to(lines, { yPercent: -115, duration: 0.5, ease: ease.in, stagger: 0.025 }, 0);
  tl.to(layers, { opacity: 0, y: -28, duration: 0.45, ease: ease.in, stagger: 0.03 }, 0.05);
  tl.to(offscreen, { opacity: 0, duration: 0.2 }, ">-0.05");
  return new Promise((r) => tl.eventCallback("onComplete", () => r()));
}
