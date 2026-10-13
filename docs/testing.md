# Testing Standards

## Principles

- **A feature isn't complete until it has tests:** at least one at the lowest layer that can prove
  the behavior, and one at a higher level that proves the parts are wired together.
- **A bug fix starts with a failing regression test.**
- **Tests exercise behavior through public interfaces**, not private methods and not counts of
  internal calls.
- **Test names describe behavior**, for example `returns404WhenMessageBelongsToAnotherUser`.
- **Tests never call real external services, including Google.** They never sleep, and they never
  depend on the order they run in.

## Test levels

| Level | Backend | Web | Android | iOS |
|---|---|---|---|---|
| Unit | JUnit 5 + Mockito on services | Vitest + Testing Library | JUnit + MockK + Turbine + `kotlinx-coroutines-test` on ViewModels | Swift Testing on ViewModels, with fake repositories |
| Integration | `@DataJpaTest` and `@SpringBootTest(RANDOM_PORT)` on Testcontainers PostgreSQL | API client and error mapping against a mocked HTTP layer | MockWebServer: repositories, error mapping, token refresh | Stubbed `ClientTransport`: repositories, auth middleware |
| API | `@WebMvcTest`: status codes, headers, Problem bodies, security rules | — | — | — |
| Contract | Schemathesis + Hurl against the running backend | — | — | — |
| UI / E2E | — | Playwright against the full stack | Compose UI tests for key screens | XCUITest for key flows |

## Test identity provider

Sign-in is tested without Google. The backend is pointed at a local identity provider through
`GOOGLE_ISSUERS` and `GOOGLE_JWKS_URI` ([security.md](security.md#test-identity-provider)).

| Tests | Identity provider |
|---|---|
| Spring Boot integration tests | `TestIdentityProvider`: an in-process RSA key that signs ID tokens, with its key set served by the JDK's HTTP server |
| Contract tests (any backend) | [`mock-oauth2-server`](https://github.com/navikt/mock-oauth2-server) in Docker. `contract/tests/mock-oidc.json` defines a test `USER`, an `ADMIN` and a user whose email isn't verified. |

This means the backend's real verification code runs in every test. No backend contains a test-only
login shortcut.

## Backend

- **Database:** use Testcontainers with `@ServiceConnection`. Never H2, and never any other stand-in
  for PostgreSQL.
- **Kafka:** the publishing tests run against a broker in Testcontainers, the same image as the
  development stack. A test that consumes takes the address from the container, because
  `@ServiceConnection` configures the application rather than setting a property.
- **Consumers** are tested the same way, from the outside: the test publishes a record exactly as
  the API does, then asserts on what the consumer did. Every consumer covers, at least:
  - the event is handled
  - the same event delivered twice is handled once
  - a record that can never be read is dead-lettered without a retry
  - a failure that persists is retried the configured number of times, is then dead-lettered, and
    leaves nothing recorded as handled
  - An outgoing call, such as sending a notification, is behind an interface. The test injects an
    implementation that records what it was asked to do and fails on demand.
- **`@WebMvcTest`** proves the HTTP layer:
  - status codes
  - the `Location` header
  - ProblemDetail bodies with the correct `code`
  - security rules
- **Security tests:** every protected endpoint has tests for these cases:
  - no token → 401
  - wrong role → 403
  - another user's resource → 404
- **`@SpringBootTest` API tests** assert the whole response: status, headers and JSON body.
- **Repository tests** cover custom queries, constraints, and every entity's mapping.
- **Google ID token verification** is tested for each way a token can be rejected:
  - wrong signature
  - wrong issuer
  - wrong audience
  - expired token
  - `email_verified` is `false`

## Web

The web app is a backend-for-frontend, so what matters is what the **browser** ends up holding and
where it is allowed to go. Those are end-to-end questions, and `frontend/nextjs/e2e/run-tests.sh`
answers them: it starts PostgreSQL, the API and a mock identity provider in Docker, builds the web
app the way it is deployed, and drives a real browser through it.

Every sign-in change keeps these covered:

| Case | What it proves |
|---|---|
| A protected page without a session | Redirect to `/login`, carrying `returnTo` |
| A full sign-in | The visitor lands where they were going, as themselves |
| The session cookies | `HttpOnly`, `SameSite=Lax`, `Path=/`, and invisible to `document.cookie` |
| A callback with no sign-in cookie | Refused, with a message the visitor can act on |
| A callback whose `state` isn't the one issued | Refused, and no session is created |
| A missing access token with a valid refresh token | Renewed silently; the refresh token rotates |
| Sign-out | Both cookies gone, and the session no longer works |
| A POST to a protected route | Guarded too, because a Server Action is a POST to its own page |

And for the contact flow:

| Case | What it proves |
|---|---|
| Sending a message | It appears in the sender's own list, as `NEW` |
| An empty form | A message per field, and nothing is sent |
| A subject of only spaces | Refused, the way the contract's pattern requires |
| A message containing markup | Shown as text; no element is created from it |
| The sixth message in an hour | The API's 429 becomes a sentence saying when to try again, from `Retry-After` |

And for the public page, which is what a visitor meets first:

| Case | What it proves |
|---|---|
| The response headers | The policy the browser is given, including `form-action` and `frame-ancestors` |
| The stylesheet | A real browser **fetched** it, and the body is not transparent |
| Console errors | Nothing on the page is refused by the policy |
| The sections and links | Who built it, what it is, where the code is, and which parts are not deployed |
| The shell | The header and footer are on every public page, and the footer states the build's own version |
| A 390px viewport | Nothing pushes the page sideways: the horizontal overflow is zero |
| The social card | `og:image` is absolute and canonical, and the image this build serves is a PNG |
| A visitor who is already signed in | The call to action reaches the form, not the page they came from |
| A visitor without a session | The same call to action goes through sign-in and ends at the form |
| `/tr` | The same page in Turkish, with `lang`, `hreflang` and the same figures as the English one |
| The language switch | Crosses to the other language on the page the visitor is on, and back |
| What is only in English | The Turkish page says that the application behind sign-in is not translated |
| `robots.txt` | Points at the sitemap, keeps a crawler out of the signed-in area, and leaves `/login` crawlable so its `noindex` can be read |
| `sitemap.xml` | Both languages of both public pages, each listing the other |
| The sign-in page | Asks not to be indexed |

That second row exists because production once served this page under a policy that blocked every
stylesheet and script. The HTML stayed perfect, so the build, the unit tests and a `curl` of the
deployed page all passed. Only a browser can fail that test
([ADR-012](decisions/012-security-headers.md)).

And for the admin views:

| Case | What it proves |
|---|---|
| An admin opens the list | Messages they did not send are there, with their author |
| Moving a message | `NEW` → `IN_PROGRESS` → `RESOLVED`, and only a reopen after that |
| The buttons offered | Only the moves the workflow allows; no way to ask for one it doesn't |
| A status filter | Narrows the list, stays in the URL, survives a reload |
| Two admins, one message | The second change carries a stale `version`, is refused with 409, overwrites nothing, and the list shown afterwards is the backend's |
| A `USER` opening the admin area | Not found, and the backend refuses them regardless |

**Identities:** the tests need a `USER` and an `ADMIN`, and a second user whose messages the admin
did not write. The web app is started several times, on different ports, and the mock provider
answers each address with a different account. The application is the same build with the same
configuration in each case: nothing about the tests reaches the app, and the roles come from the
backend, in the tokens it issues.

**Keep destructive tests to themselves.** The test that exhausts the hourly message limit uses an
account no other test depends on. A test that uses up a quota, or revokes something, must not be
able to break the ones that follow.

Unit tests (Vitest) cover what doesn't need a browser: the API client, the error mapping, the
cookie attributes and `returnTo` validation. Async Server Components are not unit-tested; the
Next.js guidance is to cover them end to end, which is what the table above does.

## Clients

- **ViewModel tests** check the sequence of UI states for success, for each error type, and for a
  retry.
- **Rate limits** are verified by backend integration tests, which set low limits of their own and
  move the clock to reach the next window. The contract stack raises the limits instead, so the
  hundreds of requests Schemathesis generates aren't rejected with 429.
- **Token-refresh tests** prove two things:
  - several concurrent 401 responses trigger exactly one refresh
  - a failed refresh logs the user out
- **Repository tests** check that API models map to domain models, and that each Problem `code`
  maps to the right typed error.
- **Sign-in:** the UI tests stub the Google step. The flow is covered end to end by the backend and
  contract tests.

## Contract tests

The contract is the specification that every backend is measured against. A backend implementation
(Spring Boot, Go, .NET, FastAPI) is **complete** when it passes all four checks below. The commands
are **exactly the same for every backend**, with no changes for any particular one.

1. **Lint:** `npx @redocly/cli lint contract/openapi.yaml`
2. **Breaking-change check:** `oasdiff breaking <develop-version> contract/openapi.yaml`.
   A breaking change fails CI unless it is deliberately versioned (see
   [api.md](api.md#compatibility)).
3. **Conformance:** Schemathesis generates requests from the contract, including invalid ones, and
   checks every response against it: status codes, schemas, content types, authentication and
   unsupported methods.
   - `contract/tests/schemathesis_hooks.py` signs in through the mock identity provider, so
     protected operations are called with a real access token.
   - **Each run explores different inputs.** A change that passed on a pull request can still fail
     on `develop`, because that run generated something new. That is the tool doing its job: fix
     forward, with a regression test for the case it found.
   - Every operation in the contract is tested. While a feature is unimplemented, restrict the run
     with `--include-tag`, so unimplemented operations don't report undocumented 404s.
4. **Scenarios:** `contract/tests/*.hurl`, run with Hurl.
   - These are hand-written HTTP scenarios, stored as plain text, for behavior the schema can't
     express:
     - sign-in through the test identity provider: the user is created on the first sign-in and
       their profile is updated on later ones
     - a `USER` sends a message, then lists and reads their own messages
     - a `USER` gets 404 for another user's message, and 403 when changing a status
     - an `ADMIN` lists every message, filters by status, and moves a message through the workflow
     - 409 for a stale `version` and for a disallowed transition
     - 429 after the hourly message limit
     - pagination totals and sorting
     - refresh-token rotation, and revocation of the whole family when an old token is reused
   - The scenarios are deliberately written in no backend's language, so they run unchanged against
     every implementation.

Run steps 3 and 4 with **`contract/run-tests.sh`** (requires Docker). The script:

1. starts an isolated Compose project, layered with `contract/compose.contract.yml`, containing
   PostgreSQL, the API built from the working tree and the mock identity provider, with no ports on
   the host
2. runs Hurl, then Schemathesis
3. checks its own link guard against four outputs — a healthy run, no links covered, half of them,
   and a run with no stateful phase — so a broken guard fails before it can wave a broken run
   through
4. **requires the stateful phase to have covered every API link it found**
5. removes the project, printing the API log on failure

### Reading a Schemathesis run

A green run prints three things that look like problems and are not. They are listed here because
"passed" on its own does not say how much was actually exercised, and a warning nobody can explain
is a warning everybody learns to ignore.

| What it prints | Why | When it would be a real problem |
|---|---|---|
| `⏭ Examples — 8 skipped` | The contract carries no `examples`, so that phase has nothing to run. | If examples are added and the phase still skips them. |
| `validation_mismatch` on `POST /auth/google`, `POST /auth/refresh` and `PUT …/status` | Their bodies are an opaque Google ID token, an opaque refresh token and a workflow transition. The schema cannot describe a valid one, so nearly every generated body is refused — correctly. | If it names an operation whose input the schema *can* describe. Then the schema and the validation really disagree. |
| `missing_auth`: *authentication stopped working mid-run* | The coverage and fuzzing phases deliberately send requests with missing or broken credentials — that is what the `ignored_auth` check is for — and the API answers 401. The heuristic reads those 401s as lost credentials. Measured per phase: the warning appears in coverage and fuzzing, and **never in the stateful phase**, which uses real chained credentials. | If the stateful phase stops covering its links. That is the check the script makes. |
| `N generated, N passed, M skipped` | Hypothesis discards generated cases it cannot satisfy or has already tried. The counts differ on every run, because the inputs do. | If `passed` ever drops below `generated`. |

**The link check is the guard against silent loss.** If authentication genuinely broke, every phase
would still report "passed" while chaining nothing, so the script fails the run unless the stateful
phase covered all of the links it selected. That is the part of the suite that can only work with a
real, working session.

CI runs the same script in the `Contract tests` job.

## Continuous integration

The workflows and their stages are described in [devops.md](devops.md#continuous-integration). This
section lists which tests CI must run.

- **One job per application:**
  - Backend: unit and integration tests
  - Notification service: consumer tests against PostgreSQL and Kafka
  - Web: unit tests, build, Playwright
  - Android: unit tests
  - iOS: build and tests, on a macOS runner
- **A contract job:**
  1. Lint the contract and run the breaking-change check.
  2. Start PostgreSQL, the mock identity provider and the backend.
  3. Run Schemathesis and Hurl.
- **Each alternative backend** gets the same contract job, pointed at its own server.
