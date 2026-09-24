import { requireUser } from "@/lib/auth/current-user";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const user = await requireUser("/account");

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Name</dt>
          <dd className="font-medium">{user.name}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Email</dt>
          <dd className="font-medium">{user.email}</dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Role</dt>
          <dd className="font-medium">{user.role}</dd>
        </div>
      </dl>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        This page is rendered on the server. The browser holds no token; it only carries cookies
        that JavaScript cannot read.
      </p>
    </main>
  );
}
