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
3. removes the project, printing the API log on failure

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
