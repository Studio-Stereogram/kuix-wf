"use client";
import type { ComponentType } from "react";
import { pages, type BlockType } from "@/content/pages";
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

type BlockProps = { index: string; label: string } & Record<string, unknown>;

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
};

export function Blocks({ page }: { page: keyof typeof pages }) {
  // Numbering follows the storyframe: the hero is 01, the next block 02.
  let n = 1;
  return (
    <>
      {pages[page].map((b, i) => {
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
