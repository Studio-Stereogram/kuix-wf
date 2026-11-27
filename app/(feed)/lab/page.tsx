import type { Metadata } from "next";
import { Lab } from "@/components/splats/Lab";

export const metadata: Metadata = {
  title: "KUIX — backdrop lab",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <Lab />;
}
