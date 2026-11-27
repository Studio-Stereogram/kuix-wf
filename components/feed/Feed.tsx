"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { closing, people, posts, type Author, type PostBlock, type PostData } from "@/content/feed";
import { routes } from "@/lib/routes";
import { Mark } from "./Mark";
import { Closing, Hero } from "./sections";
import { Board, BuildLog, Chat, Itinerary, Method, Metrics, Numbers, Photos, Replies, Sectors } from "./blocks";
import { Avatar, FeedContext, reducedMotion, Rv, T, useSeen } from "./core";
import { FoldContext } from "@/lib/fold";

const block = (kind: PostBlock, p: PostData): ReactNode => {
  switch (kind) {
    case "method": return <Method />;
    case "itinerary": return <Itinerary />;
    case "buildlog": return <BuildLog />;
    case "metrics": return <Metrics />;
    case "board": return <Board />;
    case "sectors": return <Sectors />;
    case "photos": return <Photos />;
    case "chat": return <Chat index={p.chat ?? 0} />;
    case "numbers": return <Numbers />;
  }
};

// One post: its label, the text, its content blocks, the like count and the
// replies. Each part arrives when it is itself on screen.
function Post({ post }: { post: PostData }) {
  const [liked, setLiked] = useState(false);
  const comments = post.comments ?? [];
  return (
    <article id={post.id} className="post">
      <div className="tag">
        <Rv as="span" kind="pop" className="tag-mark">
          <Mark size={10} finish="flat" />
        </Rv>
        <T text={post.tag} />
      </div>
      {post.text.map((t, n) => (
        <T key={n} as="p" text={t} className="post-text" delay={n * 0.1} />
      ))}
      {post.blocks && (
        <div className="post-block">
          {post.blocks.map((k) => (
            <div key={k} className="post-block-item">
              {block(k, post)}
            </div>
          ))}
        </div>
      )}
      <Rv kind="pop" className="post-foot">
        <button type="button" className="like" aria-pressed={liked} aria-label={liked ? "Unlike" : "Like"} onClick={() => setLiked((v) => !v)}>
          <i aria-hidden />
          <span className="roll">
            <span>
              {post.likes}
              <br />
              {post.likes + 1}
            </span>
          </span>
        </button>
        {comments.length > 0 && <span className="meta">{comments.length === 1 ? "1 reply" : `${comments.length} replies`}</span>}
      </Rv>
      {comments.length > 0 && <Replies items={comments} />}
    </article>
  );
}

// A run: everything one person posts in a row, with that person shown once
// beside it. The picture, name and role stay on screen for as long as the
// run does and are pushed out by the next person.
function Run({ by, items }: { by: Author; items: PostData[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useSeen(ref);
  const person = people[by];
  return (
    <section className="run" data-by={by}>
      <Rv kind="rule" className="rule run-rule" />
      <div className="rail">
        <div ref={ref} className="who">
          <Avatar who={by} size={40} play={seen} halftone />
          <span className="who-text">
            <T text={person.name} className="who-name" play={seen} delay={0.15} />
            <T text={person.role} className="who-role" play={seen} delay={0.2} />
          </span>
        </div>
      </div>
      <div className="run-posts">
        {items.map((p) => (
          <Post key={p.id} post={p} />
        ))}
      </div>
    </section>
  );
}

// The first fold: the opening (and its backdrop, when given) stays put while
// the rest of the page slides up over it like a curtain. While it is being
// covered it drifts up a little, shrinks and fades (--p runs 0 to 1); once it
// is fully covered it is hidden and the backdrop pauses. If the opening is
// taller than the screen it first scrolls until its foot is in view, then
// holds there.
function Fold({ backdrop, children }: { backdrop?: ReactNode; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [covered, setCovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let span = { from: 0, to: 1 };
    let last = -1;
    let isCovered = false;
    const measure = () => {
      const bar = parseFloat(getComputedStyle(el).getPropertyValue("--bar")) || 56;
      const h = el.offsetHeight;
      const top = Math.min(bar, window.innerHeight - h);
      el.style.setProperty("--fold-top", `${top}px`);
      // The curtain's top edge enters at the foot of the screen and has
      // covered the fold once it reaches the fold's held position.
      span = { from: Math.max(0, bar + h - window.innerHeight), to: bar + h - top };
    };
    const update = () => {
      raf = 0;
      const p = Math.min(1, Math.max(0, (window.scrollY - span.from) / Math.max(1, span.to - span.from)));
      if (Math.abs(p - last) > 0.0005) {
        last = p;
        el.style.setProperty("--p", p.toFixed(4));
      }
      const c = p >= 0.999;
      if (c !== isCovered) {
        isCovered = c;
        setCovered(c);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      onScroll();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(el);
    measure();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const fold = useMemo(() => ({ covered }), [covered]);
  return (
    <FoldContext.Provider value={fold}>
      <div ref={ref} className="opening" data-covered={covered || undefined}>
        <div className="opening-inner">
          {backdrop && (
            <div className="backdrop" aria-hidden>
              {backdrop}
            </div>
          )}
          {children}
        </div>
      </div>
    </FoldContext.Provider>
  );
}

// The page. It builds up once: a ring of dots while the type loads, then the
// top bar drops in and the first post arrives. Scrolling is the browser's own.
// A backdrop, when given, fills the first screen behind the opening.
export function Feed({ backdrop }: { backdrop?: ReactNode } = {}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const wait = new Promise((r) => setTimeout(r, reducedMotion() ? 0 : 1400));
    Promise.all([wait, document.fonts?.ready]).then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  // A button may move the page; that is the reader asking for it.
  const goTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  }, []);
  const ctx = useMemo(() => ({ ready, goTo }), [ready, goTo]);

  // Posts in a row by the same person share one run.
  const runs = useMemo(() => {
    const out: { by: Author; items: PostData[] }[] = [];
    posts.forEach((p) => {
      const last = out[out.length - 1];
      if (last && last.by === p.by) last.items.push(p);
      else out.push({ by: p.by, items: [p] });
    });
    return out;
  }, []);

  return (
    <FeedContext.Provider value={ctx}>
      <div className="feed-root" data-ready={ready || undefined}>
        <div className="boot" aria-hidden>
          <Mark size={48} morph period={2.4} hold={0.1} />
        </div>

        <header className="bar">
          <a href="/" className="bar-mark" aria-label="KUIX, main site">
            <Mark size={24} className="fold-mark" label="KUIX" />
            <span>KUIX</span>
          </a>
          <button type="button" className="btn bar-cta" onClick={() => goTo("contact")}>
            Start a project
          </button>
        </header>

        <main>
          <Fold backdrop={backdrop}>
            <Hero />
          </Fold>
          <div className="curtain">
            <div className="feed">
              {runs.map((r) => (
                <Run key={r.items[0].id} by={r.by} items={r.items} />
              ))}
            </div>
            <Closing />
          </div>
        </main>

        <footer className="foot">
          <span className="foot-brand">
            <Mark size={16} finish="flat" /> KUIX · Design and development agency
          </span>
          <span className="foot-mail">{closing.email}</span>
          <nav aria-label="Main site">
            {routes.map((r) => (
              <a key={r.href} href={r.href}>
                {r.label}
              </a>
            ))}
          </nav>
        </footer>
      </div>
    </FeedContext.Provider>
  );
}
