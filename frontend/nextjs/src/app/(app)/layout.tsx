import Link from "next/link";

import { logout } from "@/features/auth/actions";
import { requireUser } from "@/lib/auth/current-user";

/**
 * The signed-in area. The proxy has already redirected anyone without a session; this asks the
 * backend who the user is, which is the only authority on that.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await requireUser();

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold tracking-tight">
            mustafagokselgokmen
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/contact" className="hover:underline">
              Messages
            </Link>
            <Link href="/account" className="hover:underline">
              Account
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-600 dark:text-slate-400">{user.email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-md border border-slate-300 px-3 py-1.5 font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      {children}
    </div>
  );
}
