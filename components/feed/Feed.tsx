"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { end, people, posts, reply, type Author, type PostBlock, type PostData } from "@/content/feed";
import { routes } from "@/lib/routes";
import { FoldMark } from "./Mark";
import { Board, BuildLog, Chat, Itinerary, Method, Metrics, Numbers, Photos, Profile, Replies, Reply, Sectors } from "./blocks";
import { Avatar, Dots, FeedContext, reducedMotion, ring, Rv, T, useSeen } from "./core";

const block = (kind: PostBlock, p: PostData): ReactNode => {
  switch (kind) {
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
        <Rv as="span" kind="pop" className="tag-dot" />
        <T text={post.tag} />
      </div>
      {post.text.map((t, n) => (
        <T key={n} as="p" text={t} className={post.id === "pinned" && n === 0 ? "post-text post-text-xl" : "post-text"} delay={n * 0.1} />
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
  const person = by === "kuix" ? null : people[by];
  return (
    <section className="run" data-by={by}>
      <Rv kind="rule" className="rule run-rule" />
      <div className="rail">
        <div ref={ref} className="who">
          <Avatar who={by} size={40} play={seen} halftone />
          <span className="who-text">
            <T text={person ? person.name : "KUIX"} className="who-name" play={seen} delay={0.15} />
            <T text={person ? person.role : "Design and development agency"} className="who-role" play={seen} delay={0.2} />
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

// The page. It builds up once: a ring of dots while the type loads, then the
// top bar drops in and the first post arrives. Scrolling is the browser's own.
export function Feed() {
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
    const el = id === "top" ? document.body : document.getElementById(id);
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
          <Dots fn={ring} cell={6} alpha={0.9} className="boot-ring" />
        </div>

        <header className="bar">
          <a href="/" className="bar-mark" aria-label="KUIX, main site">
            <FoldMark size={24} />
            <span>KUIX</span>
          </a>
          <button type="button" className="btn bar-cta" onClick={() => goTo("contact")}>
            Start a project
          </button>
        </header>

        <main className="feed">
          {runs.map((r) => (
            <Run key={r.items[0].id} by={r.by} items={r.items} />
          ))}
          <div className="end">
            <Rv kind="rule" className="rule run-rule" />
            <span className="end-ring">
              <Dots fn={ring} cell={4} alpha={0.7} />
            </span>
            <T as="p" text={end} />
            <Rv kind="pop">
              <button type="button" className="btn btn-line" onClick={() => goTo("top")}>
                Back to the top
              </button>
            </Rv>
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
