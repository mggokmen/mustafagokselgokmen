import type { Metadata } from "next";

import { PrivacyPolicy } from "@/features/privacy/PrivacyPolicy";

export const metadata: Metadata = {
  title: "Gizlilik",
  description: "Bu sitenin neyi, neden sakladığı ve nasıl sildirebileceğiniz.",
  alternates: { canonical: "/tr/privacy", languages: { en: "/privacy", tr: "/tr/privacy" } },
};

export default function TurkishPrivacyPage() {
  return <PrivacyPolicy locale="tr" />;
}
