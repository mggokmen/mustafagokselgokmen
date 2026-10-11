import Link from "next/link";

import { type Locale, pathIn } from "@/lib/i18n/locale";

import { LANDING_COPY } from "./copy";
import { LanguageSwitch } from "./LanguageSwitch";

/**
 * A thin bar that stays put while the page scrolls, so a visitor who is three screens down still
 * knows whose site this is and can still reach the application.
 *
 * These pages are prerendered and never call the API, so the bar cannot know whether this visitor
 * is signed in. It therefore offers the destination rather than the state: /contact is right
 * either way, because the proxy takes a visitor without a session through sign-in and back.
 */
export function SiteHeader({ locale }: { locale: Locale }) {
  const copy = LANDING_COPY[locale];
  const sections = [
    { id: "architecture", label: copy.nav.architecture },
    { id: "evidence", label: copy.nav.evidence },
    { id: "decisions", label: copy.nav.decisions },
    { id: "work", label: copy.nav.work },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#05070f]/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center gap-6 px-6">
        <Link
          href={pathIn(locale, "/")}
          className="flex items-center gap-2.5 text-sm font-semibold tracking-tight whitespace-nowrap"
        >
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-md border border-cyan-400/30 bg-cyan-400/10 font-mono text-[11px] text-cyan-300"
          >
            MG
          </span>
          <span className="hidden sm:inline">Mustafa Göksel Gökmen</span>
        </Link>

        <nav className="ml-auto hidden items-center gap-6 md:flex" aria-label={copy.nav.sections}>
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="text-sm text-slate-400 transition hover:text-slate-100"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-4 md:ml-0">
          <LanguageSwitch label={copy.header.language} lang={locale === "en" ? "tr" : "en"} />
          <Link
            href="/contact"
            className="rounded-md border border-cyan-400/40 px-3 py-1.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-400/10"
          >
            {copy.header.send}
          </Link>
        </div>
      </div>
    </header>
  );
}
