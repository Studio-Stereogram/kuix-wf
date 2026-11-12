"use client";
import { useEffect, useRef, useState } from "react";
import { chats, impact, sections, type Conversation } from "@/content/copy";
import { prefersReducedMotion, ready } from "@/lib/motion";
import { MaskText } from "../motion/MaskText";
import { Stagger } from "../motion/Stagger";
import { Counter, Grad, SectionHead } from "./parts";

// One iMessage-style thread. Messages arrive one by one, with typing dots
// first, once `play` turns true.
function Chat({ conv, play, onDone }: { conv: Conversation; play: boolean; onDone?: () => void }) {
  const [count, setCount] = useState(0);
  const [typing, setTyping] = useState<"us" | "them" | null>(null);
  const started = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!play || started.current) return;
    started.current = true;
    if (prefersReducedMotion()) {
      setCount(conv.messages.length);
      doneRef.current?.();
      return;
    }
    const timers: number[] = [];
    let t = 300;
    conv.messages.forEach((m, i) => {
      const pause = m.from === "them" ? 1200 : 650 + m.text.length * 11;
      timers.push(window.setTimeout(() => setTyping(m.from), t));
      t += pause;
      timers.push(
        window.setTimeout(() => {
          setTyping(null);
          setCount(i + 1);
        }, t),
      );
      t += 360;
    });
    timers.push(window.setTimeout(() => doneRef.current?.(), t));
    return () => {
      timers.forEach(clearTimeout);
      started.current = false;
    };
  }, [play, conv]);

  return (
    <div className="chat" role="log" aria-label={`Messages between ${conv.us} and ${conv.them}`}>
      <div className="chat-head">
        <span className="chat-avatar" style={{ ["--h" as string]: conv.hue }} aria-hidden>{conv.them[0]}</span>
        <div>
          <div className="chat-name">{conv.them}</div>
          <div className="chat-role">{conv.themRole}</div>
        </div>
      </div>
      <div className="chat-body">
        {conv.messages.slice(0, count).map((m, i) => (
          <div key={i} className="msg-row" data-from={m.from}>
            {m.time && <div className="msg-time">{m.time}</div>}
            <div className="msg" data-from={m.from} data-tail={conv.messages[i + 1]?.from !== m.from || undefined}>
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="msg-row" data-from={typing}>
            <div className="msg msg-typing" data-from={typing} data-tail>
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
        {count === conv.messages.length && <div className="msg-status">Read</div>}
      </div>
    </div>
  );
}

const HOLD = 3200; // how long a finished thread stays in front before the next

// "What clients say" merged with the impact numbers, as a bento grid: the
// message threads loop by themselves in the large card on the left, the three
// impact numbers sit in the boxes on the right. The cards arrive one after
// another, swinging up from lying flat further back in space.
export function Testimonials({ index }: { index: string }) {
  const root = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [front, setFront] = useState(0);
  const [plays, setPlays] = useState<number[]>(() => chats.map(() => 0));
  const [done, setDone] = useState(false);
  const n = chats.length;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let booted = false;
    let seen = false;
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      if (booted) setInView(seen);
    }, { threshold: 0.35 });
    ready.then(() => {
      booted = true;
      setInView(seen);
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // When the front thread has played out, hold it, then send it to the back
  // and bring the next one forward to play from the start.
  useEffect(() => {
    if (!done || !inView || prefersReducedMotion()) return;
    const t = window.setTimeout(() => {
      const next = (front + 1) % n;
      setPlays((p) => p.map((v, i) => (i === next ? v + 1 : v)));
      setFront(next);
      setDone(false);
    }, HOLD);
    return () => window.clearTimeout(t);
  }, [done, inView, front, n]);

  return (
    <div ref={root} className="tm container">
      <SectionHead
        index={index}
        label={sections.impact.label}
        title={sections.impact.title}
        aside={sections.impact.desc}
      />
      <Stagger className="bento" fx="tilt" each={0.13} margin="0px 0px -12% 0px">
        <div className="bento-card bento-chat">
          <span className="bento-note label">iMessage</span>
          <div className="tm-stack">
            {chats.map((c, i) => {
              const pos = (i - front + n) % n;
              return (
                <div key={c.them} className="tm-card" data-pos={pos}>
                  <Chat
                    key={plays[i]}
                    conv={c}
                    play={inView && pos === 0}
                    onDone={pos === 0 ? () => setDone(true) : undefined}
                  />
                </div>
              );
            })}
          </div>
        </div>
        {impact.map((m, i) => (
          <div key={m.label} className={`bento-card bento-stat${i === 0 ? " bento-wide" : ""}`}>
            <Grad g={[0, 3, 5][i % 3]} className="bento-bg" />
            <span className="bento-note label">{m.note}</span>
            <div className="bento-stat-body">
              <div className="stat-value">
                <Counter value={m.value} suffix={m.suffix} />
              </div>
              <MaskText as="div" className="bento-stat-label" delay={0.05}>{m.label}</MaskText>
            </div>
          </div>
        ))}
      </Stagger>
    </div>
  );
}
