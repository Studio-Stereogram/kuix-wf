"use client";
import { sections, values } from "@/content/copy";
import { MaskText } from "../motion/MaskText";
import { Rule } from "../motion/Rule";
import { SphereGallery } from "./SphereGallery";
import { Reveal } from "../motion/Reveal";
import { TLink } from "../shell/TLink";
import { CtaBody, IconPeople, SectionHead } from "./parts";

export function Culture({ index, detailed = false }: { index: string; detailed?: boolean }) {
  return (
    <div className="culture" data-bare={!detailed || undefined}>
      {/* Home: no visible header, so the photos have the whole screen. */}
      {detailed ? (
        <div className="container">
          <SectionHead
            index={index}
            label={sections.culture.label}
            title={sections.culture.title}
            aside={sections.culture.desc}
          />
        </div>
      ) : (
        <h2 className="sr-only">{sections.culture.title}</h2>
      )}

      <SphereGallery />

      {!detailed && (
        <Reveal className="section-more container">
          <TLink href="/culture/" className="cta cta-soft">
            <CtaBody icon={<IconPeople />}>Meet the team</CtaBody>
          </TLink>
        </Reveal>
      )}

      {detailed && (
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
      )}
    </div>
  );
}
