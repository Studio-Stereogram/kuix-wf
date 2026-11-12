"use client";
import { SectionHead } from "./parts";

// Subpage opener: same header pattern as every section, with the page title
// as the H1 (set at H2 size) and the lead on the opposite side.
export function PageHero({ index, label, title, lead }: { index: string; label: string; title: React.ReactNode; lead: string }) {
  return (
    <div className="page-hero container">
      <SectionHead index={index} label={label} title={title} aside={lead} tag="h1" className="page-head" />
    </div>
  );
}
