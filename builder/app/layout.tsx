import type { Metadata, Viewport } from "next";
import "./builder.css";

export const metadata: Metadata = {
  title: "KUIX — scene builder",
  description: "Compose splat backdrops from KUIX primitives and export them as scene files.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#F2F1EC", width: "device-width", initialScale: 1 };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
