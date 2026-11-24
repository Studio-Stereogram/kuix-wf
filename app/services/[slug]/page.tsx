import type { Metadata } from "next";
import { Blocks } from "@/components/blocks/Blocks";
import { clusterPage } from "@/content/pages";
import { clusterBySlug, clusters } from "@/content/site";

export const dynamicParams = false;
export const generateStaticParams = () => clusters.map((c) => ({ slug: c.slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = clusterBySlug(slug)!;
  return { title: `${c.title} — Services — KUIX`, description: c.lead };
}

export default async function Page({ params }: Props) {
  const { slug } = await params;
  return <Blocks blocks={clusterPage(slug)} />;
}
