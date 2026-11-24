"use client";
import type { ComponentType } from "react";
import { pages, type BlockConfig, type BlockType } from "@/content/pages";
import { scenes } from "@/content/scenes";
import { Block } from "../motion/Block";
import { Approach } from "./Approach";
import { ContactForm, Footer, Prefooter } from "./Contact";
import { Culture } from "./Culture";
import { Hero } from "./Hero";
import { Industries } from "./Industries";
import { PageHero } from "./PageHero";
import { Process } from "./Process";
import { ProcessCircles } from "./ProcessCircles";
import { Services } from "./Services";
import { WorkTable } from "./WorkTable";
import { Testimonials } from "./Testimonials";
import { ContactPageForm } from "./ContactPage";
import { TeamList } from "./Team";
import {
  CaseBody,
  CaseHero,
  CaseImpact,
  ClusterBody,
  ClusterSection,
  DetailHero,
  FeaturedCase,
  IndustryBody,
  IndustryImpact,
  Legal,
  Logos,
  NextLink,
  NotFoundBlock,
  Office,
  RelatedIndustries,
  RelatedWork,
  Story,
} from "./Subpages";

type BlockProps = { index: string; label: string } & Record<string, unknown>;
// Blocks take their own props from the page config; the registry only knows
// that every block gets an index and a label.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const anyBlock = (c: ComponentType<any>) => c as ComponentType<BlockProps>;

const registry: Record<BlockType, ComponentType<BlockProps>> = {
  hero: Hero,
  approach: Approach,
  process: Process,
  "process-b": ProcessCircles,
  services: Services,
  work: (p) => <WorkTable index={p.index} limit={p.limit as number | undefined} />,
  "work-all": (p) => <WorkTable index={p.index} head={false} />,
  industries: Industries,
  "industries-detailed": (p) => <Industries {...p} detailed />,
  culture: Culture,
  "culture-detailed": (p) => <Culture {...p} detailed />,
  testimonials: Testimonials,
  prefooter: Prefooter,
  footer: Footer,
  "contact-form": ContactForm,
  "page-hero": PageHero as ComponentType<BlockProps>,
  "detail-hero": anyBlock(DetailHero),
  cluster: anyBlock(ClusterSection),
  "cluster-body": anyBlock(ClusterBody),
  "related-work": anyBlock(RelatedWork),
  "related-industries": anyBlock(RelatedIndustries),
  "industry-body": anyBlock(IndustryBody),
  "industry-impact": IndustryImpact,
  "featured-case": FeaturedCase,
  logos: Logos,
  next: anyBlock(NextLink),
  "case-hero": anyBlock(CaseHero),
  "case-body": anyBlock(CaseBody),
  "case-impact": anyBlock(CaseImpact),
  team: TeamList,
  story: Story,
  office: Office,
  "contact-page": ContactPageForm,
  legal: anyBlock(Legal),
  "not-found": NotFoundBlock,
};

// A page is either one of the fixed pages in content/pages.ts or, for the
// detail pages, a list built from a slug (clusterPage, casePage...).
export function Blocks({ page, blocks }: { page?: keyof typeof pages; blocks?: BlockConfig[] }) {
  const list = blocks ?? pages[page ?? "home"];
  // Numbering follows the storyframe: the hero is 01, the next block 02.
  let n = 1;
  return (
    <>
      {list.map((b, i) => {
        const C = registry[b.type];
        // A variant shown for comparison shares the index of the block above.
        const index = String(b.props?.variant ? n - 1 : n++).padStart(2, "0");
        return (
          <Block key={`${b.type}-${i}`} id={`${b.type}-${i}`} label={b.label} index={index} scene={scenes[b.scene]} className={`block-${b.type}`}>
            <C index={index} label={b.label} {...b.props} />
          </Block>
        );
      })}
    </>
  );
}
