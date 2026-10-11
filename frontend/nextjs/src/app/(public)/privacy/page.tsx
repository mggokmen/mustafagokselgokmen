import Link from "next/link";

export const metadata = {
  title: "Privacy",
  description: "What this site stores, why, and how to have it deleted.",
};

/**
 * Describes what the application actually stores, taken from the schema and the cookie helpers
 * rather than from a template. Google requires a privacy policy before an OAuth app can leave
 * testing, but the reason to keep it accurate is that the data is real.
 */
export default function PrivacyPage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
        <p className="text-slate-600 dark:text-slate-400">
          This is a portfolio project: a small but real application, built to demonstrate how one
          API contract is implemented across several platforms. It holds real data about the people
          who sign in, so this page says exactly what that is.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-500">Last updated: 11 October 2026</p>
      </header>

      <Section title="What is stored when you sign in">
        <p>
          Signing in happens through Google. This site never sees your Google password. Google tells
          it:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            an identifier Google uses for your account (the <Code>sub</Code> claim), which is what
            identifies you here — not your email address
          </li>
          <li>your email address</li>
          <li>your display name</li>
          <li>the address of your profile picture</li>
        </ul>
        <p>
          These are stored so that your messages belong to an account that is still yours the next
          time you sign in. The name and picture are refreshed from Google each time you sign in.
        </p>
      </Section>

      <Section title="What is stored when you send a message">
        <ul className="list-disc space-y-1 pl-5">
          <li>the subject and the text you wrote</li>
          <li>its status, as it moves from new to in progress to resolved</li>
          <li>when it was sent and last changed</li>
          <li>a reference to your account</li>
        </ul>
        <p>
          A message cannot be edited after it is sent; only its status changes. Sending a message
          also records an internal event containing the message id, your account id, your email
          address and the subject, which is how the rest of the system learns that something
          happened.
        </p>
      </Section>

      <Section title="Cookies">
        <p>
          Three cookies, all of them <Code>HttpOnly</Code>: JavaScript in your browser cannot read
          them, and none of them is used for advertising or analytics.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <Code>access_token</Code> — proves who you are for about 15 minutes
          </li>
          <li>
            <Code>refresh_token</Code> — gets a new access token for up to 30 days, and is replaced
            every time it is used
          </li>
          <li>
            <Code>sign_in</Code> — exists for ten minutes during sign-in, to verify that the
            response coming back from Google belongs to the request this site made
          </li>
        </ul>
        <p>Signing out deletes both session cookies and revokes the refresh token on the server.</p>
      </Section>

      <Section title="Server logs">
        <p>
          The web server records requests, including IP addresses, as web servers do. Your IP
          address is also counted temporarily, in memory, to limit how often sign-in and message
          sending can be attempted. It is not stored in the database.
        </p>
      </Section>

      <Section title="Who can see it">
        <p>
          You can see your own messages. An administrator — the person who runs this site — can see
          every message together with the name and email address of whoever sent it, in order to
          work through them. Nothing is sold, and nothing is shared for advertising.
        </p>
        <p>Three other parties are necessarily involved:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Google</strong>, which authenticates you. Its own privacy policy applies to that
            step.
          </li>
          <li>
            <strong>Cloudflare</strong>, through which traffic to this site passes
          </li>
          <li>
            <strong>the hosting provider</strong> of the server the application runs on
          </li>
        </ul>
      </Section>

      <Section title="How long it is kept">
        <p>
          Your account and your messages are kept until they are deleted. Refresh tokens expire
          after 30 days, and are stored hashed rather than as the value your browser holds.
        </p>
      </Section>

      <Section title="Having your data deleted">
        <p>
          Write to{" "}
          <a
            href="mailto:mustafagokselgokmen@gmail.com"
            className="font-medium underline underline-offset-2"
          >
            mustafagokselgokmen@gmail.com
          </a>{" "}
          from the address you signed in with, and the account and its messages will be removed.
          There is no self-service deletion button yet; this page would be dishonest if it claimed
          otherwise.
        </p>
      </Section>

      <footer className="border-t border-slate-200 pt-6 text-sm dark:border-slate-800">
        <Link href="/" className="font-medium hover:underline">
          Back to the home page
        </Link>
      </footer>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <div className="flex flex-col gap-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {children}
      </div>
    </section>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">{children}</code>
  );
}
