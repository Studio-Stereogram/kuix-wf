import type { Metadata } from "next";
import { Blocks } from "@/components/blocks/Blocks";
export const metadata: Metadata = { title: "Culture — KUIX" };
export default function Page() {
  return <Blocks page="culture" />;
}
