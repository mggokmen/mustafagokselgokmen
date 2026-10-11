import type { Metadata } from "next";

import { Landing } from "@/features/landing/Landing";

export const metadata: Metadata = {
  // Absolute, because the root template would otherwise append the name a second time.
  title: { absolute: "Mustafa Göksel Gökmen · Kıdemli Yazılım Geliştirici" },
  description:
    "Tek bir API sözleşmesi, Spring Boot ile yazılmış bir sunucu ve onu tüketen bu web uygulaması; arkasında bir olay hattı. Bu site, anlattığı sistemin kendisi.",
  alternates: { canonical: "/tr", languages: { en: "/", tr: "/tr" } },
  openGraph: {
    title: "Mustafa Göksel Gökmen · Kıdemli Yazılım Geliştirici",
    description:
      "Sözleşmeden başlayan bir sistem ve kendi kanıtı: 150 otomatik test, bir olay hattı ve hangi parçaların yayında olmadığını söyleyen bir sayfa.",
    url: "/tr",
  },
};

export default function TurkishHomePage() {
  return <Landing locale="tr" />;
}
