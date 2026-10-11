/**
 * The two languages the public pages are written in. English is the default and keeps the
 * unprefixed paths, so every address that ever worked still works; Turkish lives under `/tr`
 * ([ADR-013](../../../../docs/decisions/013-public-pages-in-two-languages.md)).
 *
 * There is no locale in a cookie and none in a header, because reading either would make the
 * public pages dynamic. The language is in the path, so both versions are prerendered.
 */
export const LOCALES = ["en", "tr"] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** What the switch shows for each language, in that language. */
export const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  tr: "Türkçe",
};

const TURKISH_PREFIX = "/tr";

/** The language a path is written in. */
export function localeOf(pathname: string): Locale {
  return pathname === TURKISH_PREFIX || pathname.startsWith(`${TURKISH_PREFIX}/`) ? "tr" : "en";
}

/**
 * The same page in the other language. The switch has to work from whichever page the visitor is
 * on, so it is computed from the path rather than listed page by page.
 */
export function counterpartPath(pathname: string): string {
  const withoutTrailingSlash = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;

  if (localeOf(withoutTrailingSlash) === "tr") {
    const english = withoutTrailingSlash.slice(TURKISH_PREFIX.length);
    return english === "" ? "/" : english;
  }

  return withoutTrailingSlash === "/" ? TURKISH_PREFIX : `${TURKISH_PREFIX}${withoutTrailingSlash}`;
}

/** The same path in a given language, for links that have to point at one language in particular. */
export function pathIn(locale: Locale, englishPath: string): string {
  if (locale === "en") {
    return englishPath;
  }
  return englishPath === "/" ? TURKISH_PREFIX : `${TURKISH_PREFIX}${englishPath}`;
}
