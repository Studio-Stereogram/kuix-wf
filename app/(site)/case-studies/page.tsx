import type { Metadata } from "next";
import { Blocks } from "@/components/blocks/Blocks";
export const metadata: Metadata = { title: "Case Studies — KUIX" };
export default function Page() {
  return <Blocks page="case-studies" />;
}
