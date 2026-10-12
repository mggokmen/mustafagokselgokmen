import { PublicShell } from "@/features/landing/PublicShell";

/** The English pages keep the unprefixed paths; Turkish lives under /tr (ADR-013). */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return <PublicShell locale="en">{children}</PublicShell>;
}
