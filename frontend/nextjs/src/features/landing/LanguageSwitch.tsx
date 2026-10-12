"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { counterpartPath } from "@/lib/i18n/locale";

/**
 * The only client component on the public pages, and it is one because the switch has to point at
 * the page the visitor is actually on. Computing the counterpart from the path means the switch is
 * written once rather than listed page by page.
 */
export function LanguageSwitch({ label, lang }: { label: string; lang: string }) {
  const pathname = usePathname();

  return (
    <Link
      href={counterpartPath(pathname ?? "/")}
      hrefLang={lang}
      prefetch={false}
      className="font-mono text-xs text-slate-400 transition hover:text-cyan-300"
    >
      {label}
    </Link>
  );
}
