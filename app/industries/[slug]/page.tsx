import type { Metadata } from "next";
import { Blocks } from "@/components/blocks/Blocks";
import { industryPage } from "@/content/pages";
import { industries, industryBySlug } from "@/content/site";

export const dynamicParams = false;
export const generateStaticParams = () => industries.map((c) => ({ slug: c.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = industryBySlug(slug)!;
  return { title: `${c.name} — Industries — KUIX`, description: c.lead };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <Blocks blocks={industryPage(slug)} />;
}
