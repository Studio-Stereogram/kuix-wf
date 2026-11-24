import type { Metadata } from "next";
import { Blocks } from "@/components/blocks/Blocks";

export const metadata: Metadata = { title: "Page not found — KUIX" };
export default function NotFound() {
  return <Blocks page="not-found" />;
}
