# ADR-013: The public pages are published in two languages

- Status: Accepted
- Date: 2026-10-12

## Context

[AGENTS.md](../../AGENTS.md) has said from the start that everything is written in English:
identifiers, comments, documentation, commit messages and API text. That rule was written for the
code, and it is the right rule for the code — a contract implemented by four backends and read by
three clients cannot afford two spellings of anything.

The public pages are a different artifact. They are a portfolio, read by people deciding whether
to talk to the person who built it, and a large share of those readers are Turkish. English-only
is a deliberate choice for the code and an accidental one for the page a Turkish reader lands on.

The requirement, in the owner's words: English by default, with Turkish available by choosing it.

## Decision

### Only the public pages, for now

| Surface | Language |
|---|---|
| Landing page, privacy policy | English and Turkish |
| The application behind sign-in | English |
| API responses, including problem details | English |
| Code, comments, documentation, commits, ADRs | English |

The application behind sign-in stays English because translating it means translating what the
**API** says: field errors, the reason a status change was refused, the wait that a 429 asks for.
Those sentences belong to the contract, which four backends implement and a language-neutral test
suite asserts. Giving them a language is a contract decision with its own cost, and it is not the
one being asked for here.

The Turkish page says so, rather than letting a visitor discover it after signing in.

### The language is in the path, not in a cookie

English keeps the unprefixed paths (`/`, `/privacy`); Turkish lives under `/tr`. A locale in a
cookie or a header would have to be read per request, which makes every public page dynamic — and
these pages being static is a stated property of this architecture
([architecture.md](../architecture.md#web)). With the language in the path, both versions are
prerendered, both are addressable, and `hreflang` can point each at the other.

The switch is the only client component on these pages, because it has to know which page the
visitor is on. It computes the counterpart from the path, so a new page needs no entry in a list.

### One dictionary, one shape

`features/landing/copy.ts` and `features/privacy/copy.ts` hold both languages under one type. A
missing translation is a type error, not an English sentence on the Turkish page.

**Numbers are not translated.** The test counts, the generated-case count and the version come from
a runner or from `package.json`, and a runner has no language.

### No library

`next/font`, the App Router's own routing and a typed object are enough for two languages and two
pages. An internationalisation library would add a dependency, a message format and a build step
for a problem this size, which [AGENTS.md](../../AGENTS.md) asks us not to do.

The privacy copy carries `**bold**` and `` `code` `` and a twenty-line renderer turns those two
into elements. It is not a Markdown renderer and must not become one: nothing in this application
turns text into markup ([security.md](../security.md#xss)).

## Alternatives considered

- **A cookie and a switch that reloads.** One URL per page, no duplication — and every public page
  becomes dynamic, with nothing to give Google but the default language.
- **`app/[locale]/…` with a middleware rewrite for the default.** The conventional shape, and the
  honest one once there are many pages. For two pages it moves every route and every existing URL
  for no behaviour this decision needs.
- **Machine translation at build time.** Faster to write and impossible to defend: this page is
  the work sample, and a sentence that reads like a translation is a worse sample than an English
  one.
- **Turkish everywhere, including the API.** The clean end state if the audience is Turkish. It
  changes the contract, the contract tests and every backend that will implement it, so it needs
  its own decision rather than being carried in on the back of a landing page.

## Consequences

- `AGENTS.md` now separates the language of the **code** from the language of the **page**. The
  code rule is unchanged.
- Every new public page needs an entry in both dictionaries, and the type says so.
- The Turkish page admits that the application behind sign-in is English. When that stops being
  true, the sentence goes.
- Two more addresses exist to keep working: `/tr` and `/tr/privacy`. Browser tests cover both, the
  switch in both directions, and that the figures on the two pages are the same.
