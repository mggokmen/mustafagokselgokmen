import Link from "next/link";

import type { ContactMessageStatus } from "@/lib/api/types";
import { ALL_STATUSES, STATUS_LABELS } from "./transitions";

/**
 * Filtering is in the URL, not in component state: a filtered list can be linked to, reloaded and
 * come back the same (docs/frontend/nextjs.md).
 */
export function StatusFilter({ selected }: { selected: ContactMessageStatus[] }) {
  return (
    <nav className="flex flex-wrap gap-2 text-sm" aria-label="Filter by status">
      <FilterLink href="/admin/messages" active={selected.length === 0}>
        All
      </FilterLink>
      {ALL_STATUSES.map((status) => (
        <FilterLink
          key={status}
          href={`/admin/messages?status=${status}`}
          active={selected.length === 1 && selected[0] === status}
        >
          {STATUS_LABELS[status]}
        </FilterLink>
      ))}
    </nav>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rounded-full border border-slate-900 px-3 py-1 font-medium dark:border-slate-100"
          : "rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
      }
    >
      {children}
    </Link>
  );
}
