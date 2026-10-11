import { PublicShell } from "@/features/landing/PublicShell";

/** The Turkish public pages. Same components, same data, a different dictionary (ADR-013). */
export default function TurkishLayout({ children }: LayoutProps<"/tr">) {
  return <PublicShell locale="tr">{children}</PublicShell>;
}
