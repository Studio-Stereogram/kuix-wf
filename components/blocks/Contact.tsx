"use client";
import { useEffect, useState } from "react";
import { routes } from "@/lib/routes";
import { sections } from "@/content/copy";
import { MaskText } from "../motion/MaskText";
import { Reveal } from "../motion/Reveal";
import { TLink } from "../shell/TLink";
import { KXMark } from "../shell/Logo";
import { CtaBody, Eyebrow, IconChat, IconSend, Idx } from "./parts";

function LocalTime() {
  const [t, setT] = useState("--:--:--");
  useEffect(() => {
    const f = () =>
      setT(new Date().toLocaleTimeString("en-GB", { timeZone: "Europe/Budapest", hour12: false }));
    f();
    const id = window.setInterval(f, 1000);
    return () => window.clearInterval(id);
  }, []);
  return <span>{t} CET</span>;
}

const STEPS = ["About you", "Your project", "Budget & timing"];

// Closing call to action on a light, grainy screen. Next to the button a
// small three-step diagram says what happens after the click: the contact
// form is a short multi-step form.
export function Prefooter({ index }: { index: string }) {
  return (
    <div className="prefooter container">
      <div className="prefooter-bg" aria-hidden>
        <i />
        <span className="gg-grain" />
      </div>
      <Idx index={index} label={sections.contact.label} />
      <MaskText as="h2" className="display prefooter-title" chars>
        {sections.contact.title}
      </MaskText>
      <div className="prefooter-row">
        <Reveal className="prefooter-cta" delay={0.2}>
          <TLink href="/contact/" className="cta cta-lg">
            <CtaBody icon={<IconChat />}>Contact us</CtaBody>
          </TLink>
          <ol className="steps" aria-label="The contact form has three short steps">
            {STEPS.map((st, i) => (
              <li key={st} className="step">
                <span className="step-node" aria-hidden />
                <span className="step-index label">0{i + 1}</span>
                <span className="step-name">{st}</span>
              </li>
            ))}
          </ol>
          <span className="steps-note label">3 short steps, about 2 minutes</span>
        </Reveal>
        <Reveal className="prefooter-mail" delay={0.3}>
          <span className="label muted">Or write to us</span>
          <a href="mailto:hello@kuix.studio" className="contact-mail">hello@kuix.studio</a>
        </Reveal>
      </div>
    </div>
  );
}

// Full-screen footer: the mark and address on the left, a ruled box with three
// columns on the right, and the legal links along the bottom.
export function Footer() {
  return (
    <footer className="footer container">
      <div className="footer-main">
        <Reveal className="footer-brand">
          <TLink href="/" aria-label="KUIX home" className="footer-logo">
            <KXMark size={72} />
          </TLink>
          <address className="footer-address">
            KUIX Studio<br />
            Budapest, Hungary<br />
            <LocalTime />
          </address>
        </Reveal>
        <Reveal className="footer-box" delay={0.08}>
          <div className="footer-col">
            <span className="label footer-label">Social</span>
            <a href="#">LinkedIn</a>
            <a href="#">Instagram</a>
            <a href="#">Dribbble</a>
            <a href="#">GitHub</a>
          </div>
          <nav className="footer-col" aria-label="Footer">
            <span className="label footer-label">Quick links</span>
            {routes.map((r) => (
              <TLink key={r.href} href={r.href}>{r.label}</TLink>
            ))}
          </nav>
          <div className="footer-col">
            <span className="label footer-label">Contact</span>
            <a href="mailto:hello@kuix.studio">hello@kuix.studio</a>
            <a href="tel:+3610000000">+36 (1) 000 0000</a>
          </div>
        </Reveal>
      </div>
      <div className="footer-bottom">
        <span className="footer-copy">© 2026 KUIX. All rights reserved.</span>
        <nav className="footer-legal" aria-label="Legal">
          <a href="#">Privacy policy</a>
          <a href="#">Cookie policy</a>
          <a href="#">Terms &amp; conditions</a>
        </nav>
        <svg className="footer-plus" width="82" height="58" viewBox="0 0 82 58" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
          <path d="M66 7h14M73 0v14M38 29h14M45 22v14M66 29h14M73 22v14M10 51h14M17 44v14M38 51h14M45 44v14M66 51h14M73 44v14" />
        </svg>
      </div>
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
          <span>hello@kuix.studio</span>
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
