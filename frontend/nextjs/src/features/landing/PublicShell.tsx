import type { Locale } from "@/lib/i18n/locale";

import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/**
 * The shell every public page shares. These pages are static and never call the API
 * (docs/architecture.md#web), so the header and footer are plain markup with no session in them.
 *
 * `lang` is set here rather than on <html>, because the root layout is shared by both languages
 * and a prerendered page cannot change it.
 */
export function PublicShell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <div lang={locale} className="flex min-h-dvh flex-col">
      <SiteHeader locale={locale} />
      <div className="flex-1">{children}</div>
      <SiteFooter locale={locale} />
    </div>
  );
}
