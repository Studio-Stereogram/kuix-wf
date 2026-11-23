"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { brief as copy } from "@/content/copy";
import { getLenis } from "@/lib/lenis";
import { prefersReducedMotion } from "@/lib/motion";
import { CtaBody, IconArrowRight, IconPlus, IconSend } from "../blocks/parts";

// ---------- The brief: a three-step form in a full-screen overlay ----------
// One brief for the whole site. The pre-footer card is its first step, and
// every "Contact us" opens the same overlay. The overlay grows out of whatever
// was clicked (the card, or the button) and keeps whatever was typed.
export type Brief = {
  name: string;
  company: string;
  email: string;
  phone: string;
  services: string[];
  engagement: string;
  budget: string;
  deadline: string;
  heard: string[];
  note: string;
  privacy: boolean;
};
export const EMPTY_BRIEF: Brief = {
  name: "",
  company: "",
  email: "",
  phone: "",
  services: [],
  engagement: "",
  budget: "",
  deadline: "",
  heard: [],
  note: "",
  privacy: false,
};
export type StartField = "name" | "company" | "email" | "phone";
type Ctx = {
  brief: Brief;
  set: (patch: Partial<Brief>) => void;
  open: (from?: Element | null, field?: StartField) => void;
};
const BriefContext = createContext<Ctx>({ brief: EMPTY_BRIEF, set: () => {}, open: () => {} });
export const useBrief = () => useContext(BriefContext);

export function BriefProvider({ children }: { children: ReactNode }) {
  const [brief, setBrief] = useState<Brief>(EMPTY_BRIEF);
  const [state, setState] = useState<{ field: StartField; from: DOMRect } | null>(null);
  const set = useCallback((patch: Partial<Brief>) => setBrief((b) => ({ ...b, ...patch })), []);
  const open = useCallback((from?: Element | null, field: StartField = "name") => {
    const r = from?.getBoundingClientRect() ?? new DOMRect(window.innerWidth / 2, window.innerHeight / 2, 0, 0);
    setState((s) => s ?? { field, from: r });
  }, []);
  const value = useMemo(() => ({ brief, set, open }), [brief, set, open]);
  return (
    <BriefContext.Provider value={value}>
      {children}
      {state && <BriefOverlay brief={brief} set={set} field={state.field} from={state.from} onClose={() => setState(null)} />}
    </BriefContext.Provider>
  );
}

// A link to the contact page that opens the brief instead. Modified clicks
// (new tab) still go to the page.
export function ContactLink({ children, className, onClick, ...rest }: { children: ReactNode; className?: string; onClick?: () => void } & Record<string, unknown>) {
  const { open } = useBrief();
  return (
    <a
      href="/contact/"
      className={className}
      onClick={(e) => {
        onClick?.();
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        open(e.currentTarget);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}

function Check({ type, name, label, checked, onChange }: { type: "checkbox" | "radio"; name: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="check" data-type={type}>
      <input type={type} name={name} value={label} checked={checked} onChange={onChange} />
      <span className="check-box" aria-hidden />
      <span className="check-label">{label}</span>
    </label>
  );
}

function BriefOverlay({
  brief,
  set,
  field,
  from,
  onClose,
}: {
  brief: Brief;
  set: (patch: Partial<Brief>) => void;
  field: StartField;
  from: DOMRect;
  onClose: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [sent, setSent] = useState(false);
  const [shown, setShown] = useState(false);
  const [tried, setTried] = useState(false);
  const first = useRef(true);

  const done = useRef(onClose);
  done.current = onClose;
  const close = useCallback(() => {
    setShown(false);
    window.setTimeout(() => done.current(), prefersReducedMotion() ? 0 : 520);
  }, []);

  // Open: hold the page still, grow out of what was clicked, keep focus inside.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    document.documentElement.style.overflow = "hidden";
    // A frame later, so a menu that closes in the same click cannot restart
    // the smooth scroll under the overlay.
    const raf = requestAnimationFrame(() => {
      getLenis()?.stop();
      setShown(true);
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key !== "Tab" || !root.current) return;
      const items = [...root.current.querySelectorAll<HTMLElement>("button, input, textarea, select, a[href]")].filter((n) => n.offsetParent !== null);
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
    setTried(false);
    const target = first.current
      ? el.querySelector<HTMLInputElement>(`[name="${field}"]`)
      : el.querySelector<HTMLElement>(".brief-body input, .brief-body textarea, .brief-done button");
    first.current = false;
    target?.focus({ preventScroll: true });
    if (target instanceof HTMLInputElement && (target.type === "text" || target.type === "tel")) {
      const n = target.value.length;
      try {
        target.setSelectionRange(n, n);
      } catch {}
    }
    el.scrollTo({ top: 0 });
  }, [step, sent, field]);

  const clip = shown
    ? "inset(0px 0px 0px 0px)"
    : `inset(${from.top}px ${Math.max(0, window.innerWidth - from.right)}px ${Math.max(0, window.innerHeight - from.bottom)}px ${from.left}px)`;
  const last = step === copy.steps.length - 1;
  const toggle = (key: "services" | "heard", v: string) =>
    set({ [key]: brief[key].includes(v) ? brief[key].filter((x) => x !== v) : [...brief[key], v] });

  // The browser checks the plain required fields; these groups need a hand.
  const check = (): string | null => {
    if (step === 1 && !brief.services.length) return copy.services.error;
    if (step === 1 && !brief.engagement) return copy.engagement.error;
    if (step === 2 && !brief.heard.length) return copy.heard.error;
    return null;
  };

  // Shown once Continue was pressed with a group left empty; it clears as soon
  // as the group is filled in.
  const error = tried ? check() : null;

  return createPortal(
    <div ref={root} className="brief tone-dark" role="dialog" aria-modal="true" aria-label={copy.title} data-shown={shown ? "" : undefined} style={{ clipPath: clip }} data-lenis-prevent>
      <div className="brief-inner container">
        <header className="brief-top">
          <span className="label">{copy.title}</span>
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
              if (check()) {
                setTried(true);
                return;
              }
              if (last) setSent(true);
              else setStep(step + 1);
            }}
          >
            <ol className="steps" aria-label="Steps">
              {copy.steps.map((st, i) => (
                <li key={st} className="step" data-state={i < step ? "done" : i === step ? "now" : undefined} aria-current={i === step ? "step" : undefined}>
                  <span className="step-node" aria-hidden />
                  <span className="step-index label">0{i + 1}</span>
                  <span className="step-name">{st}</span>
                </li>
              ))}
            </ol>
            <div className="brief-body" key={step}>
              <h2 className="brief-title">{copy.steps[step]}</h2>
              {step === 0 && (
                <div className="brief-fields">
                  {copy.contact.map((f) => (
                    <div key={f.name} className="field">
                      <label htmlFor={`b-${f.name}`} className="label">{f.label}</label>
                      <input
                        id={`b-${f.name}`}
                        name={f.name}
                        type={f.type}
                        autoComplete={f.auto}
                        required={f.required}
                        value={brief[f.name]}
                        onChange={(e) => set({ [f.name]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
              )}
              {step === 1 && (
                <div className="brief-fields">
                  <fieldset className="field">
                    <legend className="brief-q">{copy.services.title}</legend>
                    <p className="brief-hint">{copy.services.hint}</p>
                    <div className="checks">
                      {copy.services.options.map((o) => (
                        <Check key={o} type="checkbox" name="services" label={o} checked={brief.services.includes(o)} onChange={() => toggle("services", o)} />
                      ))}
                    </div>
                  </fieldset>
                  <fieldset className="field">
                    <legend className="brief-q">{copy.engagement.title}</legend>
                    <p className="brief-hint">{copy.engagement.hint}</p>
                    <div className="checks">
                      {copy.engagement.options.map((o) => (
                        <Check key={o} type="radio" name="engagement" label={o} checked={brief.engagement === o} onChange={() => set({ engagement: o })} />
                      ))}
                    </div>
                  </fieldset>
                  <div className="field">
                    <label htmlFor="b-budget" className="label">{copy.budget.label}</label>
                    <div className="select">
                      <select id="b-budget" name="budget" value={brief.budget} onChange={(e) => set({ budget: e.target.value })} data-empty={!brief.budget || undefined}>
                        <option value="">{copy.budget.placeholder}</option>
                        {copy.budget.options.map((o) => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="b-deadline" className="label">{copy.deadline.label}</label>
                    <input id="b-deadline" name="deadline" type="text" placeholder={copy.deadline.placeholder} value={brief.deadline} onChange={(e) => set({ deadline: e.target.value })} />
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="brief-fields">
                  <fieldset className="field">
                    <legend className="brief-q">{copy.heard.title}</legend>
                    <p className="brief-hint">{copy.heard.hint}</p>
                    <div className="checks">
                      {copy.heard.options.map((o) => (
                        <Check key={o} type="checkbox" name="heard" label={o} checked={brief.heard.includes(o)} onChange={() => toggle("heard", o)} />
                      ))}
                    </div>
                  </fieldset>
                  <div className="field">
                    <label htmlFor="b-note" className="brief-q">{copy.note.title}</label>
                    <textarea id="b-note" name="note" rows={4} maxLength={copy.note.max} placeholder={copy.note.placeholder} value={brief.note} onChange={(e) => set({ note: e.target.value })} />
                    <span className="brief-count label" aria-live="polite">{copy.note.max - brief.note.length}</span>
                  </div>
                  <div className="field brief-privacy">
                    <a href={copy.privacy.href} className="brief-link">{copy.privacy.link}</a>
                    <label className="check" data-type="checkbox">
                      <input type="checkbox" name="privacy" required checked={brief.privacy} onChange={(e) => set({ privacy: e.target.checked })} />
                      <span className="check-box" aria-hidden />
                      <span className="check-label">{copy.privacy.accept}*</span>
                    </label>
                    <p className="brief-hint brief-privacy-note">{copy.privacy.note}</p>
                  </div>
                </div>
              )}
              {error && (
                <p className="brief-error" role="alert">{error}</p>
              )}
            </div>
            <footer className="brief-nav">
              {step > 0 ? (
                <button type="button" className="cta cta-soft" onClick={() => setStep(step - 1)}>
                  <CtaBody icon={<IconPlus />}>Back</CtaBody>
                </button>
              ) : (
                <span className="label brief-note">{copy.note3}</span>
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
