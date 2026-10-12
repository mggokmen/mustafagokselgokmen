import type { Metadata } from "next";

import { Landing } from "@/features/landing/Landing";

export const metadata: Metadata = {
  alternates: { canonical: "/", languages: { en: "/", tr: "/tr" } },
};

export default function HomePage() {
  return <Landing locale="en" />;
}
