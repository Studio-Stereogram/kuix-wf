import type { Metadata } from "next";
import { Blocks } from "@/components/blocks/Blocks";
import { casePage } from "@/content/pages";
import { caseBySlug, caseStudies } from "@/content/site";

export const dynamicParams = false;
export const generateStaticParams = () => caseStudies.map((c) => ({ slug: c.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = caseBySlug(slug)!;
  return { title: `${c.client}: ${c.title} — KUIX`, description: c.summary };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <Blocks blocks={casePage(slug)} />;
}
