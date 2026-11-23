import type { Metadata } from "next";
import { TypeCanvas } from "@/components/blocks/TypeCanvas";
export const metadata: Metadata = { title: "Type scale — KUIX" };
export default function Page() {
  return <TypeCanvas />;
}
