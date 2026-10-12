import type { MetadataRoute } from "next";

import { SITE_URL } from "@/features/landing/site-links";
import { LOCALES, pathIn } from "@/lib/i18n/locale";

/** The pages a search engine should know about: the public ones, in both languages. */
const PAGES = [
  { path: "/", priority: 1 },
  { path: "/privacy", priority: 0.5 },
];

/**
 * Each page appears once per language, and every entry lists both languages, so a crawler that
 * finds either one knows the other exists ([ADR-013](../../../docs/decisions/013-public-pages-in-two-languages.md)).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.flatMap((page) =>
    LOCALES.map((locale) => ({
      url: absolute(pathIn(locale, page.path)),
      priority: page.priority,
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((other) => [other, absolute(pathIn(other, page.path))]),
        ),
      },
    })),
  );
}

function absolute(path: string): string {
  return `${SITE_URL}${path}`;
}
