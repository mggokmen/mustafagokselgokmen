import Link from "next/link";
import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth/current-user";
import { safeReturnTo } from "@/lib/auth/return-to";

export const metadata = { title: "Sign in" };

/** Why an attempt didn't finish. The reasons are this app's own, not the provider's. */
const MESSAGES: Record<string, string> = {
  expired: "That sign-in took too long. Please try again.",
  failed: "Sign-in could not be completed. Please try again.",
  rejected: "This Google account can't be used here. Check that its email address is verified.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { error, returnTo } = await searchParams;
  const destination = safeReturnTo(typeof returnTo === "string" ? returnTo : undefined);

  if (await currentUser()) {
    redirect(destination);
  }

  const message = typeof error === "string" ? MESSAGES[error] : undefined;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Sign in with Google to send a message and follow what happens to it.
        </p>
      </div>

      {message !== undefined && (
        <p
          role="alert"
          className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100"
        >
          {message}
        </p>
      )}

      <Link
        href={`/auth/google?returnTo=${encodeURIComponent(destination)}`}
        prefetch={false}
        className="rounded-md bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
      >
        Continue with Google
      </Link>

      <p className="text-xs text-slate-500 dark:text-slate-500">
        This app keeps your session in cookies that JavaScript cannot read.
      </p>
    </main>
  );
}
