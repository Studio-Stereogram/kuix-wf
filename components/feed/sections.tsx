"use client";
import { useContext, useEffect, useRef, useState, type FormEvent } from "react";
import { closing, hero, order, partners, people, posts, studio } from "@/content/feed";
import { Avatar, clamp, FeedContext, reducedMotion, Rv, T, Typing, useOnScreen, useSeen, vars } from "./core";
import { Mark } from "./Mark";

// ---- The opening. Not a post: one centred column. The mark, what KUIX is,
// the studio at a glance (each lead takes you to their first post) and the
// way on.
export function Hero() {
  const { goTo, ready } = useContext(FeedContext);
  return (
    <section className="hero" id="top">
      <div className="hero-mark" data-on={ready || undefined}>
        <Mark size={72} morph period={8} label="KUIX" />
      </div>
      <T text={hero.label} className="eyebrow" delay={0.25} />
      <T as="h2" text={hero.title} className="hero-title" delay={0.3} />
      <T as="p" text={hero.text} className="hero-text" delay={0.5} />
      <Studio />
      <Rv kind="pop" className="row hero-row" delay={0.9}>
        <button type="button" className="btn" onClick={() => goTo("contact")}>
          {hero.cta}
        </button>
        <button type="button" className="btn btn-line" onClick={() => goTo(posts[0].id)}>
          {hero.more}
        </button>
      </Rv>
      <div className="hero-trusted">
        <T text={hero.trusted} className="meta" play={ready} delay={1} />
        <T text={partners.join("  ·  ")} className="trusted-list" play={ready} delay={1.05} />
      </div>
    </section>
  );
}
// The studio in three groups, so it reads as what it is: the three leads
// (photos; each opens their first post), the rest of the studio by
// discipline, and the network of specialists brought in per project.
function Studio() {
  const { goTo } = useContext(FeedContext);
  const ref = useRef<HTMLDivElement>(null);
  const seen = useSeen(ref);
  return (
    <div ref={ref} className="studio">
      <div className="studio-group studio-leads">
        <div className="studio-faces">
          {order.map((w, n) => (
            <button
              key={w}
              type="button"
              className="studio-face"
              style={vars({ "--i": n })}
              aria-label={`${people[w].name}, ${people[w].role}. Read their first post.`}
              title={`${people[w].name}, ${people[w].role}`}
              onClick={() => goTo(posts.find((p) => p.by === w)!.id)}
            >
              <Avatar who={w} size={52} play={seen} halftone />
            </button>
          ))}
        </div>
        <T as="b" text={studio.leads} play={seen} delay={0.6} />
        <T text={order.map((w) => people[w].name).join(", ")} className="meta" play={seen} delay={0.65} />
      </div>
      <div className="studio-group">
        <div className="studio-faces" role="list" aria-label={studio.team.title}>
          {studio.team.members.map((m, n) => (
            <span key={m.short} role="listitem" className="av av-role" data-on={seen || undefined} title={m.role} aria-label={m.role} style={vars({ "--s": "44px", "--i": n + 3 })}>
              {m.short}
            </span>
          ))}
        </div>
        <T as="b" text={studio.team.title} play={seen} delay={0.7} />
        <T text={studio.team.note} className="meta" play={seen} delay={0.75} />
      </div>
      <div className="studio-group">
        <div className="studio-faces" aria-hidden>
          <span className="av av-net" data-on={seen || undefined} style={vars({ "--s": "44px", "--i": 8 })} />
          <span className="av av-net" data-on={seen || undefined} style={vars({ "--s": "44px", "--i": 9 })}>
            +
          </span>
        </div>
        <T as="b" text={studio.network.title} play={seen} delay={0.8} />
        <T text={studio.network.note} className="meta" play={seen} delay={0.85} />
      </div>
    </div>
  );
}

// ---- The close. The three people who took turns down the page come
// together, and the brief goes to all of them at once. As the section scrolls
// into view their pictures travel inwards until they overlap; the scroll sets
// how far they have come. Sending is the reader's doing, so the thread that
// opens under the box is the one place this section changes height.
export function Closing() {
  const join = useRef<HTMLDivElement>(null);
  const visible = useOnScreen(join);
  const seen = useSeen(join);
  const [sent, setSent] = useState<{ name: string; text: string } | null>(null);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    const el = join.current;
    if (!el || !visible) return;
    if (reducedMotion()) return void el.style.setProperty("--j", "1");
    let raf = 0;
    const loop = () => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 as the pictures appear at the bottom of the screen, 1 by mid-screen.
      el.style.setProperty("--j", clamp((vh - r.top) / (vh * 0.5)).toFixed(4));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const text = String(data.get("brief") ?? "").trim();
    if (!text) return;
    setSent({ name: String(data.get("name") ?? "").trim(), text });
  };
  useEffect(() => {
    if (!sent) return;
    const id = window.setTimeout(() => setAnswered(true), reducedMotion() ? 0 : 1600);
    return () => clearTimeout(id);
  }, [sent]);

  return (
    <section className="closing" id="contact">
      <Rv kind="rule" className="rule closing-rule" />
      <div ref={join} className="join" aria-hidden>
        {order.map((w, n) => (
          <span key={w} className="join-one" style={vars({ "--k": n - 1 })}>
            <Avatar who={w} size={64} play={seen} halftone />
          </span>
        ))}
      </div>
      <T text={closing.label} className="eyebrow" />
      <T as="h2" text={closing.title} className="hero-title" delay={0.05} />
      <T as="p" text={closing.text} className="hero-text" delay={0.15} />

      <div className="closing-box">
        <div className="fold" data-open={!sent || undefined}>
          <div>
            <Rv className="panel">
              <form className="reply" onSubmit={submit}>
                <label htmlFor="brief" className="meta">
                  {closing.field}
                </label>
                <textarea id="brief" name="brief" placeholder={closing.placeholder} required rows={3} />
                <div className="reply-fields">
                  <input name="name" placeholder="Your name" aria-label="Your name" autoComplete="name" />
                  <input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="email" />
                  <button type="submit" className="btn">
                    {closing.send}
                  </button>
                </div>
              </form>
            </Rv>
          </div>
        </div>
        <div className="fold" data-open={!!sent || undefined}>
          <div>
            {sent && (
              <div className="replies closing-thread">
                <div className="reply-row">
                  <span className="av av-you" data-on="" style={vars({ "--s": "24px" })} aria-hidden>
                    {(sent.name[0] ?? "Y").toUpperCase()}
                  </span>
                  <div className="reply-text">
                    <T as="b" text={sent.name || "You"} play />
                    <span className="reply-body">
                      <T text={sent.text} play delay={0.1} />
                    </span>
                  </div>
                </div>
                <div className="reply-row reply-row-group">
                  <span className="stack-av">
                    {order.map((w) => (
                      <Avatar key={w} who={w} size={24} />
                    ))}
                  </span>
                  <div className="reply-text">
                    <T as="b" text={order.map((w) => people[w].name).join(", ")} play />
                    <span className="reply-body">
                      <Typing on={!answered} />
                      <T text={closing.answer(sent.name)} play={answered} />
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <T as="p" text={closing.small} className="small closing-small" />
      <span className="foot-mail closing-mail">{closing.email}</span>
    </section>
  );
}
