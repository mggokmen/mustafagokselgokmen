/**
 * Public pages are static and never call the API (docs/architecture.md#web).
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">mustafagokselgokmen</h1>
      <p className="text-lg text-slate-600 dark:text-slate-400">
        One API contract, several backend implementations, and web, Android and iOS clients that
        behave the same way.
      </p>
      <dl className="grid gap-4 text-sm sm:grid-cols-3">
        <div>
          <dt className="font-medium">Contract first</dt>
          <dd className="text-slate-600 dark:text-slate-400">
            Every client and server is generated from or tested against one OpenAPI document.
          </dd>
        </div>
        <div>
          <dt className="font-medium">Tokens stay on the server</dt>
          <dd className="text-slate-600 dark:text-slate-400">
            The browser talks only to this app; it never holds an API token.
          </dd>
        </div>
        <div>
          <dt className="font-medium">Events, not waiting</dt>
          <dd className="text-slate-600 dark:text-slate-400">
            Sending a message records an event that a separate service consumes.
          </dd>
        </div>
      </dl>
    </main>
  );
}
