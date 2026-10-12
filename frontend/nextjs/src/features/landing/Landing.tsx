import Link from "next/link";

import type { Locale } from "@/lib/i18n/locale";

import { ArchitectureDiagram } from "./ArchitectureDiagram";
import { LANDING_COPY, type LandingCopy } from "./copy";
import { CONTACT_EMAIL, GITHUB_URL } from "./site-links";

/**
 * Public pages are static and never call the API (docs/architecture.md#web). Every number on this
 * page comes from a test runner or the repository, not from an estimate, which is why the numbers
 * are the one thing the two languages share.
 */

const PROJECTS = [
  {
    name: "Notorite",
    href: "https://notorite.com/",
    key: "notorite" as const,
    platforms: ["Web", "Browser extension", "Android"],
  },
  {
    name: "Map's Star",
    href: "https://www.mapsstar.com/",
    key: "mapsstar" as const,
    platforms: ["Web", "iOS", "Android"],
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

export function Landing({ locale }: { locale: Locale }) {
  const copy = LANDING_COPY[locale];

  return (
    <main className="relative isolate">
      <Backdrop />
      <div className="mx-auto max-w-5xl px-6 pt-16 pb-24 sm:pt-24">
        <Hero copy={copy} />
        <Architecture copy={copy} />
        <Evidence copy={copy} />
        <Decisions copy={copy} />
        <Work copy={copy} />
        <Stack copy={copy} />
        <Contact copy={copy} />
      </div>
    </main>
  );
}

/** Light behind the first screen, so the page has a top rather than starting in the middle. */
function Backdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(60%_60%_at_20%_0%,rgba(34,211,238,0.12),transparent_70%)]"
    />
  );
}

function Hero({ copy }: { copy: LandingCopy }) {
  return (
    <section className="grid items-start gap-12 lg:grid-cols-12 lg:gap-10">
      <div className="flex min-w-0 flex-col gap-6 lg:col-span-7">
        <p className="font-mono text-xs tracking-[0.2em] text-cyan-400 uppercase">
          {copy.hero.role}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Mustafa Göksel Gökmen
        </h1>
        <p className="text-lg leading-relaxed text-pretty text-slate-300">{copy.hero.lede}</p>
        <p className="leading-relaxed text-pretty text-slate-400">{copy.hero.body}</p>
        {/* Both routes end at the form: the proxy sends a signed-out visitor through sign-in and
            back, and a signed-in one straight there. Pointing at /login instead would bounce
            anyone who already has a session back to this page. */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/contact"
            className="rounded-md bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            {copy.hero.tryIt}
          </Link>
          <a
            href={GITHUB_URL}
            className="rounded-md border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/25 hover:bg-white/5"
          >
            {copy.hero.readSource}
          </a>
        </div>
      </div>
      <div className="min-w-0 lg:col-span-5">
        <LiveResponse copy={copy} />
      </div>
    </section>
  );
}

/**
 * The API answering for itself. This is the unauthenticated response, so it can be shown without a
 * token and checked by anyone who reads this page. It is not translated: it is what the API
 * actually returns, and the API answers in English.
 */
function LiveResponse({ copy }: { copy: LandingCopy }) {
  return (
    <figure className="overflow-hidden rounded-xl border border-white/10 bg-[#070b16] shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
        <span className="size-2.5 rounded-full bg-white/10" />
        <span className="size-2.5 rounded-full bg-white/10" />
        <span className="size-2.5 rounded-full bg-white/10" />
        <span className="ml-2 font-mono text-[11px] text-slate-500">{copy.terminal.title}</span>
      </div>
      <pre className="px-4 py-4 font-mono text-[11.5px] leading-relaxed break-words whitespace-pre-wrap">
        <code>
          <span className="text-slate-600">$ </span>
          <span className="text-slate-300">curl -s /api/v1/contact-messages</span>
          {"\n\n"}
          <span className="text-slate-500">{"{"}</span>
          {"\n  "}
          <Field name="type" value="about:blank" />
          {"\n  "}
          <Field name="title" value="Authentication required" />
          {"\n  "}
          <span className="text-cyan-300">&quot;status&quot;</span>
          <span className="text-slate-500">: </span>
          <span className="text-amber-300">401</span>
          <span className="text-slate-500">,</span>
          {"\n  "}
          <Field name="code" value="UNAUTHENTICATED" />
          {"\n  "}
          <Field name="detail" value="Missing, invalid or expired credentials." />
          {"\n  "}
          <Field name="instance" value="/api/v1/contact-messages" last />
          {"\n"}
          <span className="text-slate-500">{"}"}</span>
        </code>
      </pre>
      <figcaption className="border-t border-white/5 px-4 py-3 text-xs leading-relaxed text-slate-500">
        {copy.terminal.caption}
      </figcaption>
    </figure>
  );
}

function Field({ name, value, last }: { name: string; value: string; last?: boolean }) {
  return (
    <>
      <span className="text-cyan-300">&quot;{name}&quot;</span>
      <span className="text-slate-500">: </span>
      <span className="text-emerald-300">&quot;{value}&quot;</span>
      {last !== true && <span className="text-slate-500">,</span>}
    </>
  );
}

function Architecture({ copy }: { copy: LandingCopy }) {
  return (
    <Section id="architecture" index="01" section={copy.architecture}>
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-5 sm:p-8">
        <ArchitectureDiagram className="mx-auto w-full max-w-3xl" copy={copy.diagram} />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {copy.architecture.cards.map((card) => (
          <div key={card.title} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
            <h3 className="font-medium text-slate-100">{card.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{card.body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Evidence({ copy }: { copy: LandingCopy }) {
  return (
    <Section id="evidence" index="02" section={copy.evidence}>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {copy.evidence.facts.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-cyan-400/30"
          >
            <dt className="font-mono text-3xl font-semibold tracking-tight text-cyan-400">
              {item.value}
            </dt>
            <dd className="mt-2 text-sm font-medium text-slate-200">{item.label}</dd>
            <dd className="mt-1 text-xs leading-relaxed text-slate-500">{item.detail}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function Decisions({ copy }: { copy: LandingCopy }) {
  return (
    <Section id="decisions" index="03" section={copy.decisions}>
      <div className="grid gap-4 sm:grid-cols-2">
        {copy.decisions.items.map((decision) => (
          <article
            key={decision.title}
            className="flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-white/20"
          >
            <h3 className="text-lg font-semibold tracking-tight">{decision.title}</h3>
            <p className="text-sm leading-relaxed text-slate-400">{decision.body}</p>
            <p className="mt-auto border-l-2 border-cyan-400/40 pl-3 text-xs leading-relaxed text-slate-500">
              {decision.proof}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}

function Work({ copy }: { copy: LandingCopy }) {
  return (
    <Section id="work" index="04" section={copy.work}>
      <div className="grid gap-4 sm:grid-cols-2">
        {PROJECTS.map((project) => (
          <a
            key={project.name}
            href={project.href}
            className="group flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-6 transition hover:border-cyan-400/40 hover:bg-white/[0.04]"
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
            <p className="text-sm leading-relaxed text-slate-400">
              {copy.work.summaries[project.key]}
            </p>
            <ul className="mt-auto flex flex-wrap gap-2 pt-1">
              {project.platforms.map((platform) => (
                <li
                  key={platform}
                  className="rounded-full border border-white/10 px-2.5 py-0.5 font-mono text-[11px] text-slate-500"
                >
                  {copy.work.platforms[platform] ?? platform}
                </li>
              ))}
            </ul>
          </a>
        ))}
      </div>
    </Section>
  );
}

function Stack({ copy }: { copy: LandingCopy }) {
  return (
    <Section index="05" section={copy.stack}>
      <ul className="flex flex-wrap gap-2">
        {STACK.map((item) => (
          <li
            key={item}
            className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1 font-mono text-xs text-slate-300"
          >
            {item}
          </li>
        ))}
      </ul>
    </Section>
  );
}

function Contact({ copy }: { copy: LandingCopy }) {
  return (
    <Section index="06" section={copy.contact}>
      <p className="max-w-2xl leading-relaxed text-slate-400">{copy.contact.body}</p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/contact"
          className="rounded-md bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          {copy.contact.send}
        </Link>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="rounded-md border border-white/10 px-5 py-2.5 text-sm font-medium text-slate-200 transition hover:border-white/25 hover:bg-white/5"
        >
          {CONTACT_EMAIL}
        </a>
      </div>
      {copy.contact.note !== undefined && (
        <p className="text-xs text-slate-500">{copy.contact.note}</p>
      )}
    </Section>
  );
}

function Section({
  id,
  index,
  section,
  children,
}: {
  id?: string;
  index: string;
  section: { eyebrow: string; title: string; lead?: string };
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mt-24 flex scroll-mt-20 flex-col gap-6 sm:mt-32">
      <div className="flex flex-col gap-3">
        <p className="font-mono text-xs tracking-[0.2em] text-cyan-400/80 uppercase">
          {index} · {section.eyebrow}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {section.title}
        </h2>
        {section.lead !== undefined && (
          <p className="max-w-2xl leading-relaxed text-pretty text-slate-400">{section.lead}</p>
        )}
      </div>
      {children}
    </section>
  );
}
