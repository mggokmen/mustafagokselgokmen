import type { Metadata } from "next";

import { PrivacyPolicy } from "@/features/privacy/PrivacyPolicy";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What this site stores, why, and how to have it deleted.",
  alternates: { canonical: "/privacy", languages: { en: "/privacy", tr: "/tr/privacy" } },
};

export default function PrivacyPage() {
  return <PrivacyPolicy locale="en" />;
}
