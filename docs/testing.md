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

## Clients

- **ViewModel tests** check the sequence of UI states for success, for each error type, and for a
  retry.
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
   - Only implemented operations are tested (`--include-tag`, currently `Auth`). The filter widens
     as features land.
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
  - Web: unit tests, build, Playwright
  - Android: unit tests
  - iOS: build and tests, on a macOS runner
- **A contract job:**
  1. Lint the contract and run the breaking-change check.
  2. Start PostgreSQL, the mock identity provider and the backend.
  3. Run Schemathesis and Hurl.
- **Each alternative backend** gets the same contract job, pointed at its own server.
