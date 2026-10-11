import { SiteFooter } from "@/features/landing/SiteFooter";
import { SiteHeader } from "@/features/landing/SiteHeader";

/**
 * The shell every public page shares. These pages are static and never call the API
 * (docs/architecture.md#web), so the header and footer are plain markup with no session in them.
 */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
