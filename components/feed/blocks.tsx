"use client";
import { useContext, useEffect, useRef, useState, type FormEvent } from "react";
import {
  buildLog,
  buildRules,
  chats,
  impact,
  industries,
  method,
  methodNotes,
  metrics,
  order,
  partners,
  people,
  phases,
  posts,
  reply,
  services,
  smallPrint,
  stack,
  strip,
  values,
  work,
  type Comment,
} from "@/content/feed";
import { workStatus } from "@/content/copy";
import { MethodIcon, ServiceIcon } from "../blocks/parts";
import { Avatar, clamp, Counter, Dots, FeedContext, reducedMotion, Rv, T, Typing, useOnScreen, useSeen, vars, weather } from "./core";

// ---- Pinned: the profile. A cover of drifting dots, the three people (each
// row takes you to that person's first post), who trusts us, the two ways on.
export function Profile() {
  const { goTo } = useContext(FeedContext);
  return (
    <>
      <Rv className="panel cover">
        <Dots fn={weather} cell={7} alpha={0.42} className="cover-dots" />
      </Rv>
      <div className="people">
        {order.map((w, n) => (
          <Person key={w} who={w} n={n} />
        ))}
      </div>
      <div className="trusted">
        <T text="Trusted by" className="meta" />
        <T text={partners.join("  ·  ")} className="trusted-list" delay={0.06} />
      </div>
      <Rv kind="pop" className="row">
        <button type="button" className="btn" onClick={() => goTo("contact")}>
          Start a project
        </button>
        <button type="button" className="btn btn-line" onClick={() => goTo("work")}>
          Selected work
        </button>
      </Rv>
    </>
  );
}

function Person({ who, n }: { who: (typeof order)[number]; n: number }) {
  const { goTo } = useContext(FeedContext);
  const ref = useRef<HTMLButtonElement>(null);
  const seen = useSeen(ref);
  const d = n * 0.07;
  return (
    <button ref={ref} type="button" className="person" onClick={() => goTo(posts.find((p) => p.by === who)!.id)}>
      <Rv kind="rule" className="rule" play={seen} delay={d} />
      <Avatar who={who} size={40} play={seen} />
      <span className="person-text">
        <T as="b" text={people[who].name} play={seen} delay={d} />
        <T text={people[who].role} className="meta" play={seen} delay={0.05 + d} />
      </span>
      <T text={people[who].bio} className="person-bio" play={seen} delay={0.1 + d} />
      <span className="arrow" aria-hidden />
    </button>
  );
}

// ---- Method: a timeline applied by the scroll. The line fills as the block
// passes through the screen; each step switches on as the line reaches it:
// its icon is drawn, its text turns to ink and Barnabás's note rises into
// the space kept for it. Scrolling back undoes it. Nothing changes height.
export function Method() {
  const root = useRef<HTMLDivElement>(null);
  const visible = useOnScreen(root);
  const [on, setOn] = useState(0);
  useEffect(() => {
    const el = root.current;
    if (!el || !visible) return;
    const steps = [...el.querySelectorAll<HTMLElement>(".tl-step")];
    if (reducedMotion()) {
      el.style.setProperty("--p", "1");
      setOn(steps.length);
      return;
    }
    let raf = 0;
    const loop = () => {
      const r = el.getBoundingClientRect();
      const p = clamp((window.innerHeight * 0.7 - r.top) / r.height);
      el.style.setProperty("--p", p.toFixed(4));
      setOn(steps.filter((s) => p >= (s.offsetTop + 24) / r.height).length);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  return (
    <Rv className="panel tl">
      <div ref={root} className="tl-in">
        <span className="tl-line" aria-hidden>
          <span />
        </span>
        {method.steps.map((s, n) => (
          <div key={s.key} className="tl-step" data-on={n < on || undefined}>
            <span className="tl-dot" aria-hidden />
            <div className="tl-main">
              <T text={`Step ${n + 1} of ${method.steps.length}`} className="meta" play={n < on} />
              <T as="h3" text={s.title} play={n < on} delay={0.05} />
              <T as="p" text={s.body} className="tl-body" play={n < on} delay={0.1} />
              <div className="note">
                <Avatar who="barnabas" size={24} play={n < on} />
                <T text={methodNotes[n]} play={n < on} delay={0.2} />
              </div>
            </div>
            <Rv as="span" kind="wipe-x" className="icon" play={n < on} delay={0.1}>
              <MethodIcon name={s.key} />
            </Rv>
          </div>
        ))}
      </div>
    </Rv>
  );
}

// ---- Itinerary: the four phases as rows that open one at a time. Opening a
// row is the reader's doing, so this is the one place a block changes height.
export function Itinerary() {
  const [open, setOpen] = useState(0);
  return (
    <>
      <Rv className="panel list">
        {services.map((s, n) => (
          <div key={s.title} className="phase" data-open={open === n || undefined}>
            <button type="button" className="phase-head" aria-expanded={open === n} onClick={() => setOpen(open === n ? -1 : n)}>
              <T text={String(n + 1).padStart(2, "0")} className="meta" delay={n * 0.05} />
              <T as="b" text={s.title} delay={n * 0.05} />
              <T text={phases[n].length} className="meta phase-len" delay={n * 0.05} />
              <span className="stack-av">
                {phases[n].lead.map((w) => (
                  <Avatar key={w} who={w} size={24} />
                ))}
              </span>
              <span className="plus" aria-hidden />
            </button>
            <div className="fold">
              <div>
                <div className="phase-body">
                  <Rv as="span" kind="wipe-x" className="icon" play={open === n} delay={0.15}>
                    <ServiceIcon name={s.icon} />
                  </Rv>
                  <div className="phase-text">
                    <T as="p" text={s.body} play={open === n} delay={0.1} />
                    <T text="You leave with" className="meta" play={open === n} delay={0.18} />
                    <T as="p" text={phases[n].get} play={open === n} delay={0.22} />
                    <div className="chips">
                      {s.deliverables.map((d, k) => (
                        <span key={d} className="chip">
                          <T text={d} play={open === n} delay={0.3 + k * 0.04} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Rv>
      <T as="p" text={smallPrint} className="small" />
    </>
  );
}

// ---- Build log: the rules, a log that keeps receiving entries (inside a
// window of fixed height), the stack.
const ROWS = 4;
export function BuildLog() {
  const root = useRef<HTMLDivElement>(null);
  const visible = useOnScreen(root);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!visible || reducedMotion()) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 3200);
    return () => clearInterval(id);
  }, [visible]);
  const n = buildLog.length;
  // Newest on top: each tick brings the previous entry of the list in above.
  const rows = Array.from({ length: ROWS + 1 }, (_, k) => buildLog[(((k - tick) % n) + n) % n]);
  return (
    <>
      <ul className="rules">
        {buildRules.map((r, k) => (
          <li key={r}>
            <Rv as="span" kind="pop" className="bullet" delay={k * 0.06} />
            <T text={r} delay={k * 0.06} />
          </li>
        ))}
      </ul>
      <Rv className="panel log">
        <div ref={root} className="log-head">
          <span className="live" aria-hidden />
          <T text="Halcyon, this week" className="meta" />
        </div>
        <div className="log-view">
          <div key={tick} className="log-roll" data-move={tick > 0 || undefined}>
            {rows.map((r, k) => (
              <div key={k} className="log-row">
                <span>{r[0]}</span>
                <span>{r[1]}</span>
                <span>{r[2]}</span>
              </div>
            ))}
          </div>
        </div>
      </Rv>
      <div className="chips">
        {stack.map((s, k) => (
          <span key={s} className="chip">
            <T text={s} delay={k * 0.04} />
          </span>
        ))}
      </div>
    </>
  );
}

// ---- Metrics: two results, counted up, drawn in dots.
export function Metrics() {
  return (
    <div className="metrics">
      {metrics.map((m, n) => (
        <Rv key={m.client} className="panel metric" delay={n * 0.08}>
          <T text={`${m.client} · ${m.what}`} className="meta" delay={n * 0.08} />
          <Counter value={m.value} decimals={m.decimals} suffix={m.suffix} className="big" />
          <T text={m.note} className="meta" delay={0.1 + n * 0.08} />
          <DotRows before={m.before} after={m.after} />
        </Rv>
      ))}
    </div>
  );
}
function DotRows({ before, after }: { before: number; after: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useSeen(ref);
  return (
    <div ref={ref} className="dotrows" data-in={seen || undefined} aria-hidden>
      {before > 0 && (
        <div className="dotrow dotrow-before">
          {Array.from({ length: before }, (_, k) => (
            <span key={k} style={vars({ "--i": k })} />
          ))}
        </div>
      )}
      <div className="dotrow">
        {Array.from({ length: after }, (_, k) => (
          <span key={k} style={vars({ "--i": k })} />
        ))}
      </div>
    </div>
  );
}

// ---- The three numbers.
export function Numbers() {
  return (
    <div className="numbers">
      {impact.map((m, n) => (
        <Rv key={m.label} className="panel metric" delay={n * 0.08}>
          <Counter value={m.value} suffix={m.suffix} className="big" />
          <T as="b" text={m.label} delay={0.08 + n * 0.08} />
          <T text={m.note} className="meta" delay={0.14 + n * 0.08} />
        </Rv>
      ))}
    </div>
  );
}

// ---- Project board: the work table, filtered in place by the reader.
type BoardFilter = "all" | "active" | "done";
export function Board() {
  const [f, setF] = useState<BoardFilter>("all");
  const count = (k: BoardFilter) => (k === "all" ? work.length : work.filter((w) => w.status === k).length);
  const tabs: [BoardFilter, string][] = [
    ["all", "All"],
    ["active", workStatus.active],
    ["done", workStatus.done],
  ];
  return (
    <Rv className="panel board">
      <div className="tabs" role="group" aria-label="Filter projects">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" className="tab" aria-pressed={f === k} onClick={() => setF(k)}>
            {label} <span>{count(k)}</span>
          </button>
        ))}
      </div>
      <div className="board-rows">
        {work.map((w) => {
          const shown = f === "all" || f === w.status;
          return (
            <div key={w.client} className="fold board-fold" data-open={shown || undefined}>
              <div>
                <div className="board-row">
                  <T as="b" text={w.client} />
                  <T text={w.platform} />
                  <T text={w.sector} className="board-sector" />
                  <span className="status" data-status={w.status}>
                    <T text={w.status === "active" ? "Active" : "Delivered"} />
                  </span>
                  <T text={w.year} className="meta board-year" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Rv>
  );
}

// ---- Sectors: a row to drag or step through.
export function Sectors() {
  const track = useRef<HTMLDivElement>(null);
  const step = (dir: number) => track.current?.scrollBy({ left: dir * 232, behavior: "smooth" });
  return (
    <div className="sectors">
      <div ref={track} className="sectors-track">
        {industries.map((s, n) => (
          <Rv key={s.name} className="panel sector" delay={n * 0.06}>
            <Counter value={s.count} className="big" />
            <T text="projects" className="meta" delay={n * 0.06} />
            <T as="b" text={s.name} delay={0.08 + n * 0.06} />
            <T as="p" text={s.body} delay={0.12 + n * 0.06} />
          </Rv>
        ))}
      </div>
      <Rv kind="pop" className="row">
        <button type="button" className="round" aria-label="Previous sectors" onClick={() => step(-1)}>
          <span className="arrow arrow-l" aria-hidden />
        </button>
        <button type="button" className="round" aria-label="Next sectors" onClick={() => step(1)}>
          <span className="arrow" aria-hidden />
        </button>
      </Rv>
    </div>
  );
}

// ---- Photos: six moments. Until the real photos arrive each tile is a
// screened tint with its caption.
export function Photos() {
  return (
    <>
      <div className="photos">
        {strip.slice(0, 6).map((caption, n) => (
          <Rv as="figure" key={caption} className="photo" data-n={n} delay={(n % 3) * 0.07}>
            <span className="photo-dots" aria-hidden />
            <T as="figcaption" text={caption} delay={0.2 + (n % 3) * 0.07} />
          </Rv>
        ))}
      </div>
      <div className="chips">
        {values.map((v, k) => (
          <span key={v.title} className="chip" title={v.body}>
            <T text={v.title} delay={k * 0.04} />
          </span>
        ))}
      </div>
    </>
  );
}

// ---- A shared message thread. Every message has its place from the start;
// the bubbles are uncovered one after the other.
export function Chat({ index }: { index: number }) {
  const conv = chats[index];
  const body = useRef<HTMLDivElement>(null);
  const seen = useSeen(body);
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!seen) return;
    if (reducedMotion()) return setCount(conv.messages.length);
    const timers: number[] = [];
    let t = 200;
    conv.messages.forEach((m, n) => {
      timers.push(window.setTimeout(() => setCount(n + 1), t));
      t += 380 + m.text.length * 9;
    });
    return () => timers.forEach(clearTimeout);
  }, [seen, conv]);
  return (
    <Rv className="panel chat" role="log" aria-label={`Messages between ${conv.us} and ${conv.them}`}>
      <div className="chat-head">
        <T as="b" text={conv.them} />
        <T text={conv.themRole} className="meta" delay={0.05} />
      </div>
      <div ref={body} className="chat-body">
        {conv.messages.map((m, n) => (
          <div key={n} className="bubble" data-from={m.from} data-on={n < count || undefined}>
            <T text={m.text} play={n < count} delay={0.1} />
          </div>
        ))}
      </div>
    </Rv>
  );
}

// ---- Replies under a post. Their space is there from the start. When they
// come on screen each one types for a moment, then its lines rise in.
export function Replies({ items }: { items: Comment[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useSeen(ref);
  const [typing, setTyping] = useState(0);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (!seen) return;
    if (reducedMotion()) {
      setTyping(items.length);
      setShown(items.length);
      return;
    }
    const timers: number[] = [];
    items.forEach((_, n) => {
      timers.push(window.setTimeout(() => setTyping(n + 1), 300 + n * 1500));
      timers.push(window.setTimeout(() => setShown(n + 1), 1100 + n * 1500));
    });
    return () => timers.forEach(clearTimeout);
  }, [seen, items]);
  return (
    <div ref={ref} className="replies">
      {items.map((c, n) => (
        <div key={n} className="reply-row">
          <Avatar who={c.who} size={24} play={n < typing} />
          <div className="reply-text">
            <T as="b" text={people[c.who].name} play={n < typing} />
            <span className="reply-body">
              <Typing on={n < typing && n >= shown} />
              <T text={c.text} play={n < shown} />
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Reply to Lejla: the brief as a reply box. Sending puts your message in
// the thread and she answers. Nothing is sent anywhere yet.
export function Reply() {
  const [sent, setSent] = useState<{ name: string; text: string } | null>(null);
  const [answered, setAnswered] = useState(false);
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
    <div>
      <div className="fold" data-open={!sent || undefined}>
        <div>
          <Rv className="panel">
            <form className="reply" onSubmit={submit}>
              <label htmlFor="brief" className="meta">
                {reply.label}
              </label>
              <textarea id="brief" name="brief" placeholder={reply.placeholder} required rows={1} />
              <div className="fold reply-more">
                <div>
                  <div className="reply-fields">
                    <input name="name" placeholder="Your name" aria-label="Your name" autoComplete="name" />
                    <input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="email" />
                    <button type="submit" className="btn">
                      Send brief
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </Rv>
        </div>
      </div>
      <div className="fold" data-open={!!sent || undefined}>
        <div>
          {sent && (
            <div className="replies">
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
              <div className="reply-row">
                <Avatar who="lejla" size={24} />
                <div className="reply-text">
                  <T as="b" text={people.lejla.name} play />
                  <span className="reply-body">
                    <Typing on={!answered} />
                    <T text={reply.answer(sent.name)} play={answered} />
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
