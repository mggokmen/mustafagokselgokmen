import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { SITE_URL } from "@/features/landing/site-links";

import "./globals.css";

/**
 * Both typefaces are self-hosted by next/font: the browser asks this server for them and no other,
 * which is what lets the Content-Security-Policy keep `font-src 'self'` (ADR-012).
 */
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mustafa Göksel Gökmen · Senior Software Developer",
    template: "%s · Mustafa Göksel Gökmen",
  },
  description:
    "One API contract, implemented in Spring Boot and consumed by this web app, with an event pipeline behind it. The site is the system it describes.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Mustafa Göksel Gökmen",
    title: "Mustafa Göksel Gökmen · Senior Software Developer",
    description:
      "A contract-first system with its own evidence: 141 automated tests, an event pipeline, and a page that says which parts are not deployed.",
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${jetBrainsMono.variable}`}>
      <body className="min-h-dvh bg-[#05070f] font-sans text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
