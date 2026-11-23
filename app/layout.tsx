import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "lenis/dist/lenis.css";
import "./tokens.css";
import "./globals.css";
import { Experience } from "@/components/shell/Experience";

export const metadata: Metadata = {
  title: "KUIX — Design + Development, AI-first",
  description: "KUIX is a design and development studio building AI-first platforms and products.",
};

// Saans (trial build) until the licensed files arrive. Both files are cut from
// the Saans Collection variable font: Saans for headings, Saans Mono for body.
const saans = localFont({
  src: "./fonts/SaansVF-TRIAL.woff2",
  variable: "--font-saans",
  weight: "300 900",
  display: "swap",
});
const saansMono = localFont({
  src: "./fonts/SaansMonoVF-TRIAL.woff2",
  variable: "--font-saans-mono",
  weight: "300 900",
  display: "swap",
});

export const viewport: Viewport = { themeColor: "#121212", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-tone="dark" className={`${saans.variable} ${saansMono.variable}`}>
      <body>
        <Experience>{children}</Experience>
      </body>
    </html>
  );
}
