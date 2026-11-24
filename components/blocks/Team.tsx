"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { team, teamHead, type Member } from "@/content/site";
import { getLenis } from "@/lib/lenis";
import { prefersReducedMotion } from "@/lib/motion";
import { Stagger } from "../motion/Stagger";
import { Grad, IconPlus, SectionHead } from "./parts";

// Member listing: portrait cards in a grid. A click opens the member overlay,
// which grows out of the card like the brief does out of its button. The
// overlay is linked by hash (#peter-kovacs) so a member can be shared.
export function TeamList({ index }: { index: string }) {
  const [open, setOpen] = useState<{ m: Member; from: DOMRect } | null>(null);

  const show = useCallback((m: Member, el?: Element | null) => {
    const r = el?.getBoundingClientRect() ?? new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 0, 0);
    setOpen({ m, from: r });
    history.replaceState(null, "", `#${m.slug}`);
  }, []);

  useEffect(() => {
    const h = decodeURIComponent(location.hash.slice(1));
    const m = team.find((x) => x.slug === h);
    if (m) show(m, document.getElementById(`member-${m.slug}`));
  }, [show]);

  return (
    <div className="container">
      <SectionHead index={index} label={teamHead.label} title={teamHead.title} aside={teamHead.desc} />
      <Stagger as="ul" className="team" fx="tilt" each={0.06}>
        {team.map((m) => (
          <li key={m.slug}>
            <button id={`member-${m.slug}`} className="member" data-cursor-label="Read the story" onClick={(e) => show(m, e.currentTarget)} aria-haspopup="dialog">
              <span className="member-photo">
                <Grad g={m.g} className="member-grad" tag="span" />
                <span className="member-initials" aria-hidden>
                  {m.name.split(" ").map((p) => p[0]).join("")}
                </span>
                <span className="member-plus" aria-hidden><IconPlus /></span>
              </span>
              <span className="member-name">{m.name}</span>
              <span className="label muted">{m.role}</span>
            </button>
          </li>
        ))}
      </Stagger>
      {open && (
        <MemberOverlay
          m={open.m}
          from={open.from}
          onClose={() => {
            setOpen(null);
            history.replaceState(null, "", location.pathname);
          }}
          onGo={(m) => setOpen((o) => (o ? { ...o, m } : o))}
        />
      )}
    </div>
  );
}

function MemberOverlay({ m, from, onClose, onGo }: { m: Member; from: DOMRect; onClose: () => void; onGo: (m: Member) => void }) {
  const root = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const done = useRef(onClose);
  done.current = onClose;
  const close = useCallback(() => {
    setShown(false);
    window.setTimeout(() => done.current(), prefersReducedMotion() ? 0 : 520);
  }, []);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    document.documentElement.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => {
      getLenis()?.stop();
      setShown(true);
      root.current?.querySelector<HTMLElement>(".brief-close")?.focus({ preventScroll: true });
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key !== "Tab" || !root.current) return;
      const items = [...root.current.querySelectorAll<HTMLElement>("button, a[href]")].filter((n) => n.offsetParent !== null);
      if (!items.length) return;
      const a = items[0];
      const z = items[items.length - 1];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      getLenis()?.start();
      before?.focus({ preventScroll: true });
    };
  }, [close]);

  useEffect(() => {
    root.current?.scrollTo({ top: 0 });
    history.replaceState(null, "", `#${m.slug}`);
  }, [m]);

  const i = team.findIndex((x) => x.slug === m.slug);
  const next = team[(i + 1) % team.length];
  const clip = shown
    ? "inset(0px 0px 0px 0px)"
    : `inset(${from.top}px ${Math.max(0, window.innerWidth - from.right)}px ${Math.max(0, window.innerHeight - from.bottom)}px ${from.left}px)`;

  return createPortal(
    <div ref={root} className="brief member-ov tone-dark" role="dialog" aria-modal="true" aria-label={m.name} data-shown={shown ? "" : undefined} style={{ clipPath: clip }} data-lenis-prevent>
      <div className="brief-inner container">
        <header className="brief-top label">
          <span>
            Team <span className="accent">({String(i + 1).padStart(2, "0")}/{String(team.length).padStart(2, "0")})</span>
          </span>
          <button className="brief-close label" onClick={close}>
            Close <span>[esc]</span>
          </button>
        </header>
        <div className="member-body" key={m.slug}>
          <div className="member-ov-photo">
            <Grad g={m.g} className="member-grad" parallax={false} />
            <span className="member-initials" aria-hidden>
              {m.name.split(" ").map((p) => p[0]).join("")}
            </span>
          </div>
          <div className="member-ov-main">
            {/* Member intro */}
            <section className="member-sec">
              <span className="label accent">{m.role}</span>
              <h2 className="t-h2 member-ov-name">{m.name}</h2>
              <p className="body-lg member-intro">{m.intro}</p>
              <ul className="chips">
                {m.skills.map((s) => (
                  <li key={s} className="chip">{s}</li>
                ))}
              </ul>
            </section>
            {/* Member story */}
            <section className="member-sec">
              <span className="label muted">(01) Story</span>
              {m.story.map((p, k) => (
                <p key={k} className="prose-p">{p}</p>
              ))}
            </section>
            {/* Spotify profile */}
            <section className="member-sec">
              <span className="label muted">(02) On repeat</span>
              <div className="spotify">
                <div className="spotify-head">
                  <span className="spotify-cover" aria-hidden>
                    <Grad g={m.g + 3} parallax={false} />
                  </span>
                  <span>
                    <span className="label muted">Playlist</span>
                    <span className="spotify-title">{m.spotify.playlist}</span>
                  </span>
                  <svg className="spotify-logo" width="22" height="22" viewBox="0 0 24 24" aria-hidden>
                    <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.12" />
                    <path d="M6.5 9.2c3.8-1.1 8-.8 11.2 1M7.2 12.4c3.1-.9 6.4-.6 9.2.9M7.9 15.4c2.4-.6 4.9-.4 7 .7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                  </svg>
                </div>
                <ol className="spotify-list">
                  {m.spotify.tracks.map((t, k) => (
                    <li key={t.title}>
                      <span className="label muted">{String(k + 1).padStart(2, "0")}</span>
                      <span>{t.title}</span>
                      <span className="muted">{t.artist}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </section>
            {/* CV */}
            <section className="member-sec">
              <span className="label muted">(03) CV</span>
              <ul className="cv">
                {m.cv.map((c) => (
                  <li key={c.years + c.place}>
                    <span className="label muted">{c.years}</span>
                    <span>{c.role}</span>
                    <span className="muted">{c.place}</span>
                  </li>
                ))}
              </ul>
            </section>
            <button className="member-next" onClick={() => onGo(next)}>
              <span className="label muted">Next</span>
              <span className="member-next-name">{next.name}</span>
              <span className="label muted">{next.role}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
