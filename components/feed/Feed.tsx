"use client";
import { useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Lenis from "lenis";
import { end, order, people, posts, reply, type PostData, type Who } from "@/content/feed";
import { routes } from "@/lib/routes";
import { KXMark } from "../shell/Logo";
import { Board, BuildLog, Chat, Itinerary, Method, Metrics, Numbers, Photos, Profile, Reply, Sectors } from "./blocks";
import { Avatar, Dots, FeedContext, Mask, PostContext, reducedMotion, ring, Typing, useInView } from "./core";

const block = (p: PostData): ReactNode => {
  switch (p.block) {
    case "profile": return <Profile />;
    case "method": return <Method />;
    case "itinerary": return <Itinerary />;
    case "buildlog": return <BuildLog />;
    case "metrics": return <Metrics />;
    case "board": return <Board />;
    case "sectors": return <Sectors />;
    case "photos": return <Photos />;
    case "chat": return <Chat index={p.chat ?? 0} />;
    case "numbers": return <Numbers />;
    case "reply": return <Reply />;
    default: return null;
  }
};

// One post. Left, the author: picture, name and role stay beside the post
// while it scrolls and are pushed out by the next author. Right, the post:
// text, its content block, the like count and the replies. Everything waits
// for the post to reach the screen, then arrives in that order.
function Post({ post }: { post: PostData }) {
  const { ready, filter, setFilter } = useContext(FeedContext);
  const ref = useRef<HTMLElement>(null);
  const seen = useInView(ref, { once: true, enabled: ready });
  const [liked, setLiked] = useState(false);
  const [shown, setShown] = useState(0);
  const [typed, setTyped] = useState(0);
  const person = post.by === "kuix" ? null : people[post.by];
  const hidden = filter !== null && post.by !== filter;
  const comments = post.comments ?? [];
  const ctx = useMemo(() => ({ seen }), [seen]);

  useEffect(() => {
    if (!seen || !comments.length) return;
    if (reducedMotion()) {
      setShown(comments.length);
      setTyped(comments.length);
      return;
    }
    const timers: number[] = [];
    comments.forEach((_, n) => {
      timers.push(window.setTimeout(() => setShown(n + 1), 1500 + n * 1700));
      timers.push(window.setTimeout(() => setTyped(n + 1), 2500 + n * 1700));
    });
    return () => timers.forEach(clearTimeout);
  }, [seen, comments.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const who = (
    <>
      <span className="who-name">
        <Mask as="span" text={person ? person.name : "KUIX"} />
      </span>
      <span className="who-role">
        <Mask as="span" text={person ? person.role : "Design and development agency"} delay={0.06} />
      </span>
    </>
  );

  return (
    <article ref={ref} id={post.id} className="post fold" data-by={post.by} data-in={seen || undefined} data-open={!hidden || undefined} aria-hidden={hidden || undefined}>
      <div>
        <div className="post-grid">
          <div className="rail">
            <button
              type="button"
              className="who"
              disabled={!person}
              aria-label={person ? `Show only posts by ${person.name}` : undefined}
              aria-pressed={person ? filter === post.by : undefined}
              onClick={() => person && setFilter(filter === post.by ? null : (post.by as Who))}
            >
              <Avatar who={post.by} size={56} play={seen} halftone />
              <span className="who-text">{who}</span>
            </button>
          </div>
          <div className="post-main">
            <div className="post-head">
              <span className="post-head-who">
                <Avatar who={post.by} size={36} play={seen} />
                <b>{person ? person.name : "KUIX"}</b>
              </span>
              <span className="tag">{post.tag}</span>
            </div>
            {post.text.map((t, n) => (
              <Mask key={n} text={t} className={post.id === "pinned" && n === 0 ? "post-text post-text-xl" : "post-text"} delay={0.1 + n * 0.16} />
            ))}
            <PostContext.Provider value={ctx}>
              {post.block && <div className="post-block">{block(post)}</div>}
            </PostContext.Provider>
            <div className="post-foot rise" style={{ ["--i" as string]: 4 }}>
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
            </div>
            {comments.length > 0 && (
              <div className="comments">
                {comments.map((c, n) => (
                  <div key={n} className="fold" data-open={n < shown || undefined}>
                    <div>
                      <div className="comment" data-on={n < shown || undefined}>
                        <Avatar who={c.who} size={28} play={n < shown} />
                        <p>
                          <b>{people[c.who].name}</b>
                          {n < typed ? c.text : <Typing />}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// The page. It builds up once: a ring of dots while the type loads, then the
// top bar drops in and the posts start arriving. After that the only state is
// who you are reading: everyone, or one of the three.
export function Feed() {
  const [ready, setReady] = useState(false);
  const [filter, setFilterState] = useState<Who | null>(null);
  const lenis = useRef<Lenis | null>(null);

  useEffect(() => {
    let alive = true;
    const wait = new Promise((r) => setTimeout(r, reducedMotion() ? 0 : 1500));
    Promise.all([wait, document.fonts?.ready]).then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (reducedMotion()) return;
    const l = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
    lenis.current = l;
    let raf = 0;
    const tick = (t: number) => {
      l.raf(t);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      l.destroy();
      lenis.current = null;
    };
  }, []);

  const scrollTo = useCallback((target: HTMLElement | number) => {
    if (lenis.current) lenis.current.scrollTo(target, { offset: -84, duration: 1.4 });
    else if (typeof target === "number") window.scrollTo({ top: target });
    else target.scrollIntoView();
  }, []);
  const goTo = useCallback(
    (id: string) => {
      setFilterState(null);
      // Wait for a filtered feed to open again before measuring.
      window.setTimeout(() => {
        const el = document.getElementById(id);
        if (el) scrollTo(el);
      }, 60);
    },
    [scrollTo],
  );
  const setFilter = useCallback(
    (w: Who | null) => {
      setFilterState(w);
      scrollTo(0);
    },
    [scrollTo],
  );
  const ctx = useMemo(() => ({ ready, filter, setFilter, goTo }), [ready, filter, setFilter, goTo]);

  return (
    <FeedContext.Provider value={ctx}>
      <div className="feed-root" data-ready={ready || undefined}>
        <div className="wash" aria-hidden>
          <i />
          <i />
          <i />
        </div>
        <div className="boot" aria-hidden>
          <Dots fn={ring} cell={6} alpha={0.9} className="boot-ring" />
        </div>

        <header className="bar">
          <a href="/" className="bar-mark" aria-label="KUIX, main site">
            <KXMark size={22} />
          </a>
          <div className="bar-filter" role="group" aria-label="Who to read">
            <button type="button" className="pill" aria-pressed={filter === null} onClick={() => setFilter(null)}>
              Everyone
            </button>
            {order.map((w) => (
              <button key={w} type="button" className="pill pill-av" data-who={w} aria-pressed={filter === w} onClick={() => setFilter(filter === w ? null : w)}>
                <Avatar who={w} size={24} />
                <span>{people[w].name}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn bar-cta" onClick={() => goTo("contact")}>
            Start a project
          </button>
        </header>

        <main className="feed">
          {posts.map((p) => (
            <Post key={p.id} post={p} />
          ))}
          <div className="end">
            <span className="end-ring">
              <Dots fn={ring} cell={4} alpha={0.7} />
            </span>
            <p>{end}</p>
            <button type="button" className="btn btn-line" onClick={() => scrollTo(0)}>
              Back to the top
            </button>
          </div>
        </main>

        <footer className="foot">
          <span>KUIX · Design and development agency</span>
          <span className="foot-mail">{reply.email}</span>
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
