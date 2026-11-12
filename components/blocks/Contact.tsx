"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { routes } from "@/lib/routes";
import { footer, sections } from "@/content/copy";
import { getLenis } from "@/lib/lenis";
import { prefersReducedMotion } from "@/lib/motion";
import { MaskText } from "../motion/MaskText";
import { Reveal } from "../motion/Reveal";
import { Stagger } from "../motion/Stagger";
import { TLink } from "../shell/TLink";
import { KXMark } from "../shell/Logo";
import { CtaBody, Eyebrow, IconArrowRight, IconChat, IconPlus, IconSend, Idx, Scramble } from "./parts";

function LocalTime({ bare }: { bare?: boolean }) {
  const [t, setT] = useState("--:--:--");
  useEffect(() => {
    const f = () =>
      setT(new Date().toLocaleTimeString("en-GB", { timeZone: "Europe/Budapest", hour12: false }));
    f();
    const id = window.setInterval(f, 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span>{bare ? t : `${t} CET`}</span>;
}

// ---------- The brief: a short multi-step form ----------
// The pre-footer shows its first step as a card. Clicking into the card (or
// typing in it) opens the whole form as a full-screen overlay, which grows out
// of the card and keeps whatever was typed.
type Brief = { name: string; email: string; company: string; interest: string[]; details: string; budget: string; timing: string };
const EMPTY: Brief = { name: "", email: "", company: "", interest: [], details: "", budget: "", timing: "" };
const STEPS = ["About you", "Your project", "Budget & timing"];
const INTERESTS = ["Strategy", "Design", "Development", "AI integration"];
// Placeholder ranges, to be replaced with the real ones.
const BUDGETS = ["Under €10k", "€10–25k", "€25–50k", "€50k+", "Not sure yet"];
const TIMINGS = ["As soon as possible", "In 1–3 months", "In 3–6 months", "Flexible"];
type CardField = "name" | "email";

function BriefOverlay({
  brief,
  set,
  field,
  from,
  onClose,
}: {
  brief: Brief;
  set: (patch: Partial<Brief>) => void;
  field: CardField;
  from: DOMRect;
  onClose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState(false);
  const [shown, setShown] = useState(false);
  const first = useRef(true);

  // onClose is a new function on every render of the parent; keep the latest
  // one in a ref so the open/close effect below runs only once.
  const done = useRef(onClose);
  done.current = onClose;
  const close = useCallback(() => {
    setShown(false);
    window.setTimeout(() => done.current(), prefersReducedMotion() ? 0 : 520);
  }, []);

  // Open: hold the page still, grow out of the card, keep focus inside.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    getLenis()?.stop();
    document.documentElement.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => setShown(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key !== "Tab" || !root.current) return;
      const items = [...root.current.querySelectorAll<HTMLElement>("button, input, textarea, a[href]")].filter((n) => n.offsetParent !== null);
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
      before?.blur();
    };
  }, [close]);

  // Each step starts with its first field in focus. The first time, that is
  // the field the visitor clicked in the card.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const target = first.current
      ? el.querySelector<HTMLInputElement>(`[name="${field}"]`)
      : el.querySelector<HTMLElement>(".brief-body input:not([type=checkbox]):not([type=radio]), .brief-body textarea, .brief-body .pill input, .brief-done button");
    first.current = false;
    target?.focus({ preventScroll: true });
    if (target instanceof HTMLInputElement && target.type !== "checkbox" && target.type !== "radio") {
      const n = target.value.length;
      try {
        target.setSelectionRange(n, n);
      } catch {}
    }
  }, [step, sent, field]);

  const clip = shown
    ? "inset(0px 0px 0px 0px)"
    : `inset(${from.top}px ${Math.max(0, window.innerWidth - from.right)}px ${Math.max(0, window.innerHeight - from.bottom)}px ${from.left}px)`;
  const last = step === STEPS.length - 1;
  const toggle = (v: string) => set({ interest: brief.interest.includes(v) ? brief.interest.filter((x) => x !== v) : [...brief.interest, v] });

  return createPortal(
    <div ref={root} className="brief tone-dark" role="dialog" aria-modal="true" aria-label="Start a project" data-shown={shown ? "" : undefined} style={{ clipPath: clip }} data-lenis-prevent>
      <div className="brief-inner container">
        <header className="brief-top">
          <span className="label">Start a project</span>
          <button type="button" className="brief-close label" onClick={close}>
            Close <span aria-hidden>[esc]</span>
          </button>
        </header>
        {sent ? (
          <div className="brief-done">
            <h2 className="brief-title">Thank you{brief.name ? `, ${brief.name.split(" ")[0]}` : ""}.</h2>
            <p className="body">This is a draft: the form does not send anything yet. Until it does, write to us at kuix@kuix.hu.</p>
            <button type="button" className="cta" onClick={close}>
              <CtaBody icon={<IconPlus />}>Back to the site</CtaBody>
            </button>
          </div>
        ) : (
          <form
            className="brief-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (last) setSent(true);
              else setStep(step + 1);
            }}
          >
            <ol className="steps" aria-label="Steps">
              {STEPS.map((st, i) => (
                <li key={st} className="step" data-state={i < step ? "done" : i === step ? "now" : undefined} aria-current={i === step ? "step" : undefined}>
                  <span className="step-node" aria-hidden />
                  <span className="step-index label">0{i + 1}</span>
                  <span className="step-name">{st}</span>
                </li>
              ))}
            </ol>
            <div className="brief-body" key={step}>
              <h2 className="brief-title">{STEPS[step]}</h2>
              {step === 0 && (
                <div className="brief-fields">
                  <div className="field">
                    <label htmlFor="b-name" className="label">Your name</label>
                    <input id="b-name" name="name" type="text" autoComplete="name" required value={brief.name} onChange={(e) => set({ name: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="b-email" className="label">Email</label>
                    <input id="b-email" name="email" type="email" autoComplete="email" required value={brief.email} onChange={(e) => set({ email: e.target.value })} />
                  </div>
                  <div className="field">
                    <label htmlFor="b-company" className="label">Company (optional)</label>
                    <input id="b-company" name="company" type="text" autoComplete="organization" value={brief.company} onChange={(e) => set({ company: e.target.value })} />
                  </div>
                </div>
              )}
              {step === 1 && (
                <div className="brief-fields">
                  <div className="field">
                    <span className="label">Interested in</span>
                    <div className="pills">
                      {INTERESTS.map((p) => (
                        <label key={p} className="pill">
                          <input type="checkbox" name="interest" value={p} checked={brief.interest.includes(p)} onChange={() => toggle(p)} />
                          <span>{p}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="b-details" className="label">What are you building?</label>
                    <textarea id="b-details" name="details" rows={4} value={brief.details} onChange={(e) => set({ details: e.target.value })} />
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="brief-fields">
                  <div className="field">
                    <span className="label">Budget</span>
                    <div className="pills">
                      {BUDGETS.map((p) => (
                        <label key={p} className="pill">
                          <input type="radio" name="budget" value={p} checked={brief.budget === p} onChange={() => set({ budget: p })} />
                          <span>{p}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="field">
                    <span className="label">When would you like to start?</span>
                    <div className="pills">
                      {TIMINGS.map((p) => (
                        <label key={p} className="pill">
                          <input type="radio" name="timing" value={p} checked={brief.timing === p} onChange={() => set({ timing: p })} />
                          <span>{p}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <footer className="brief-nav">
              {step > 0 ? (
                <button type="button" className="cta cta-soft" onClick={() => setStep(step - 1)}>
                  <CtaBody icon={<IconPlus />}>Back</CtaBody>
                </button>
              ) : (
                <span className="label brief-note">3 short steps, about 2 minutes</span>
              )}
              <button key={last ? "send" : "next"} type="submit" className="cta">
                <CtaBody icon={last ? <IconSend /> : <IconArrowRight />}>{last ? "Send brief" : "Continue"}</CtaBody>
              </button>
            </footer>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}

// Closing call to action on a light, grainy screen: the statement and the
// button on the left, the first step of the brief as a card on the right.
export function Prefooter({ index }: { index: string }) {
  const card = useRef<HTMLFormElement>(null);
  const [brief, setBrief] = useState<Brief>(EMPTY);
  const [open, setOpen] = useState<{ field: CardField; from: DOMRect } | null>(null);
  const set = useCallback((patch: Partial<Brief>) => setBrief((b) => ({ ...b, ...patch })), []);
  const start = (field: CardField) => {
    if (card.current) setOpen({ field, from: card.current.getBoundingClientRect() });
  };
  const fields: [CardField, string, string][] = [
    ["name", "Your name", "text"],
    ["email", "Email", "email"],
  ];

  return (
    <div className="prefooter container">
      <div className="prefooter-bg" aria-hidden>
        <i />
        <span className="gg-grain" />
      </div>
      <div className="prefooter-main">
        <Idx index={index} label={sections.contact.label} />
        <MaskText as="h2" className="display prefooter-title" chars>
          {sections.contact.title}
        </MaskText>
        <div className="prefooter-row">
          <Reveal className="prefooter-cta" delay={0.2}>
            <button type="button" className="cta cta-lg" onClick={() => start("name")}>
              <CtaBody icon={<IconChat />}>Contact us</CtaBody>
            </button>
          </Reveal>
        </div>
      </div>
      <Stagger className="prefooter-side" fx="tilt" delay={0.15}>
        <form
          ref={card}
          className="brief-card tone-dark"
          aria-label="Start a project"
          onSubmit={(e) => {
            e.preventDefault();
            start("name");
          }}
        >
          <div className="brief-card-head label">
            <span>Start a project</span>
            <span>01 / 03</span>
          </div>
          <div className="brief-card-fields">
            <p className="brief-card-title">Tell us who you are. Two more short steps follow.</p>
            {fields.map(([id, label, type]) => (
              <div key={id} className="field">
                <label htmlFor={`c-${id}`} className="label">{label}</label>
                <input
                  id={`c-${id}`}
                  type={type}
                  value={brief[id]}
                  onClick={() => start(id)}
                  onChange={(e) => {
                    set({ [id]: e.target.value });
                    start(id);
                  }}
                />
              </div>
            ))}
          </div>
          <div className="brief-card-foot">
            <span className="label brief-note">About 2 minutes</span>
            <button type="submit" className="cta cta-soft">
              <CtaBody icon={<IconArrowRight />}>Continue</CtaBody>
            </button>
          </div>
        </form>
      </Stagger>
      {open && <BriefOverlay brief={brief} set={set} field={open.field} from={open.from} onClose={() => setOpen(null)} />}
    </div>
  );
}

// Full-screen footer. The top is always the same: the mark and a line about
// us, then the sitemap, social links and studio details, and the legal links
// along the bottom. What fills the rest of the screen depends on
// footer.layout in content/copy.ts:
//   a  the name, as wide as the screen
//   b  the line about us, large, with the columns under it
//   c  the sitemap as large links
//   d  the studio's local time, large
export function Footer() {
  return (
    <footer className="footer container" data-layout={footer.layout}>
      <Stagger className="footer-top" each={0.1}>
        <div className="footer-brand">
          <TLink href="/" aria-label="KUIX home" className="footer-logo">
            <KXMark size={36} />
          </TLink>
          <p className="body muted footer-tagline">{footer.tagline}</p>
          <p className="footer-write">
            <span className="label footer-label">Or write to us</span>
            <a href={`mailto:${footer.email}`}><Scramble text={footer.email} /></a>
          </p>
        </div>
        <nav className="footer-col footer-nav" aria-label="Footer">
          <span className="label footer-label">Sitemap</span>
          <TLink href="/"><Scramble text="Home" /></TLink>
          {routes.map((r) => (
            <TLink key={r.href} href={r.href}><Scramble text={r.label} /></TLink>
          ))}
        </nav>
        <div className="footer-col footer-social">
          <span className="label footer-label">Social</span>
          <a href="#"><Scramble text="LinkedIn" /></a>
          <a href="#"><Scramble text="Instagram" /></a>
          <a href="#"><Scramble text="Dribbble" /></a>
          <a href="#"><Scramble text="GitHub" /></a>
        </div>
        <div className="footer-col footer-studio">
          <span className="label footer-label">Studio</span>
          <span>Budapest, HU</span>
          <span className="footer-time"><LocalTime /></span>
        </div>
      </Stagger>
      <div className="footer-fill">
        <Stagger as="span" className="footer-word" fx="letters" each={0.1} margin="0px 0px -12% 0px" whole aria-hidden>
          {"KUIX".split("").map((c) => (
            <span key={c}>{c}</span>
          ))}
        </Stagger>
        <p className="footer-statement">{footer.tagline}</p>
        <div className="footer-clock" aria-hidden>
          <span className="label footer-label">Budapest, local time</span>
          <span className="footer-clock-time"><LocalTime bare /></span>
        </div>
      </div>
      <Stagger className="footer-bottom" each={0.1} delay={0.5} margin="0px" whole>
        <span className="footer-copy">© 2026 KUIX. All rights reserved.</span>
        <nav className="footer-legal" aria-label="Legal">
          <a href="#"><Scramble text="Privacy policy" /></a>
          <a href="#"><Scramble text="Cookie policy" /></a>
          <a href="#"><Scramble text="Terms & conditions" /></a>
        </nav>
      </Stagger>
    </footer>
  );
}

export function ContactForm({ index }: { index: string }) {
  const [sent, setSent] = useState(false);
  return (
    <div className="contact-form container">
      <div className="contact-form-side">
        <Eyebrow index={index}>Brief us</Eyebrow>
        <Reveal as="p" className="body-lg">
          Tell us what you are building. We reply within two working days, usually with a few questions.
        </Reveal>
        <Reveal className="label contact-form-meta" delay={0.1}>
          <span>kuix@kuix.hu</span>
          <span>+36 (1) 000 0000</span>
        </Reveal>
      </div>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          setSent(true);
        }}
      >
        {[
          ["name", "Your name", "text"],
          ["email", "Email", "email"],
          ["company", "Company", "text"],
        ].map(([id, label, type], i) => (
          <Reveal key={id} className="field" delay={i * 0.05}>
            <label htmlFor={id} className="label">{label}</label>
            <input id={id} name={id} type={type} required={id !== "company"} />
          </Reveal>
        ))}
        <Reveal className="field" delay={0.15}>
          <span className="label">Interested in</span>
          <div className="pills">
            {["Strategy", "Design", "Development", "AI integration"].map((p) => (
              <label key={p} className="pill">
                <input type="checkbox" name="interest" value={p} />
                <span>{p}</span>
              </label>
            ))}
          </div>
        </Reveal>
        <Reveal className="field" delay={0.2}>
          <label htmlFor="msg" className="label">Project details</label>
          <textarea id="msg" name="msg" rows={4} />
        </Reveal>
        <Reveal delay={0.25}>
          <button className="cta" type="submit" disabled={sent}>
            <CtaBody icon={<IconSend />}>{sent ? "Thanks, this draft form doesn’t send yet" : "Send brief"}</CtaBody>
          </button>
        </Reveal>
      </form>
    </div>
  );
}
