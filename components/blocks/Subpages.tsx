"use client";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { prefersReducedMotion, ready } from "@/lib/motion";
import { values } from "@/content/copy";
import {
  caseBySlug,
  caseStudies,
  casesForCluster,
  casesForIndustry,
  clusterBySlug,
  clusters,
  featuredCase,
  industries,
  industryBySlug,
  industryImpact,
  legal,
  logoStrip,
  office,
  story,
} from "@/content/site";
import { MaskText } from "../motion/MaskText";
import { Reveal } from "../motion/Reveal";
import { Rule } from "../motion/Rule";
import { Stagger } from "../motion/Stagger";
import { TLink } from "../shell/TLink";
import { Partners } from "./Hero";
import { SphereGallery } from "./SphereGallery";
import { WorkTable } from "./WorkTable";
import { Arrow, CtaBody, Grad, IconArrowRight, IconGrid, Idx, SectionHead, ServiceIcon } from "./parts";

// ---------- Shared pieces ----------

// A number that counts up once it comes into view. Unlike Counter it keeps
// one decimal when the value has one (3.4×).
function Stat({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const dec = value % 1 ? 1 : 0;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = value.toFixed(dec);
      return;
    }
    const o = { v: 0 };
    let tween: gsap.core.Tween | undefined;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      ready.then(() => {
        tween = gsap.to(o, { v: value, duration: 1.6, ease: "expo.out", onUpdate: () => void (el.textContent = o.v.toFixed(dec)) });
      });
    });
    io.observe(el);
    return () => {
      io.disconnect();
      tween?.kill();
    };
  }, [value, dec]);
  return (
    <span className="stat-num">
      <span ref={ref}>0</span>
      {suffix && <span className="stat-suffix">{suffix}</span>}
    </span>
  );
}

function Crumbs({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <Reveal as="nav" className="crumbs label" aria-label="Breadcrumb" y={16}>
      {items.map((c, i) => (
        <Fragment key={c.label}>
          {i > 0 && <span className="crumbs-sep" aria-hidden>/</span>}
          {c.href ? <TLink href={c.href}>{c.label}</TLink> : <span aria-current="page">{c.label}</span>}
        </Fragment>
      ))}
    </Reveal>
  );
}

// Key facts in a row under a detail page's title: a small label over a value.
function Facts({ items }: { items: { k: string; v: ReactNode }[] }) {
  return (
    <Stagger as="dl" className="facts" fx="rise" each={0.06} delay={0.2}>
      {items.map((f) => (
        <div key={f.k} className="fact">
          <dt className="label">{f.k}</dt>
          <dd>{f.v}</dd>
        </div>
      ))}
    </Stagger>
  );
}

// ---------- Detail opener ----------
// Every detail page (service, industry) opens like the section pages: the
// breadcrumb, the index label and the H1, the lead on the opposite side, and
// a row of facts under a hairline.
export function DetailHero({
  index,
  kind,
  slug,
}: {
  index: string;
  kind: "cluster" | "industry";
  slug: string;
}) {
  if (kind === "cluster") {
    const c = clusterBySlug(slug)!;
    return (
      <div className="detail-hero container">
        <Crumbs items={[{ href: "/services/", label: "Services" }, { label: c.title }]} />
        <div className="detail-hero-main">
          <SectionHead index={index} label={`Service ${c.n} / 0${clusters.length}`} title={c.title} aside={c.lead} tag="h1" className="page-head" />
          <Reveal className="detail-hero-icon" delay={0.3}>
            <ServiceIcon name={c.icon} />
          </Reveal>
        </div>
        <Rule />
        <Facts
          items={[
            { k: "Services", v: String(c.services.length).padStart(2, "0") },
            { k: "Typical length", v: c.duration },
            { k: "Case studies", v: String(casesForCluster(c.slug).length).padStart(2, "0") },
            { k: "Industries", v: String(c.industries.length).padStart(2, "0") },
          ]}
        />
      </div>
    );
  }
  const ind = industryBySlug(slug)!;
  return (
    <div className="detail-hero container">
      <Crumbs items={[{ href: "/industries/", label: "Industries" }, { label: ind.name }]} />
      <div className="detail-hero-main">
        <SectionHead index={index} label={`Industry ${ind.n}`} title={ind.name} aside={ind.lead} tag="h1" className="page-head" />
      </div>
      <Reveal className="detail-hero-media" delay={0.2}>
        <Grad g={ind.g} className="detail-hero-grad" />
      </Reveal>
      <Facts
        items={[
          { k: "Projects", v: String(ind.count).padStart(2, "0") },
          { k: "Focus areas", v: String(ind.focus.length).padStart(2, "0") },
          { k: "Case studies", v: String(casesForIndustry(ind.slug).length).padStart(2, "0") },
          { k: "Since", v: "2017" },
        ]}
      />
    </div>
  );
}

// ---------- Services overview: one block per cluster ----------
// The big number and the cluster's icon on the left; the description, the
// services in it as a list and a link to the detail page on the right.
export function ClusterSection({ index, slug }: { index: string; slug: string }) {
  const c = clusterBySlug(slug)!;
  return (
    <div className="cluster container">
      <div className="cluster-side">
        <Idx index={index} label={`Phase ${c.n}`} />
        <MaskText as="h2" className="h2" chars>{c.title}</MaskText>
        <Reveal className="cluster-icon" delay={0.2}>
          <ServiceIcon name={c.icon} />
        </Reveal>
      </div>
      <div className="cluster-main">
        <MaskText as="p" className="cluster-lead" delay={0.1}>{c.lead}</MaskText>
        <div className="cluster-list">
          <div className="cluster-list-head label">
            <span>Services</span>
            <span>{c.duration}</span>
          </div>
          <Stagger as="ul" fx="rows" each={0.06}>
            {c.services.map((s, i) => (
              <li key={s.name} className="cluster-row">
                <span className="wcell label cluster-row-n"><span>{c.n}.{i + 1}</span></span>
                <span className="wcell cluster-row-name"><span>{s.name}</span></span>
                <span className="wcell body cluster-row-body"><span>{s.body}</span></span>
              </li>
            ))}
          </Stagger>
        </div>
        <Reveal className="cluster-more">
          <TLink href={`/services/${c.slug}/`} className="cta cta-soft">
            <CtaBody icon={<IconArrowRight />}>{`Explore ${c.title}`}</CtaBody>
          </TLink>
        </Reveal>
      </div>
    </div>
  );
}

// ---------- Service detail: description ----------
export function ClusterBody({ index, slug }: { index: string; slug: string }) {
  const c = clusterBySlug(slug)!;
  return (
    <div className="prose-split container">
      <div className="prose-side">
        <Idx index={index} label="Service description" />
        <MaskText as="h2" className="t-h3" chars>What it covers</MaskText>
      </div>
      <div className="prose-main">
        {c.description.map((p, i) => (
          <MaskText key={i} as="p" className="prose-p" delay={i * 0.08}>{p}</MaskText>
        ))}
        <div className="cluster-list">
          <div className="cluster-list-head label">
            <span>Included</span>
            <span>{String(c.services.length).padStart(2, "0")}</span>
          </div>
          <Stagger as="ul" fx="rows" each={0.06}>
            {c.services.map((s, i) => (
              <li key={s.name} className="cluster-row">
                <span className="wcell label cluster-row-n"><span>{c.n}.{i + 1}</span></span>
                <span className="wcell cluster-row-name"><span>{s.name}</span></span>
                <span className="wcell body cluster-row-body"><span>{s.body}</span></span>
              </li>
            ))}
          </Stagger>
        </div>
        <div className="chips-group">
          <span className="label muted">Deliverables</span>
          <Stagger as="ul" className="chips" fx="rise" each={0.04}>
            {c.deliverables.map((d) => (
              <li key={d} className="chip">{d}</li>
            ))}
          </Stagger>
        </div>
      </div>
    </div>
  );
}

// ---------- Related case studies: the work table, filtered ----------
export function RelatedWork({ index, label, title, desc, cluster, industry }: { index: string; label: string; title: string; desc?: string; cluster?: string; industry?: string }) {
  const items = cluster ? casesForCluster(cluster) : industry ? casesForIndustry(industry) : caseStudies;
  return <WorkTable index={index} items={items} label={label} title={title} desc={desc} />;
}

// ---------- Related industries: a grid of cards ----------
export function RelatedIndustries({ index, cluster }: { index: string; cluster: string }) {
  const c = clusterBySlug(cluster)!;
  const list = c.industries.map((s) => industryBySlug(s)!).filter(Boolean);
  return (
    <div className="container">
      <SectionHead index={index} label="Connected industries" title="Where we use it" aside={`${c.title} work we have done for teams in these sectors.`} />
      <Stagger as="ul" className="ind-grid" fx="tilt" each={0.08}>
        {list.map((ind) => (
          <li key={ind.slug}>
            <IndustryCard slug={ind.slug} />
          </li>
        ))}
      </Stagger>
    </div>
  );
}

function IndustryCard({ slug }: { slug: string }) {
  const ind = industryBySlug(slug)!;
  return (
    <TLink href={`/industries/${ind.slug}/`} className="ind-tile" data-cursor-label="View the industry">
      <span className="ind-card">
        <Grad g={ind.g} className="ind-card-bg" tag="span" />
        <span className="ind-card-link">
          <span className="ind-card-top label">
            <span>({ind.n})</span>
            <Arrow />
          </span>
          <span className="ind-name">{ind.name}</span>
        </span>
      </span>
      <span className="ind-cap">
        <span className="label">{String(ind.count).padStart(2, "0")} projects</span>
        <span className="body">{ind.body}</span>
      </span>
    </TLink>
  );
}

// ---------- Industry detail: description ----------
export function IndustryBody({ index, slug }: { index: string; slug: string }) {
  const ind = industryBySlug(slug)!;
  return (
    <div className="container industry-body-wrap">
      <div className="prose-split">
        <div className="prose-side">
          <Idx index={index} label="Industry description" />
          <MaskText as="h2" className="t-h3" chars>How we work here</MaskText>
        </div>
        <div className="prose-main">
          {ind.description.map((p, i) => (
            <MaskText key={i} as="p" className="prose-p" delay={i * 0.08}>{p}</MaskText>
          ))}
          <div className="chips-group">
            <span className="label muted">Focus areas</span>
            <Stagger as="ul" className="chips" fx="rise" each={0.04}>
              {ind.focus.map((d) => (
                <li key={d} className="chip">{d}</li>
              ))}
            </Stagger>
          </div>
          <div className="chips-group">
            <span className="label muted">Services we bring</span>
            <Stagger as="ul" className="chips" fx="rise" each={0.04}>
              {ind.clusters.map((s) => {
                const c = clusterBySlug(s)!;
                return (
                  <li key={s}>
                    <TLink href={`/services/${c.slug}/`} className="chip chip-link">
                      {c.title} <Arrow />
                    </TLink>
                  </li>
                );
              })}
            </Stagger>
          </div>
        </div>
      </div>
      <ul className="challenges">
        {ind.challenges.map((ch, i) => (
          <li key={ch.title} className="value">
            <Rule delay={i * 0.06} />
            <MaskText as="div" className="label accent">(0{i + 1})</MaskText>
            <MaskText as="h3" className="t-h4">{ch.title}</MaskText>
            <MaskText as="p" className="body" delay={0.08}>{ch.body}</MaskText>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- Industries overview: impact in numbers ----------
export function IndustryImpact({ index }: { index: string }) {
  return (
    <div className="container">
      <SectionHead index={index} label="Industry impact" title="What it adds up to" aside="Lessons from one sector make the next project faster. These are the numbers behind that." />
      <Stagger as="ul" className="stats" fx="tilt" each={0.08}>
        {industryImpact.map((s, i) => (
          <li key={s.label} className="stat">
            <Grad g={[3, 1, 5][i]} className="stat-bg" parallax={false} />
            <span className="stat-top label">
              <span>{s.label}</span>
              <span>{s.note}</span>
            </span>
            <Stat value={s.value} suffix={s.suffix} />
          </li>
        ))}
      </Stagger>
    </div>
  );
}

// ---------- A featured case study ----------
export function FeaturedCase({ index, slug = featuredCase, label = "Relevant case study" }: { index: string; slug?: string; label?: string }) {
  const c = caseBySlug(slug)!;
  return (
    <div className="container">
      <Idx index={index} label={label} />
      <TLink href={`/case-studies/${c.slug}/`} className="feature" data-cursor-label="Read the case study">
        <Reveal className="feature-media">
          <Grad g={c.g} className="feature-grad" />
          <span className="feature-client label">{c.client}</span>
        </Reveal>
        <div className="feature-text">
          <span className="label muted">{c.platform} · {c.sector} · {c.year}</span>
          <MaskText as="h3" className="t-h3" chars>{c.title}</MaskText>
          <MaskText as="p" className="body-lg" delay={0.1}>{c.summary}</MaskText>
          <ul className="feature-stats">
            {c.impact.slice(0, 2).map((s) => (
              <li key={s.label}>
                <Stat value={s.value} suffix={s.suffix} />
                <span className="label muted">{s.label}</span>
              </li>
            ))}
          </ul>
          <span className="cta cta-soft feature-cta">
            <CtaBody icon={<IconArrowRight />}>Read the case study</CtaBody>
          </span>
        </div>
      </TLink>
    </div>
  );
}

// ---------- Logo strip ----------
export function Logos({ index }: { index: string }) {
  return (
    <div className="logos">
      <div className="container">
        <SectionHead index={index} label={logoStrip.label} title={logoStrip.title} aside={logoStrip.desc} />
      </div>
      <Partners />
    </div>
  );
}

// ---------- Next item: a large link to the following detail page ----------
export function NextLink({ kind, slug }: { kind: "cluster" | "industry" | "case"; slug: string }) {
  const list =
    kind === "cluster"
      ? clusters.map((c) => ({ slug: c.slug, title: c.title, href: `/services/${c.slug}/`, sub: c.lead }))
      : kind === "industry"
        ? industries.map((c) => ({ slug: c.slug, title: c.name, href: `/industries/${c.slug}/`, sub: c.lead }))
        : caseStudies.map((c) => ({ slug: c.slug, title: c.client, href: `/case-studies/${c.slug}/`, sub: c.title }));
  const i = list.findIndex((x) => x.slug === slug);
  const next = list[(i + 1) % list.length];
  const what = kind === "cluster" ? "service" : kind === "industry" ? "industry" : "case study";
  return (
    <div className="container">
      <TLink href={next.href} className="next" data-cursor-label={`Next ${what}`}>
        <span className="label muted">Next {what}</span>
        <span className="next-row">
          <MaskText as="span" className="display next-title" chars>{next.title}</MaskText>
          <span className="next-arrow" aria-hidden><Arrow /></span>
        </span>
        <span className="body next-sub">{next.sub}</span>
      </TLink>
    </div>
  );
}

// ---------- Case study detail ----------
export function CaseHero({ index, slug }: { index: string; slug: string }) {
  const c = caseBySlug(slug)!;
  const ind = industryBySlug(c.industry)!;
  return (
    <div className="detail-hero container">
      <Crumbs items={[{ href: "/case-studies/", label: "Case Studies" }, { label: c.client }]} />
      <div className="detail-hero-main">
        <SectionHead index={index} label={`${c.client} · ${c.platform}`} title={c.title} aside={c.summary} tag="h1" className="page-head case-head" />
      </div>
      <Facts
        items={[
          { k: "Client", v: c.client },
          { k: "Year", v: c.year },
          { k: "Service", v: c.services.map((s) => clusterBySlug(s)!.title).join(", ") },
          { k: "Industry", v: ind.name },
          {
            k: "Status",
            v: (
              <span className="wtag" data-status={c.status}>
                <i aria-hidden />
                {c.status === "active" ? "Active project" : "Delivered"}
              </span>
            ),
          },
        ]}
      />
      <Reveal className="case-cover" delay={0.2}>
        <Grad g={c.g} className="case-cover-grad" />
      </Reveal>
    </div>
  );
}

export function CaseBody({ index, slug }: { index: string; slug: string }) {
  const c = caseBySlug(slug)!;
  const ind = industryBySlug(c.industry)!;
  return (
    <div className="prose-split container">
      <aside className="prose-side case-aside">
        <Idx index={index} label="Case study description" />
        <dl className="case-meta">
          <div>
            <dt className="label muted">Client</dt>
            <dd>{c.client}</dd>
          </div>
          <div>
            <dt className="label muted">Year</dt>
            <dd>{c.year}</dd>
          </div>
          <div>
            <dt className="label muted">Connected service</dt>
            <dd className="case-links">
              {c.services.map((s) => {
                const cl = clusterBySlug(s)!;
                return (
                  <TLink key={s} href={`/services/${cl.slug}/`} className="chip chip-link">
                    {cl.title} <Arrow />
                  </TLink>
                );
              })}
            </dd>
          </div>
          <div>
            <dt className="label muted">Connected industry</dt>
            <dd className="case-links">
              <TLink href={`/industries/${ind.slug}/`} className="chip chip-link">
                {ind.name} <Arrow />
              </TLink>
            </dd>
          </div>
        </dl>
      </aside>
      <div className="prose-main">
        <section className="case-part">
          <span className="label accent">(A) The challenge</span>
          <MaskText as="p" className="prose-p prose-lg">{c.challenge}</MaskText>
        </section>
        <Reveal className="case-inline">
          <Grad g={c.g + 2} className="case-inline-grad" />
        </Reveal>
        <section className="case-part">
          <span className="label accent">(B) Our approach</span>
          {c.approach.map((p, i) => (
            <MaskText key={i} as="p" className="prose-p" delay={i * 0.08}>{p}</MaskText>
          ))}
        </section>
        <section className="case-part">
          <span className="label accent">(C) The outcome</span>
          <MaskText as="p" className="prose-p">{c.outcome}</MaskText>
        </section>
      </div>
    </div>
  );
}

export function CaseImpact({ index, slug }: { index: string; slug: string }) {
  const c = caseBySlug(slug)!;
  return (
    <div className="container">
      <SectionHead index={index} label="Project impact" title="What changed" aside={`Measured with the ${c.client} team after launch.`} />
      <Stagger as="ul" className="stats" fx="tilt" each={0.08}>
        {c.impact.map((s, i) => (
          <li key={s.label} className="stat">
            <Grad g={[3, 1, 5][i % 3]} className="stat-bg" parallax={false} />
            <span className="stat-top label">
              <span>{s.label}</span>
              <span>0{i + 1}</span>
            </span>
            <Stat value={s.value} suffix={s.suffix} />
          </li>
        ))}
      </Stagger>
      {c.quote && (
        <figure className="quote">
          <MaskText as="blockquote" className="quote-text">{`“${c.quote.text.replace(/[“”]/g, "")}”`}</MaskText>
          <Reveal as="figcaption" className="label muted" delay={0.2}>
            {c.quote.name}, {c.quote.role}
          </Reveal>
        </figure>
      )}
    </div>
  );
}

// ---------- Culture: our story and office life ----------
export function Story({ index }: { index: string }) {
  return (
    <div className="container">
      <SectionHead index={index} label={story.label} title={story.title} aside={story.desc} />
      <ol className="timeline">
        {story.milestones.map((s, i) => (
          <li key={s.year} className="tl-item">
            <Rule delay={i * 0.06} />
            <span className="tl-node" aria-hidden />
            <MaskText as="div" className="tl-year">{s.year}</MaskText>
            <MaskText as="h3" className="t-h4" delay={0.05}>{s.title}</MaskText>
            <MaskText as="p" className="body" delay={0.1}>{s.body}</MaskText>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function Office({ index }: { index: string }) {
  return (
    <div className="culture office">
      <div className="container">
        <SectionHead index={index} label={office.label} title={office.title} aside={office.desc} />
      </div>
      <SphereGallery />
      <div className="container">
        <ul className="values">
          {values.map((v, i) => (
            <li key={v.title} className="value">
              <Rule delay={i * 0.06} />
              <MaskText as="div" className="label accent">(0{i + 1})</MaskText>
              <MaskText as="h3" className="t-h4">{v.title}</MaskText>
              <MaskText as="p" className="body" delay={0.08}>{v.body}</MaskText>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ---------- Legal pages ----------
export function Legal({ doc }: { doc: keyof typeof legal }) {
  const d = legal[doc];
  return (
    <div className="legal container">
      <aside className="legal-side">
        <span className="label muted">Last updated</span>
        <span className="label">{d.updated}</span>
        <nav className="legal-toc" aria-label="On this page">
          {d.sections.map((s, i) => (
            <a key={s.title} href={`#legal-${i + 1}`} className="label">
              <span className="accent">0{i + 1}</span> {s.title}
            </a>
          ))}
        </nav>
      </aside>
      <div className="legal-main">
        {d.sections.map((s, i) => (
          <section key={s.title} id={`legal-${i + 1}`} className="legal-sec">
            <h2 className="t-h4">
              <span className="label accent">0{i + 1}</span> {s.title}
            </h2>
            {s.body.map((p, k) => (
              <p key={k} className="prose-p">{p}</p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}

// ---------- 404 ----------
export function NotFoundBlock() {
  return (
    <div className="nf container">
      <Reveal className="nf-icon" y={20}>
        <svg viewBox="0 0 96 68" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden>
          <rect x="14" y="8" width="68" height="46" strokeDasharray="2 3" opacity="0.5" />
          <path d="M34 22l28 22M62 22 34 44" />
          <rect x="11.5" y="5.5" width="5" height="5" fill="currentColor" stroke="none" />
          <rect x="79.5" y="51.5" width="5" height="5" fill="none" />
          <path d="M4 62h88" opacity="0.5" />
        </svg>
      </Reveal>
      <Idx index="404" label="Page not found" />
      <MaskText as="h1" className="display nf-title" chars>Lost in the system.</MaskText>
      <MaskText as="p" className="body-lg nf-text" delay={0.15}>
        The page you were looking for has moved, or never existed. Everything else is still where you left it.
      </MaskText>
      <Reveal className="nf-ctas" delay={0.3}>
        <TLink href="/" className="cta">
          <CtaBody icon={<IconArrowRight />}>Back to home</CtaBody>
        </TLink>
        <TLink href="/case-studies/" className="cta cta-soft">
          <CtaBody icon={<IconGrid />}>See our work</CtaBody>
        </TLink>
      </Reveal>
    </div>
  );
}
