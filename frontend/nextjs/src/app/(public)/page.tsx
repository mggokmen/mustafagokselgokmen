import Link from "next/link";

import { ArchitectureDiagram } from "@/features/landing/ArchitectureDiagram";

/**
 * Public pages are static and never call the API (docs/architecture.md#web). Every number on this
 * page comes from a test runner or the repository, not from an estimate.
 */

const GITHUB = "https://github.com/mggokmen/mustafagokselgokmen";
const LINKEDIN = "https://www.linkedin.com/in/mustafa-goksel-gokmen/";

const EVIDENCE = [
  { value: "141", label: "automated tests", detail: "63 API · 7 consumer · 50 web · 21 browser" },
  { value: "2,889", label: "generated contract cases", detail: "every run explores new input" },
  { value: "11", label: "decision records", detail: "each one says what it costs" },
  { value: "12", label: "checks before a merge", detail: "including three image scans" },
];

const PROJECTS = [
  {
    name: "Notorite",
    href: "https://notorite.com/",
    summary:
      "Reads marketplace reviews and complaint history and turns them into one trust score per product, seller and brand, so a shopper gets an answer instead of a star average.",
    platforms: ["Web", "Browser extension", "Android"],
  },
  {
    name: "Map's Star",
    href: "https://www.mapsstar.com/",
    summary:
      "A bid holds an administrative region on a world map until someone bids higher. No combat and no resources: the whole mechanic is the standing bid, settled with tokens bought in the apps.",
    platforms: ["Web", "iOS", "Android"],
  },
];

const DECISIONS = [
  {
    title: "The browser never holds a token",
    body: "Sign-in runs as an OAuth code flow on the server. The browser gets HttpOnly cookies and nothing else. Concurrent requests share a single refresh, because refresh tokens rotate and reusing one revokes the whole family.",
    proof:
      "Found by a browser test: a prefetched link and its page refreshed at once and signed the user out.",
  },
  {
    title: "An event cannot be lost",
    body: "A message and the event it produces are written in one transaction. A publisher drains the table afterwards, so a broker being down never rolls back a request and never swallows an event.",
    proof:
      "The consumer claims each event id before acting, retries with a growing pause, and dead-letters what it cannot handle.",
  },
  {
    title: "One contract, measured not assumed",
    body: "The OpenAPI document is written first. Server interfaces and client types are generated from it, and every backend is checked against the same suite, unchanged.",
    proof:
      "Schemathesis found nine real defects, from a NUL byte crash to an empty filter becoming invalid SQL.",
  },
  {
    title: "Concurrency has an answer",
    body: "Two administrators editing one message do not overwrite each other: the version travels in the form and the backend refuses the stale one with 409.",
    proof:
      "A test drives two browsers at the same message to produce the conflict, rather than simulating it.",
  },
];

const STACK = [
  "Java 21",
  "Spring Boot 4",
  "PostgreSQL 18",
  "Kafka",
  "Flyway",
  "Next.js 16",
  "TypeScript",
  "Tailwind",
  "Docker",
  "GitHub Actions",
  "Testcontainers",
  "Playwright",
  "Schemathesis",
  "Trivy",
  "CodeQL",
];

export default function HomePage() {
  return (
    <div className="min-h-dvh bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-5xl px-6 py-16 sm:py-24">
        <Hero />
        <Architecture />
        <Evidence />
        <Decisions />
        <Projects />
        <Stack />
        <Contact />
      </main>
    </div>
  );
}

function Hero() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex max-w-3xl flex-col gap-6">
        <p className="text-sm font-medium tracking-widest text-cyan-400 uppercase">
          Senior Software Developer · 20+ years
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Mustafa Göksel Gökmen
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-slate-300">
          I build systems where the hard parts are handled rather than hoped for: identity, event
          delivery, concurrency and the boundary between services.
        </p>
        <p className="max-w-xl leading-relaxed text-slate-400">
          This site is the system it describes. One API contract, implemented in Spring Boot and
          consumed by this web app, with an event pipeline behind it. Everything below is running or
          in the repository, and the parts that are not deployed say so.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/login"
            className="rounded-md bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Try the application
          </Link>
          <a
            href={GITHUB}
            className="rounded-md border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
          >
            Read the source
          </a>
        </div>
      </div>
    </section>
  );
}

function Architecture() {
  return (
    <Section
      eyebrow="Architecture"
      title="A contract first, then everything else"
      lead="The specification is written before the code. Server interfaces, client types and the test suite all come from it, so a disagreement about the API surfaces at build time instead of in production."
    >
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 sm:p-8">
        <ArchitectureDiagram className="mx-auto w-full max-w-3xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card
          title="Backend-for-frontend"
          body="The browser talks only to the Next.js server, which keeps the tokens and calls the API. No CORS, no CSRF handling, and nothing in browser storage to steal."
        />
        <Card
          title="Transactional outbox"
          body="The change and its event are committed together. Publishing happens afterwards, so a broker outage cannot roll back a request."
        />
        <Card
          title="A consumer that can fail"
          body="Delivery is at least once, so handling is idempotent: each event id is claimed before the work, retried with a back-off, then dead-lettered."
        />
      </div>
    </Section>
  );
}

function Evidence() {
  return (
    <Section
      eyebrow="Evidence"
      title="Numbers that come from a test runner"
      lead="Not estimates. Each of these is printed by a tool in continuous integration, on every pull request."
    >
      <dl className="grid gap-px overflow-hidden rounded-xl border border-slate-800 bg-slate-800 sm:grid-cols-2 lg:grid-cols-4">
        {EVIDENCE.map((item) => (
          <div key={item.label} className="bg-slate-950 p-5">
            <dt className="text-3xl font-semibold tracking-tight text-cyan-400">{item.value}</dt>
            <dd className="mt-1 text-sm font-medium text-slate-200">{item.label}</dd>
            <dd className="mt-1 text-xs leading-relaxed text-slate-500">{item.detail}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function Decisions() {
  return (
    <Section
      eyebrow="Decisions"
      title="Four problems, and what was done about them"
      lead="Each of these is recorded as a decision record in the repository, including what it costs and what was given up."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {DECISIONS.map((decision) => (
          <article
            key={decision.title}
            className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-slate-700"
          >
            <h3 className="text-lg font-semibold tracking-tight">{decision.title}</h3>
            <p className="text-sm leading-relaxed text-slate-400">{decision.body}</p>
            <p className="mt-auto border-l-2 border-cyan-500/40 pl-3 text-xs leading-relaxed text-slate-500">
              {decision.proof}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function Projects() {
  return (
    <Section
      eyebrow="Other work"
      title="Products I build and run"
      lead="Outside this repository, and live. Each link goes to the running product."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {PROJECTS.map((project) => (
          <a
            key={project.name}
            href={project.href}
            className="group flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-cyan-500/50 hover:bg-slate-900/70"
          >
            <h3 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              {project.name}
              <span
                aria-hidden="true"
                className="text-cyan-400 transition group-hover:translate-x-0.5"
              >
                &rarr;
              </span>
            </h3>
            <p className="text-sm leading-relaxed text-slate-400">{project.summary}</p>
            <ul className="mt-auto flex flex-wrap gap-2 pt-1">
              {project.platforms.map((platform) => (
                <li
                  key={platform}
                  className="rounded-full border border-slate-800 px-2.5 py-0.5 text-xs text-slate-500"
                >
                  {platform}
                </li>
              ))}
            </ul>
          </a>
        ))}
      </div>
    </Section>
  );
}

function Stack() {
  return (
    <Section eyebrow="Stack" title="What it is built with">
      <ul className="flex flex-wrap gap-2">
        {STACK.map((item) => (
          <li
            key={item}
            className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-sm text-slate-300"
          >
            {item}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Contact() {
  return (
    <Section eyebrow="Contact" title="Get in touch">
      <div className="flex flex-col gap-6">
        <p className="max-w-2xl leading-relaxed text-slate-400">
          The fastest way to see how this works is to use it: sign in and send a message, then watch
          it move through the workflow.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login"
            className="rounded-md bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Sign in and send one
          </Link>
          <a
            href="mailto:iletisim@mustafagokselgokmen.com.tr"
            className="rounded-md border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900"
          >
            iletisim@mustafagokselgokmen.com.tr
          </a>
        </div>
        <footer className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-800 pt-6 text-sm text-slate-500">
          <a href={GITHUB} className="transition hover:text-slate-300">
            GitHub
          </a>
          <a href={LINKEDIN} className="transition hover:text-slate-300">
            LinkedIn
          </a>
          <Link href="/privacy" className="transition hover:text-slate-300">
            Privacy
          </Link>
          <span className="ml-auto text-xs">Running v0.4.0</span>
        </footer>
      </div>
    </Section>
  );
}

function Section({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16 flex flex-col gap-6 sm:mt-24">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-medium tracking-widest text-cyan-400 uppercase">{eyebrow}</p>
        <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{title}</h2>
        {lead !== undefined && <p className="max-w-2xl leading-relaxed text-slate-400">{lead}</p>}
      </div>
      {children}
    </section>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
      <h3 className="font-medium text-slate-100">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{body}</p>
    </div>
  );
}
