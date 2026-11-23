// Curtain entrance for a section with its own solid background: the section
// before it holds still at the bottom of the screen while this one slides up
// over it, like the hero and "What we do". Returns a cleanup.
export function curtainOver(block: HTMLElement | null, tone: "light" | "dark" = "light") {
  const prev = block?.previousElementSibling as HTMLElement | null;
  if (!block || !prev || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    if (block) block.dataset.curtain = tone;
    return () => {
      if (block) delete block.dataset.curtain;
    };
  }
  block.dataset.curtain = tone;
  prev.dataset.held = "";
  let raf = 0;
  let last = -1;
  const loop = () => {
    const vh = window.innerHeight;
    // Where this section's top edge is in the page flow (not moved by the
    // hold itself), relative to the screen.
    const parent = block.offsetParent as HTMLElement | null;
    const top = (parent ? parent.getBoundingClientRect().top : -window.scrollY) + block.offsetTop;
    // Once its top edge is on screen, the section before stops scrolling:
    // its bottom stays on the bottom of the screen until it is covered.
    const y = Math.min(vh, Math.max(0, vh - top));
    if (y !== last) {
      last = y;
      prev.style.transform = y ? `translate3d(0, ${y.toFixed(1)}px, 0)` : "";
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
  return () => {
    cancelAnimationFrame(raf);
    prev.style.transform = "";
    delete prev.dataset.held;
    delete block.dataset.curtain;
  };
}
