"use client";
import { useEffect, useRef, useState, type CSSProperties, type RefObject } from "react";
import { routes } from "@/lib/routes";
import { brief as copy, footer, sections } from "@/content/copy";
import { MaskText } from "../motion/MaskText";
import { Reveal } from "../motion/Reveal";
import { Stagger } from "../motion/Stagger";
import { TLink } from "../shell/TLink";
import { KXMark } from "../shell/Logo";
import { ContactLink, useBrief, type StartField } from "../shell/Brief";
import { CtaBody, Eyebrow, IconArrowRight, IconMail, IconPin, IconSend, Idx, Scramble } from "./parts";

// Closing call to action on a light, grainy screen: the statement and the
// button on the left, the first step of the brief as a card on the right.
export function Prefooter({ index }: { index: string }) {
  const card = useRef<HTMLFormElement>(null);
  const { brief, set, open } = useBrief();
  const start = (field: StartField) => open(card.current, field);

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
      </div>
      <Stagger className="prefooter-side" fx="tilt" delay={0.15}>
        <form
          ref={card}
          className="brief-card tone-dark"
          aria-label={copy.title}
          onSubmit={(e) => {
            e.preventDefault();
            start("name");
          }}
        >
          <div className="brief-card-head label">
            <span>{copy.title}</span>
            <span>01 / 03</span>
          </div>
          <div className="brief-card-fields">
            {copy.contact.map((f) => (
              <div key={f.name} className="field">
                <label htmlFor={`c-${f.name}`} className="label">{f.label}</label>
                <input
                  id={`c-${f.name}`}
                  type={f.type}
                  autoComplete={f.auto}
                  value={brief[f.name]}
                  onClick={() => start(f.name)}
                  onChange={(e) => {
                    set({ [f.name]: e.target.value });
                    start(f.name);
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
// The footer lies under the page like a stage behind a curtain: it stays put
// at the bottom of the screen while the light section above it is drawn up
// and away. Only when the whole footer fits on the screen; on a short screen
// it scrolls in normally, so none of it is hidden.
function useFooterReveal(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const block = ref.current?.closest<HTMLElement>(".block-footer");
    const above = block?.previousElementSibling as HTMLElement | null;
    if (!block || !above) return;
    let fits = false;
    let raf = 0;
    // The footer is only pinned once the curtain section covers the whole
    // screen, so it never shows through the sections before it.
    const foot = ref.current;
    const check = () => {
      raf = 0;
      const vh = window.innerHeight;
      const ar = above.getBoundingClientRect();
      const on = fits && ar.top <= 1;
      if (on !== block.hasAttribute("data-pinned")) block.toggleAttribute("data-pinned", on);
      // The footer's own elements fade in once the curtain has lifted about a
      // quarter of the way, and reset when it closes again, so the reveal
      // plays every time. Unpinned, they follow the footer's own position.
      const edge = fits ? ar.bottom : block.getBoundingClientRect().top;
      if (foot) {
        // A veil of the footer's own colour lies over the whole footer and
        // thins out as it scrolls in, so the footer fades up out of the dark.
        const lift = Math.min(1, Math.max(0, (vh - edge) / (vh * 0.9)));
        foot.style.setProperty("--veil", (1 - lift * lift * (3 - 2 * lift)).toFixed(3));
        if (edge < vh * 0.78) foot.setAttribute("data-show", "");
        else if (edge > vh * 0.97) foot.removeAttribute("data-show");
      }
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    const fit = () => {
      fits = block.offsetHeight <= window.innerHeight + 1 && above.offsetHeight >= window.innerHeight - 1;
      if (fits) above.setAttribute("data-curtain", "light");
      else above.removeAttribute("data-curtain");
      queue();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(block);
    ro.observe(above);
    window.addEventListener("resize", fit);
    window.addEventListener("scroll", queue, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", fit);
      window.removeEventListener("scroll", queue);
      block.removeAttribute("data-pinned");
      above.removeAttribute("data-curtain");
    };
  }, [ref]);
}

export function Footer() {
  const ref = useRef<HTMLElement>(null);
  useFooterReveal(ref);
  return (
    <footer ref={ref} className="footer container" data-layout={footer.layout}>
      <div className="footer-top">
        <div className="footer-brand">
          <TLink href="/" aria-label="KUIX home" className="footer-logo">
            <KXMark size={36} />
          </TLink>
          <p className="body muted footer-tagline">{footer.tagline}</p>
        </div>
        <nav className="footer-col footer-nav" aria-label="Footer">
          <span className="label footer-label">Sitemap</span>
          <TLink href="/"><Scramble text="Home" /></TLink>
          {routes.map((r) =>
            r.href === "/contact/" ? (
              <ContactLink key={r.href}><Scramble text={r.label} /></ContactLink>
            ) : (
              <TLink key={r.href} href={r.href}><Scramble text={r.label} /></TLink>
            ),
          )}
        </nav>
        <div className="footer-col footer-social">
          <span className="label footer-label">Social</span>
          {footer.social.map((l) => (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer"><Scramble text={l.label} /></a>
          ))}
        </div>
        <div className="footer-col footer-studio">
          <span className="label footer-label">Studio</span>
          <a className="footer-contact" href={footer.mapUrl} target="_blank" rel="noreferrer">
            <IconPin />
            <span>{footer.address}</span>
          </a>
          <a className="footer-contact" href={`mailto:${footer.email}`}>
            <IconMail />
            <Scramble text={footer.email} />
          </a>
        </div>
      </div>
      <div className="footer-fill">
        <span className="footer-word" aria-hidden>
          {"KUIX".split("").map((c, k) => (
            <span key={c} style={{ "--i": k } as CSSProperties}>{c}</span>
          ))}
        </span>
        <p className="footer-statement">{footer.tagline}</p>
      </div>
      <div className="footer-bottom">
        <span className="footer-copy">© 2026 KUIX. All rights reserved.</span>
        <nav className="footer-legal" aria-label="Legal">
          <a href="#"><Scramble text="Privacy policy" /></a>
          <a href="#"><Scramble text="Cookie policy" /></a>
          <a href="#"><Scramble text="Terms & conditions" /></a>
        </nav>
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
