"use client";
import { createContext, useCallback, useContext, useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { sceneSignals, transitionBus } from "@/lib/bus";
import { playExit } from "@/lib/exit";
import { getLenis } from "@/lib/lenis";
import { nextFrame, prefersReducedMotion } from "@/lib/motion";
import { findRoute, norm } from "@/lib/routes";

type Ctx = { navigate: (href: string) => void };
const TransitionContext = createContext<Ctx>({ navigate: () => {} });
export const usePageTransition = () => useContext(TransitionContext);

// Routes never hard-load. Navigation runs: exit visible sections -> swap the
// route under a still-running WebGL scene -> scroll reset -> new sections reveal.
export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const busy = useRef(false);
  const arrival = useRef<{ path: string; resolve: () => void } | null>(null);

  useEffect(() => {
    if (arrival.current && norm(pathname) === norm(arrival.current.path)) {
      arrival.current.resolve();
      arrival.current = null;
    }
  }, [pathname]);

  const navigate = useCallback(
    async (href: string) => {
      const lenis = getLenis();
      if (busy.current) return;
      if (norm(href) === norm(pathname)) {
        lenis?.scrollTo(0, { duration: 1.2 });
        return;
      }
      busy.current = true;
      lenis?.stop();
      transitionBus.set({ phase: "exiting", target: findRoute(href) });
      sceneSignals.pulse = 1;
      router.prefetch(href);

      if (!prefersReducedMotion()) await playExit();

      const arrived = new Promise<void>((resolve) => (arrival.current = { path: href, resolve }));
      router.push(href, { scroll: false });
      await arrived;
      await nextFrame();
      window.scrollTo(0, 0);
      lenis?.scrollTo(0, { immediate: true, force: true });
      lenis?.start();

      sceneSignals.pulse = 0;
      transitionBus.set({ phase: "entering" });
      window.setTimeout(() => {
        transitionBus.set({ phase: "idle" });
        busy.current = false;
      }, 700);
    },
    [pathname, router],
  );

  return <TransitionContext.Provider value={{ navigate }}>{children}</TransitionContext.Provider>;
}
