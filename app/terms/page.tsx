import type { Metadata } from "next";
import { Blocks } from "@/components/blocks/Blocks";
import { legalPage } from "@/content/pages";
import { legal } from "@/content/site";

export const metadata: Metadata = { title: `${legal.terms.title} — KUIX` };
export default function Page() {
  return <Blocks blocks={legalPage("terms")} />;
}
