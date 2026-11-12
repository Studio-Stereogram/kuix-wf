import type { Metadata } from "next";
import { Blocks } from "@/components/blocks/Blocks";
export const metadata: Metadata = { title: "Industries — KUIX" };
export default function Page() {
  return <Blocks page="industries" />;
}
