import Link from "next/link";

import { version } from "../../../package.json";
import { CONTACT_EMAIL, GITHUB_URL, LINKEDIN_URL } from "./site-links";

/**
 * The version comes from `package.json`, so the build states its own version rather than a string
 * someone has to remember to change at release time.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-white/5">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-8 text-sm sm:flex-row sm:items-center">
        <p className="text-slate-500">
          Built by Mustafa Göksel Gökmen. The source is{" "}
          <a href={GITHUB_URL} className="text-slate-300 underline-offset-4 hover:underline">
            on GitHub
          </a>
          .
        </p>
        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-400 sm:ml-auto">
          <a href={GITHUB_URL} className="transition hover:text-slate-100">
            GitHub
          </a>
          <a href={LINKEDIN_URL} className="transition hover:text-slate-100">
            LinkedIn
          </a>
          <a href={`mailto:${CONTACT_EMAIL}`} className="transition hover:text-slate-100">
            Email
          </a>
          <Link href="/privacy" className="transition hover:text-slate-100">
            Privacy
          </Link>
          <span className="font-mono text-xs text-slate-600">v{version}</span>
        </nav>
      </div>
    </footer>
  );
}
