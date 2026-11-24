"use client";
import { useState } from "react";
import { contactPage as copy, industries } from "@/content/site";
import { brief } from "@/content/copy";
import { Reveal } from "../motion/Reveal";
import { TLink } from "../shell/TLink";
import { CtaBody, IconChat, IconSend, Idx } from "./parts";

type Mode = "meeting" | "project";

function Pills({ name, options, type = "radio", required }: { name: string; options: string[]; type?: "radio" | "checkbox"; required?: boolean }) {
  return (
    <div className="pills">
      {options.map((o, i) => (
        <label key={o} className="pill">
          <input type={type} name={name} value={o} required={required && type === "radio" && i === 0} />
          <span>{o}</span>
        </label>
      ))}
    </div>
  );
}

// The contact page: first a choice between booking a short call and starting
// a project, then the questions for that choice. Both share who you are,
// your role and your industry; a project also asks for the budget and the
// kind of problem. Nothing is sent yet.
export function ContactPageForm({ index }: { index: string }) {
  const [mode, setMode] = useState<Mode>("project");
  const [sent, setSent] = useState(false);
  return (
    <div className="contact-form container">
      <div className="contact-form-side">
        <Idx index={index} label="Get in touch" />
        <div className="modes" role="tablist" aria-label="What would you like to do?">
          {copy.modes.map((m, i) => (
            <Reveal key={m.key} delay={i * 0.06}>
              <button
                type="button"
                role="tab"
                aria-selected={mode === m.key}
                className="mode"
                data-on={mode === m.key || undefined}
                onClick={() => {
                  setMode(m.key);
                  setSent(false);
                }}
              >
                <span className="mode-node" aria-hidden />
                <span className="mode-title">{m.label}</span>
                <span className="body">{m.body}</span>
              </button>
            </Reveal>
          ))}
        </div>
        <Reveal className="label contact-form-meta" delay={0.15}>
          <a href={`mailto:${copy.email}`}>{copy.email}</a>
          <span>{copy.phone}</span>
        </Reveal>
      </div>

      {sent ? (
        <div className="contact-done brief-body">
          <h2 className="brief-title">Thank you.</h2>
          <p className="body-lg">This draft form doesn’t send anywhere yet. Once it does, we will reply within two working days.</p>
          <button className="cta cta-soft" onClick={() => setSent(false)}>
            <CtaBody>Back to the form</CtaBody>
          </button>
        </div>
      ) : (
        <form
          key={mode}
          className="form contact-page-form brief-body"
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
        >
          <h2 className="brief-title">{mode === "meeting" ? "Book a meeting" : "Start a project"}</h2>
          <div className="form-2">
            {[
              ["name", "Your name", "text", "name"],
              ["email", "Email", "email", "email"],
              ["company", "Company", "text", "organization"],
              ["phone", "Phone number", "tel", "tel"],
            ].map(([id, label, type, auto]) => (
              <div key={id} className="field">
                <label htmlFor={`cp-${id}`} className="label">{label}</label>
                <input id={`cp-${id}`} name={id} type={type} autoComplete={auto} required={id === "name" || id === "email"} />
              </div>
            ))}
          </div>

          <fieldset className="field">
            <legend className="brief-q">What role are you in?</legend>
            <Pills name="role" options={copy.roles} required />
          </fieldset>

          <div className="field">
            <label htmlFor="cp-industry" className="brief-q">Your industry</label>
            <div className="select">
              <select id="cp-industry" name="industry" defaultValue="">
                <option value="" disabled>Choose an industry</option>
                {industries.map((i) => (
                  <option key={i.slug}>{i.name}</option>
                ))}
                <option>Other</option>
              </select>
            </div>
          </div>

          {mode === "project" ? (
            <>
              <fieldset className="field">
                <legend className="brief-q">What kind of problem is it?</legend>
                <span className="brief-hint">Choose any that fit.</span>
                <Pills name="problem" options={copy.problems} type="checkbox" />
              </fieldset>
              <fieldset className="field">
                <legend className="brief-q">Budget</legend>
                <Pills name="budget" options={copy.budgets} />
              </fieldset>
              <div className="field">
                <label htmlFor="cp-msg" className="brief-q">Tell us about it</label>
                <textarea id="cp-msg" name="msg" rows={4} placeholder="Goals, timing, anything we should know." />
              </div>
            </>
          ) : (
            <>
              <fieldset className="field">
                <legend className="brief-q">When suits you?</legend>
                <Pills name="slot" options={copy.slots} />
              </fieldset>
              <div className="field">
                <label htmlFor="cp-topic" className="brief-q">What would you like to talk about?</label>
                <textarea id="cp-topic" name="topic" rows={3} placeholder="A sentence or two is enough." />
              </div>
            </>
          )}

          <label className="check" data-type="checkbox">
            <input type="checkbox" name="privacy" required />
            <span className="check-box" aria-hidden />
            <span className="check-label">
              I accept the <TLink href={brief.privacy.href} className="brief-link">privacy policy</TLink>
            </span>
          </label>

          <div>
            <button className="cta" type="submit">
              <CtaBody icon={mode === "meeting" ? <IconChat /> : <IconSend />}>{mode === "meeting" ? "Request a meeting" : "Send the brief"}</CtaBody>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
