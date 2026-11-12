"use client";
import { sections, work, workStatus } from "@/content/copy";
import { MaskText } from "../motion/MaskText";
import { Reveal } from "../motion/Reveal";
import { Rule } from "../motion/Rule";
import { TLink } from "../shell/TLink";
import { CtaBody, IconArrowRight, SectionHead } from "./parts";

// Case studies as an index: client, platform, sector, a status tag and the
// year or years. Hovering a row inverts it and a label by the cursor says what
// a click does.
export function WorkTable({ index, limit, head = true }: { index: string; limit?: number; head?: boolean }) {
  const items = limit ? work.slice(0, limit) : work;
  return (
    <div className="work container">
      {head && <SectionHead index={index} label={sections.work.label} title={sections.work.title} aside={sections.work.desc} />}

      <div className="wtable">
        <div className="wrow wrow-head" aria-hidden>
          <span>Client</span>
          <span>Platform</span>
          <span className="hide-sm">Sector</span>
          <span className="wcol-status">Status</span>
          <span className="wcol-idx">Year</span>
        </div>
        <Rule />
        <ul>
          {items.map((w) => (
            <li key={w.client}>
              <TLink href="/case-studies/" className="wrow" data-cursor-label="View the project">
                <span className="wrow-bar" aria-hidden />
                <MaskText as="span" className="wcol-client">{w.client}</MaskText>
                <MaskText as="span">{w.platform}</MaskText>
                <MaskText as="span" className="hide-sm">{w.sector}</MaskText>
                <Reveal as="span" className="wcol-status" y={10}>
                  <span className="wtag" data-status={w.status}>
                    <i aria-hidden />
                    {workStatus[w.status]}
                  </span>
                </Reveal>
                <MaskText as="span" className="wcol-idx">{w.year}</MaskText>
              </TLink>
            </li>
          ))}
        </ul>
      </div>

      {limit && (
        <Reveal className="section-more">
          <TLink href="/case-studies/" className="cta cta-soft">
            <CtaBody icon={<IconArrowRight />}>All case studies</CtaBody>
          </TLink>
        </Reveal>
      )}
    </div>
  );
}
