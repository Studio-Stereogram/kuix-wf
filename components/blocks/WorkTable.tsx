"use client";
import { sections, work, workStatus } from "@/content/copy";
import { Reveal } from "../motion/Reveal";
import { Rule } from "../motion/Rule";
import { Stagger } from "../motion/Stagger";
import { TLink } from "../shell/TLink";
import { CtaBody, IconArrowRight, SectionHead } from "./parts";

// Case studies as an index: client, platform, sector, a status tag and the
// year or years. The rows arrive one after another: the text of every cell
// rises out of its own mask, the tag fades in and the line under the row draws
// across. Hovering a row inverts it and a label by the cursor says what a click
// does.
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
        <Stagger as="ul" fx="rows" each={0.07}>
          {items.map((w) => (
            <li key={w.client}>
              <TLink href="/case-studies/" className="wrow" data-cursor-label="View the project">
                <span className="wrow-bar" aria-hidden />
                <span className="wcell wcol-client"><span>{w.client}</span></span>
                <span className="wcell"><span>{w.platform}</span></span>
                <span className="wcell hide-sm"><span>{w.sector}</span></span>
                <span className="wcol-status">
                  <span className="wtag" data-status={w.status}>
                    <i aria-hidden />
                    {workStatus[w.status]}
                  </span>
                </span>
                <span className="wcell wcol-idx"><span>{w.year}</span></span>
              </TLink>
            </li>
          ))}
        </Stagger>
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
