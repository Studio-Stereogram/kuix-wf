import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./feed.css";

// The feed is its own document: its own font, its own stylesheet, none of the
// main site's shell. Moving between the two is a full page load.
export const metadata: Metadata = {
  title: "KUIX — the feed",
  description: "KUIX is a design and development agency. Its three founders tell you how it works, one post at a time.",
};

// Allo, SIL Open Font License (see app/fonts/Allo-OFL.txt).
const allo = localFont({
  src: "../fonts/AlloVariableFriendly.woff2",
  variable: "--font-allo",
  weight: "100 900",
  display: "swap",
});

export const viewport: Viewport = { themeColor: "#F3F2EC", width: "device-width", initialScale: 1 };

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={allo.variable}>
      <body>{children}</body>
    </html>
  );
}
