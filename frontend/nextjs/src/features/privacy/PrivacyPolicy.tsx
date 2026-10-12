import Link from "next/link";

import { type Locale, pathIn } from "@/lib/i18n/locale";

import { PRIVACY_COPY, type PrivacySection } from "./copy";
import { inline } from "./inline";

/**
 * Describes what the application actually stores, taken from the schema and the cookie helpers
 * rather than from a template. Google requires a privacy policy before an OAuth app can leave
 * testing, but the reason to keep it accurate is that the data is real.
 */
export function PrivacyPolicy({ locale }: { locale: Locale }) {
  const copy = PRIVACY_COPY[locale];

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-slate-400">{copy.intro}</p>
        <p className="text-sm text-slate-500">{copy.updated}</p>
      </header>

      {copy.sections.map((section) => (
        <Section key={section.title} section={section} />
      ))}

      <footer className="border-t border-slate-800 pt-6 text-sm">
        <Link href={pathIn(locale, "/")} className="font-medium hover:underline">
          {copy.back}
        </Link>
      </footer>
    </main>
  );
}

function Section({ section }: { section: PrivacySection }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold tracking-tight">{section.title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-slate-300">
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph}>{inline(paragraph)}</p>
        ))}
        {section.bullets !== undefined && (
          <ul className="list-disc space-y-1 pl-5">
            {section.bullets.map((bullet) => (
              <li key={bullet}>{inline(bullet)}</li>
            ))}
          </ul>
        )}
        {section.email !== undefined && (
          <p>
            {section.email.before}{" "}
            <a
              href={`mailto:${section.email.address}`}
              className="font-medium underline underline-offset-2"
            >
              {section.email.address}
            </a>{" "}
            {section.email.after}
          </p>
        )}
      </div>
    </section>
  );
}
