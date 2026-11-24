"use client";
import { useContext, useEffect, useRef, useState, type FormEvent } from "react";
import { closing, hero, order, partners, people, posts } from "@/content/feed";
import { Avatar, clamp, FeedContext, reducedMotion, Rv, T, Typing, useOnScreen, useSeen, vars } from "./core";
import { Mark } from "./Mark";

// ---- The opening. Not a post: one centred column. The mark, what KUIX is,
// the three people (each takes you to their first post) and the way on.
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
      <div className="hero-people">
        {order.map((w, n) => (
          <HeroPerson key={w} who={w} n={n} />
        ))}
      </div>
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
function HeroPerson({ who, n }: { who: (typeof order)[number]; n: number }) {
  const { goTo } = useContext(FeedContext);
  const ref = useRef<HTMLButtonElement>(null);
  const seen = useSeen(ref);
  const d = 0.6 + n * 0.08;
  return (
    <button ref={ref} type="button" className="hero-person" onClick={() => goTo(posts.find((p) => p.by === who)!.id)}>
      <Avatar who={who} size={56} play={seen} halftone />
      <T as="b" text={people[who].name} play={seen} delay={d} />
      <T text={people[who].role} className="meta" play={seen} delay={d + 0.05} />
    </button>
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
