"use client";
import { useContext, useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
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
  reply,
  services,
  smallPrint,
  stack,
  strip,
  values,
  work,
} from "@/content/feed";
import { workStatus } from "@/content/copy";
import { Avatar, clamp, Counter, Dots, FeedContext, Mask, reducedMotion, Typing, useInView, usePost, weather } from "./core";

const i = (n: number) => ({ ["--i" as string]: n }) as CSSProperties;

// ---- Pinned: the profile. A cover of drifting dots, the three people (each
// one filters the feed), who follows, and the two ways on.
export function Profile() {
  const { filter, setFilter, goTo } = useContext(FeedContext);
  return (
    <>
      <div className="embed cover rise" style={i(0)}>
        <Dots fn={weather} cell={7} alpha={0.42} className="cover-dots" />
      </div>
      <div className="people rise" style={i(1)}>
        {order.map((w) => (
          <button key={w} type="button" className="person" data-who={w} aria-pressed={filter === w} onClick={() => setFilter(filter === w ? null : w)}>
            <Avatar who={w} size={44} />
            <span>
              <b>{people[w].name}</b>
              <small>{people[w].role}</small>
            </span>
          </button>
        ))}
      </div>
      <p className="followed rise" style={i(2)}>
        <span>Trusted by</span>
        {partners.map((p) => (
          <i key={p}>{p}</i>
        ))}
      </p>
      <div className="row rise" style={i(3)}>
        <button type="button" className="btn" onClick={() => goTo("contact")}>
          Start a project
        </button>
        <button type="button" className="btn btn-line" onClick={() => goTo("work")}>
          Selected work
        </button>
      </div>
    </>
  );
}

// ---- Method: a timeline applied by the scroll. The line fills as the block
// passes through the screen; each step switches on as the line reaches it and
// Barnabás's note opens under it. Scrolling back undoes it.
export function Method() {
  const root = useRef<HTMLDivElement>(null);
  const visible = useInView(root, { margin: "0px" });
  useEffect(() => {
    const el = root.current;
    if (!el || !visible) return;
    const steps = [...el.querySelectorAll<HTMLElement>(".tl-step")];
    if (reducedMotion()) {
      el.style.setProperty("--p", "1");
      steps.forEach((s) => (s.dataset.on = ""));
      return;
    }
    let raf = 0;
    const loop = () => {
      const r = el.getBoundingClientRect();
      const p = clamp((window.innerHeight * 0.72 - r.top) / r.height);
      el.style.setProperty("--p", p.toFixed(4));
      steps.forEach((s) => {
        const at = (s.offsetTop + 14) / r.height;
        if (p >= at) s.dataset.on = "";
        else delete s.dataset.on;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  return (
    <div ref={root} className="embed tl rise" style={i(0)}>
      <span className="tl-line" aria-hidden>
        <span />
      </span>
      {method.steps.map((s, n) => (
        <div key={s.key} className="tl-step">
          <span className="tl-dot" aria-hidden />
          <div className="tl-main">
            <span className="meta">Step {n + 1} of {method.steps.length}</span>
            <h3>{s.title}</h3>
            <p>{s.body}</p>
            <div className="fold">
              <div>
                <div className="note">
                  <Avatar who="barnabas" size={24} />
                  <span>{methodNotes[n]}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Itinerary: the four phases as rows that open one at a time.
export function Itinerary() {
  const [open, setOpen] = useState(0);
  return (
    <>
      <div className="embed list rise" style={i(0)}>
        {services.map((s, n) => (
          <div key={s.title} className="phase" data-open={open === n || undefined}>
            <button type="button" className="phase-head" aria-expanded={open === n} onClick={() => setOpen(open === n ? -1 : n)}>
              <span className="meta">{String(n + 1).padStart(2, "0")}</span>
              <b>{s.title}</b>
              <span className="meta phase-len">{phases[n].length}</span>
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
                  <p>{s.body}</p>
                  <p>
                    <span className="meta">You leave with</span>
                    {phases[n].get}
                  </p>
                  <div className="chips">
                    {s.deliverables.map((d) => (
                      <span key={d} className="chip">{d}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className="small rise" style={i(1)}>{smallPrint}</p>
    </>
  );
}

// ---- Build log: the rules, a log that keeps receiving entries, the stack.
const ROWS = 4;
export function BuildLog() {
  const root = useRef<HTMLDivElement>(null);
  const visible = useInView(root, { margin: "0px" });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!visible || reducedMotion()) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 2800);
    return () => clearInterval(id);
  }, [visible]);
  const n = buildLog.length;
  // Newest on top: each tick brings the previous entry of the list in above.
  const rows = Array.from({ length: ROWS + 1 }, (_, k) => buildLog[(((k - tick) % n) + n) % n]);
  return (
    <>
      <ul className="rules rise" style={i(0)}>
        {buildRules.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
      <div ref={root} className="embed log rise" style={i(1)}>
        <div className="log-head meta">
          <span className="live" aria-hidden /> Halcyon, this week
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
      </div>
      <div className="chips rise" style={i(2)}>
        {stack.map((s) => (
          <span key={s} className="chip">{s}</span>
        ))}
      </div>
    </>
  );
}

// ---- Metrics: two results, counted up, drawn in dots.
export function Metrics() {
  const { seen } = usePost();
  return (
    <div className="metrics">
      {metrics.map((m, n) => (
        <div key={m.client} className="embed metric rise" style={i(n)}>
          <span className="meta">{m.client} · {m.what}</span>
          <div className="big">
            <Counter value={m.value} decimals={m.decimals} suffix={m.suffix} play={seen} />
          </div>
          <span className="meta">{m.note}</span>
          <div className="bars" aria-hidden>
            {m.before > 0 && (
              <div className="dotrow dotrow-before">
                {Array.from({ length: m.before }, (_, k) => (
                  <span key={k} style={i(k)} />
                ))}
              </div>
            )}
            <div className="dotrow">
              {Array.from({ length: m.after }, (_, k) => (
                <span key={k} style={i(k)} />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---- Project board: the work table, filtered in place.
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
    <div className="embed board rise" style={i(0)}>
      <div className="tabs" role="group" aria-label="Filter projects">
        {tabs.map(([k, label]) => (
          <button key={k} type="button" className="tab" aria-pressed={f === k} onClick={() => setF(k)}>
            {label} <span>{count(k)}</span>
          </button>
        ))}
      </div>
      <div className="board-rows">
        {work.map((w, n) => (
          <div key={w.client} className="fold board-fold" data-open={f === "all" || f === w.status || undefined}>
            <div>
              <div className="board-row" style={i(n)}>
                <b>{w.client}</b>
                <span>{w.platform}</span>
                <span className="board-sector">{w.sector}</span>
                <span className="status" data-status={w.status}>{w.status === "active" ? "Active" : "Delivered"}</span>
                <span className="meta">{w.year}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- Sectors: a row to drag or step through.
export function Sectors() {
  const track = useRef<HTMLDivElement>(null);
  const step = (dir: number) => track.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  return (
    <div className="sectors rise" style={i(0)}>
      <div ref={track} className="sectors-track">
        {industries.map((s, n) => (
          <div key={s.name} className="embed sector" style={i(n)}>
            <span className="big">{s.count}</span>
            <span className="meta">projects</span>
            <b>{s.name}</b>
            <p>{s.body}</p>
          </div>
        ))}
      </div>
      <div className="row">
        <button type="button" className="round" aria-label="Previous sectors" onClick={() => step(-1)}>
          <span className="arrow arrow-l" aria-hidden />
        </button>
        <button type="button" className="round" aria-label="Next sectors" onClick={() => step(1)}>
          <span className="arrow" aria-hidden />
        </button>
      </div>
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
          <figure key={caption} className="photo rise" data-n={n % 6} style={i(n)}>
            <span className="photo-dots" aria-hidden />
            <figcaption>{caption}</figcaption>
          </figure>
        ))}
      </div>
      <div className="chips rise" style={i(6)}>
        {values.map((v) => (
          <span key={v.title} className="chip" title={v.body}>{v.title}</span>
        ))}
      </div>
    </>
  );
}

// ---- A shared message thread: the lines arrive one by one.
export function Chat({ index }: { index: number }) {
  const conv = chats[index];
  const { seen } = usePost();
  const [count, setCount] = useState(0);
  const [typing, setTyping] = useState<"us" | "them" | null>(null);
  useEffect(() => {
    if (!seen) return;
    if (reducedMotion()) return setCount(conv.messages.length);
    const timers: number[] = [];
    let t = 900;
    conv.messages.forEach((m, n) => {
      timers.push(window.setTimeout(() => setTyping(m.from), t));
      t += m.from === "them" ? 1100 : 500 + m.text.length * 9;
      timers.push(
        window.setTimeout(() => {
          setTyping(null);
          setCount(n + 1);
        }, t),
      );
      t += 320;
    });
    return () => timers.forEach(clearTimeout);
  }, [seen, conv]);
  return (
    <div className="embed chat rise" style={i(0)} role="log" aria-label={`Messages between ${conv.us} and ${conv.them}`}>
      <div className="chat-head">
        <b>{conv.them}</b>
        <span className="meta">{conv.themRole}</span>
      </div>
      <div className="chat-body">
        {conv.messages.slice(0, count).map((m, n) => (
          <div key={n} className="bubble" data-from={m.from}>
            {m.text}
          </div>
        ))}
        {typing && (
          <div className="bubble" data-from={typing}>
            <Typing />
          </div>
        )}
      </div>
    </div>
  );
}

// ---- The three numbers.
export function Numbers() {
  const { seen } = usePost();
  return (
    <div className="numbers">
      {impact.map((m, n) => (
        <div key={m.label} className="embed metric rise" style={i(n)}>
          <div className="big">
            <Counter value={m.value} suffix={m.suffix} play={seen} />
          </div>
          <b>{m.label}</b>
          <span className="meta">{m.note}</span>
        </div>
      ))}
    </div>
  );
}

// ---- Reply to Lejla: the brief as a reply box. Sending adds your message to
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
    const id = window.setTimeout(() => setAnswered(true), reducedMotion() ? 0 : 1800);
    return () => clearTimeout(id);
  }, [sent]);
  return (
    <div className="rise" style={i(0)}>
      <div className="fold" data-open={!sent || undefined}>
        <div>
          <form className="embed reply" onSubmit={submit}>
            <label htmlFor="brief" className="meta">{reply.label}</label>
            <textarea id="brief" name="brief" placeholder={reply.placeholder} required rows={1} />
            <div className="fold reply-more">
              <div>
                <div className="reply-fields">
                  <input name="name" placeholder="Your name" aria-label="Your name" autoComplete="name" />
                  <input name="email" type="email" placeholder="Email" aria-label="Email" autoComplete="email" />
                  <button type="submit" className="btn">Send brief</button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
      <div className="fold" data-open={!!sent || undefined}>
        <div>
          {sent && (
            <div className="comments comments-plain">
              <div className="comment" data-on="">
                <span className="av av-you" style={{ ["--s" as string]: "28px" } as CSSProperties} aria-hidden>{(sent.name[0] ?? "Y").toUpperCase()}</span>
                <p>
                  <b>{sent.name || "You"}</b>
                  {sent.text}
                </p>
              </div>
              <div className="comment" data-on="">
                <Avatar who="lejla" size={28} />
                <p>
                  <b>{people.lejla.name}</b>
                  {answered ? reply.answer(sent.name) : <Typing />}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
