"use client";
import { CtaBody, IconChat, Scramble } from "../blocks/parts";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ease } from "@/lib/motion";
import { norm, routes } from "@/lib/routes";
import { getLenis } from "@/lib/lenis";
import { KXMark } from "./Logo";
import { tagline } from "@/content/copy";
import { TLink } from "./TLink";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const items = el.querySelectorAll(".menu-item-inner");
    const meta = el.querySelectorAll(".menu-meta");
    gsap.set(el, { clipPath: "inset(0% 0% 100% 0%)", visibility: "hidden" });
    gsap.set(items, { yPercent: 110 });
    tl.current = gsap
      .timeline({ paused: true })
      .set(el, { visibility: "visible" })
      .to(el, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: ease.inOut })
      .to(items, { yPercent: 0, duration: 0.8, ease: ease.out, stagger: 0.05 }, 0.3)
      .fromTo(meta, { opacity: 0 }, { opacity: 1, duration: 0.4 }, 0.5);
    return () => void tl.current?.kill();
  }, []);

  useEffect(() => {
    const lenis = getLenis();
    if (open) {
      tl.current?.timeScale(1).play();
      lenis?.stop();
    } else {
      tl.current?.timeScale(1.6).reverse();
      lenis?.start();
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const isActive = (href: string) => norm(pathname) === norm(href);

  return (
    <>
      <header className="header">
        {/* Logo and links share one pill; the contact button sits apart on the right. */}
        <div className="nav-pill">
          <TLink href="/" className="brand" aria-label="KUIX home" onClick={() => setOpen(false)}>
            <KXMark size={26} />
          </TLink>
          <nav className="nav" aria-label="Primary">
            {routes.slice(0, -1).map((r) => (
              <TLink key={r.href} href={r.href} className="nav-link" data-active={isActive(r.href) || undefined}>
                <Scramble text={r.label} />
              </TLink>
            ))}
          </nav>
        </div>

        <TLink href="/contact/" className="cta cta-head" data-active={isActive("/contact/") || undefined}>
          <CtaBody icon={<IconChat />}>Contact us</CtaBody>
        </TLink>

        <button
          className="menu-toggle label"
          aria-expanded={open}
          aria-controls="menu-panel"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="menu-toggle-bars" data-open={open || undefined} />
          {open ? "Close" : "Menu"}
        </button>
      </header>

      <div id="menu-panel" ref={panel} className="menu-panel" aria-hidden={!open}>
        <ul className="menu-list">
          {routes.map((r) => (
            <li key={r.href} className="menu-item">
              <TLink
                href={r.href}
                className="menu-item-inner"
                tabIndex={open ? 0 : -1}
                data-active={isActive(r.href) || undefined}
                onClick={() => setOpen(false)}
              >
                <span className="label">{r.index}</span>
                {r.label}
              </TLink>
            </li>
          ))}
        </ul>
        <div className="menu-meta label">
          <span>kuix@kuix.hu</span>
          <span>{tagline}</span>
        </div>
      </div>
    </>
  );
}
