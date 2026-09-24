import Link from "next/link";

import type { ContactMessage, ContactMessagePage, ContactMessageStatus } from "@/lib/api/types";
import { StatusForm } from "./StatusForm";
import { STATUS_LABELS } from "./transitions";

const STATUS_CLASSES: Record<ContactMessageStatus, string> = {
  NEW: "border-sky-300 text-sky-900 dark:border-sky-800 dark:text-sky-200",
  IN_PROGRESS: "border-amber-300 text-amber-900 dark:border-amber-800 dark:text-amber-200",
  RESOLVED: "border-emerald-300 text-emerald-900 dark:border-emerald-800 dark:text-emerald-200",
};

/** Message text and author details are rendered as text (docs/security.md#xss). */
export function AdminMessageList({
  page,
  query,
}: {
  page: ContactMessagePage;
  query: Record<string, string>;
}) {
  if (page.items.length === 0) {
    return <p className="text-sm text-slate-600 dark:text-slate-400">No messages match.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-500 dark:text-slate-500">
        {page.totalItems} {page.totalItems === 1 ? "message" : "messages"}
      </p>
      <ul className="flex flex-col gap-3">
        {page.items.map((message) => (
          <li
            key={message.id}
            className="flex flex-col gap-3 rounded-md border border-slate-200 p-4 dark:border-slate-800"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-medium">{message.subject}</h3>
              <StatusBadge status={message.status} />
            </div>
            <p className="text-sm whitespace-pre-wrap text-slate-700 dark:text-slate-300">
              {message.message}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-500">
              From {message.author.name} ({message.author.email}), sent{" "}
              <time dateTime={message.createdAt}>{formatDate(message.createdAt)}</time>
            </p>
            <StatusForm message={message} />
          </li>
        ))}
      </ul>
      <Pagination page={page} query={query} />
    </div>
  );
}

function StatusBadge({ status }: { status: ContactMessage["status"] }) {
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function Pagination({ page, query }: { page: ContactMessagePage; query: Record<string, string> }) {
  if (page.totalPages <= 1) {
    return null;
  }
  const href = (index: number) =>
    `/admin/messages?${new URLSearchParams({ ...query, page: String(index) }).toString()}`;

  return (
    <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
      {page.page === 0 ? (
        <span className="text-slate-400 dark:text-slate-600">Newer</span>
      ) : (
        <Link href={href(page.page - 1)} className="font-medium hover:underline">
          Newer
        </Link>
      )}
      <span className="text-slate-500 dark:text-slate-500">
        Page {page.page + 1} of {page.totalPages}
      </span>
      {page.page + 1 >= page.totalPages ? (
        <span className="text-slate-400 dark:text-slate-600">Older</span>
      ) : (
        <Link href={href(page.page + 1)} className="font-medium hover:underline">
          Older
        </Link>
      )}
    </nav>
  );
}

function formatDate(value: string): string {
  return new Date(value).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}
