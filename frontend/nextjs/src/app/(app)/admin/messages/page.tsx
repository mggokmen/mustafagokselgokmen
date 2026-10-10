import { AdminMessageList } from "@/features/contact/AdminMessageList";
import { StatusFilter } from "@/features/contact/StatusFilter";
import { listContactMessages, pageIndex } from "@/features/contact/messages";
import { statusFilter } from "@/features/contact/transitions";
import { requireAdmin } from "@/lib/auth/current-user";

export const metadata = { title: "All messages" };

export default async function AdminMessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  await requireAdmin("/admin/messages");

  const { page, status } = await searchParams;
  const statuses = statusFilter(status);
  const messages = await listContactMessages({
    page: pageIndex(page),
    statuses,
    returnTo: "/admin/messages",
  });

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">All messages</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Every message, whoever sent it. Moving one through the workflow is recorded against the
          version shown here.
        </p>
      </div>
      <StatusFilter selected={statuses} />
      <AdminMessageList
        page={messages}
        query={statuses.length === 1 ? { status: statuses[0]! } : {}}
      />
    </main>
  );
}
