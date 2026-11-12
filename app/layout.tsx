import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "lenis/dist/lenis.css";
import "./fonts/mono.css";
import "./tokens.css";
import "./globals.css";
import { Experience } from "@/components/shell/Experience";

export const metadata: Metadata = {
  title: "KUIX — Design + Development, AI-first",
  description: "KUIX is a design and development agency building AI-first platforms and products.",
};

// Jokker (trial build) until the licensed files arrive.
const jokker = localFont({
  src: "./fonts/JokkerVF-TRIAL.woff2",
  variable: "--font-jokker",
  weight: "100 900",
  display: "swap",
});

export const viewport: Viewport = { themeColor: "#121212", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-tone="dark" className={jokker.variable}>
      <body>
        <Experience>{children}</Experience>
      </body>
    </html>
  );
}
