import Link from "next/link";

import type { ContactMessage, ContactMessagePage } from "@/lib/api/types";

const STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};

const STATUS_CLASSES: Record<string, string> = {
  NEW: "border-sky-300 text-sky-900 dark:border-sky-800 dark:text-sky-200",
  IN_PROGRESS: "border-amber-300 text-amber-900 dark:border-amber-800 dark:text-amber-200",
  RESOLVED: "border-emerald-300 text-emerald-900 dark:border-emerald-800 dark:text-emerald-200",
};

/** Message text is rendered as text, never as markup (docs/security.md#xss). */
export function MessageList({ page }: { page: ContactMessagePage }) {
  if (page.items.length === 0) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400">
        You have not sent any messages yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {page.items.map((message) => (
          <li
            key={message.id}
            className="rounded-md border border-slate-200 p-4 dark:border-slate-800"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-medium">{message.subject}</h3>
              <StatusBadge status={message.status} />
            </div>
            <p className="mt-2 text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
              {message.message}
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-500">
              Sent <time dateTime={message.createdAt}>{formatDate(message.createdAt)}</time>
            </p>
          </li>
        ))}
      </ul>
      <Pagination page={page} />
    </div>
  );
}

function StatusBadge({ status }: { status: ContactMessage["status"] }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status] ?? ""}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function Pagination({ page }: { page: ContactMessagePage }) {
  if (page.totalPages <= 1) {
    return null;
  }
  return (
    <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
      <PageLink to={page.page - 1} disabled={page.page === 0}>
        Newer
      </PageLink>
      <span className="text-slate-500 dark:text-slate-500">
        Page {page.page + 1} of {page.totalPages}
      </span>
      <PageLink to={page.page + 1} disabled={page.page + 1 >= page.totalPages}>
        Older
      </PageLink>
    </nav>
  );
}

function PageLink({
  to,
  disabled,
  children,
}: {
  to: number;
  disabled: boolean;
  children: React.ReactNode;
}) {
  if (disabled) {
    return <span className="text-slate-400 dark:text-slate-600">{children}</span>;
  }
  return (
    <Link href={`/contact?page=${to}`} className="font-medium hover:underline">
      {children}
    </Link>
  );
}

function formatDate(value: string): string {
  return new Date(value).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}
