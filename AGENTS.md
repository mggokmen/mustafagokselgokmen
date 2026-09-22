# Project Development Guide

This guide defines how this repository is developed. It applies to every change in every
application. It is the summary and entry point; the detailed standards are in [`docs/`](docs/).

## Project Goal

One product with one API contract and several implementations:

- **Clients:** a Next.js web app, an Android app (Kotlin) and an iOS app (Swift).
- **Backends:** Spring Boot first, then Go, .NET and FastAPI implementations of the same API.
- **Contract:** every backend implements [`contract/openapi.yaml`](contract/openapi.yaml) and must
  pass the same contract test suite.

The first release is a small but real business flow. Users sign in with Google and send contact
messages. Admins manage those messages through a status workflow (`NEW` → `IN_PROGRESS` →
`RESOLVED`). See [docs/architecture.md](docs/architecture.md#domain).

The project's value is consistency: the same product rules, API behavior and architecture on every
platform and every backend.

## Architecture

- `contract/openapi.yaml` is the canonical API. It is written first, and server interfaces and
  client code are generated from it.
- Layers call only downward and are never skipped:

| Application | Layers |
|---|---|
| Backend | Controller → Service → Repository → Database |
| Web | Component → API client → Backend |
| Android | Compose UI → ViewModel → Repository → API |
| iOS | SwiftUI View → ViewModel → Repository → API |

- The backend is split into two small bounded contexts:
  - `identity`: users, roles, sign-in, tokens
  - `contact`: contact messages

  Business rules such as allowed state transitions live in the domain model. Services orchestrate
  use cases. Don't add layers or interfaces unless there is a concrete need.
- The web app uses a backend-for-frontend setup: the browser talks only to the Next.js server.
- Both mobile apps use MVVM.

Details and reasoning: [docs/architecture.md](docs/architecture.md), [docs/decisions/](docs/decisions/).

## Repository Structure

```
contract/            openapi.yaml + language-neutral API scenario tests
backend/
  spring-boot/       Spring Boot implementation
  go/                (planned)
  dotnet/            (planned)
  fastapi/           (planned)
frontend/
  nextjs/            Next.js web app
mobile/
  android/           Android app
  ios/               iOS app
docs/                standards, architecture, decision records
.github/             CI/CD workflows, Dependabot, pull request template
docker-compose.yml   local stack: PostgreSQL + API
```

## Technology Stack

| Area | Stack |
|---|---|
| Contract | OpenAPI 3.0.3 |
| Identity | Sign in with Google (OpenID Connect); the API issues its own JWT tokens |
| Backend | Java 21, Spring Boot 4, Spring Web MVC, Spring Data JPA, Spring Security (JWT), Flyway, PostgreSQL 18 |
| Web | Next.js (App Router), React, TypeScript, Tailwind CSS |
| Android | Kotlin, Jetpack Compose, Hilt, Retrofit, Coroutines + Flow, Room, DataStore |
| iOS | Swift 6, SwiftUI, async/await, URLSession, Keychain |
| Testing | JUnit 5, Testcontainers, Vitest, Playwright, MockK, Turbine, Swift Testing, Schemathesis, Hurl |
| Containers | Docker (multi-stage images), Docker Compose |
| CI/CD | GitHub Actions, GitHub Container Registry, Dependabot, CodeQL, Trivy |
| Observability | Spring Boot Actuator, structured JSON logging |

Each stack has its own standard: [Spring Boot](docs/backend/spring-boot.md),
[Next.js](docs/frontend/nextjs.md), [Android](docs/mobile/android.md), [iOS](docs/mobile/ios.md).

## Build and Run

Prerequisites: Docker, and JDK 21 for backend work. Copy each `.env.example` to `.env` before
running anything.

| Task | Command |
|---|---|
| Run the local stack (PostgreSQL + API) | `docker compose up --build` |
| Run only the database | `docker compose up -d postgres` |
| Build and test the backend | `cd backend/spring-boot && ./mvnw verify` |
| Run the backend from source | `cd backend/spring-boot && ./mvnw spring-boot:run` |
| Format Java code | `cd backend/spring-boot && ./mvnw spotless:apply` |
| Lint the API contract | `npx @redocly/cli lint contract/openapi.yaml` |

The API listens on `http://localhost:8080`. Its health endpoint is
`http://localhost:8080/actuator/health`.

## Coding Standards

- **Language:** all identifiers, comments, documentation, commit messages and API text are in English.
- **Formatting and linting** are automated, not debated:

| Language | Tooling |
|---|---|
| Java | Spotless + google-java-format |
| TypeScript | ESLint + Prettier |
| Kotlin | ktlint |
| Swift | swift-format |

- **Build hygiene:** code builds without warnings, and linters report zero errors.
- **Immutability first:** use `final`, `val`, `let`, `const`, records and data classes.
- **Clean code:**
  - A function does one thing.
  - No dead code and no commented-out code.
  - A `TODO` must reference an issue: `TODO(#42): ...`.
  - Comments explain *why*, not *what*.
- **Errors** are handled explicitly. An exception is never caught and ignored.
- **Dependencies:** the standard library and platform APIs come first. A pull request that adds a
  dependency must state why it's needed.

## Naming Conventions

| Element | Convention | Example |
|---|---|---|
| Classes, structs, types | PascalCase | `ContactMessageService` |
| Functions, variables | camelCase | `findById` |
| Constants (Java/Kotlin) | UPPER_SNAKE_CASE | `MAX_PAGE_SIZE` |
| React component files | PascalCase | `ContactForm.tsx` |
| Other TypeScript files | kebab-case | `api-client.ts` |
| Database tables and columns | snake_case, plural table names | `contact_messages.created_at` |
| URL paths | kebab-case, plural nouns | `/api/v1/contact-messages` |
| JSON fields, query parameters | camelCase | `avatarUrl`, `?status=NEW` |
| Environment variables | UPPER_SNAKE_CASE | `JWT_SECRET` |
| Branches | `type/kebab-description` | `feature/contact-form` |

Role suffixes: `*Controller`, `*Service`, `*Repository`, `*ViewModel`, `*Screen` (Android),
`*View` (iOS), `*Request` and `*Response` (API models).

### Application identifiers

| Application | Identifier |
|---|---|
| Spring Boot | groupId `com.mustafagokselgokmen`, artifactId `api`, base package `com.mustafagokselgokmen.api` |
| Web | npm package `mustafagokselgokmen-web` (private) |
| Android | `applicationId` and `namespace` `com.mustafagokselgokmen.android` |
| iOS | bundle identifier `com.mustafagokselgokmen.ios` |

The Android `applicationId` and the iOS bundle identifier can't be changed after the first store
release. Alternative backends follow their own ecosystem's conventions (for example, a Go module
path) and document them in their standard.

## API Standards

- The contract comes first. Every API change starts in `contract/openapi.yaml`.
- Every path starts with `/api/v1`. Resources are plural nouns.
- Status codes, pagination, sorting and filtering follow [docs/api.md](docs/api.md).
- Every error is a ProblemDetail (RFC 9457) response with a machine-readable `code`.
- Entities are never returned. Every request and response shape is a contract schema.
- Breaking changes are either versioned or deprecated, and are explicitly marked in the pull request.

## Database Standards

- PostgreSQL everywhere, including in tests.
- Schema changes are made only through Flyway migrations. Migrations are forward-only, and an
  applied migration is never edited.
- Naming: snake_case, plural table names.
- Keys: UUID primary keys.
- Every table has `created_at` and `updated_at` columns of type `timestamptz`.
- Integrity rules are enforced by database constraints.
- No soft delete by default.

Details: [docs/database.md](docs/database.md)

## Security Standards

- **Tokens:** JWT access tokens (15 minutes) plus rotating refresh tokens (30 days).
- **Token storage:**
  - Web: an HttpOnly, Secure cookie
  - Android: Android Keystore
  - iOS: Keychain
- **Identity:** users sign in with Google and are identified by Google's `sub` claim, never by
  email. The application stores no passwords.
- **Admins:** the `ADMIN` role comes from an allowlist of verified emails (`ADMIN_EMAILS`).
- **Secrets:** come only from environment variables and are never committed.
- **Input:** all input is validated on the server.
- **Queries:** parameterized only.

Details: [docs/security.md](docs/security.md)

## Testing Standards

- A feature is not complete until it has tests.
- A bug fix starts with a failing regression test.
- Tests run against a real PostgreSQL through Testcontainers, never H2.
- Every backend implementation passes the same contract tests: Schemathesis and Hurl, run against
  `contract/openapi.yaml`.

Details: [docs/testing.md](docs/testing.md)

## Git Standards

- **Branches:** `main`, `develop`, `feature/*`, `fix/*`, `refactor/*`
- **Commits:** Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`)
- **Merging:**
  - squash-merge into `develop`
  - release merge from `develop` into `main`, tagged with SemVer

Details: [docs/git.md](docs/git.md)

## DevOps and Observability Standards

- **Images:** every deployable application ships as a Docker image, built by a multi-stage
  Dockerfile. The image runs as a non-root user and has a health check.
- **Configuration:** comes only from environment variables. The same image runs in every
  environment.
- **CI:** one GitHub Actions workflow per application, triggered by changes to that application.
  - Stages: lint, build, tests, security scans, image build.
  - Every check must pass before merging.
- **CD:** a SemVer tag on `main` publishes images to GitHub Container Registry.
- **Logging:** containers log structured JSON to stdout. Health is exposed through Actuator.
- **Not used:** Kubernetes and Redis, until a concrete need appears
  ([ADR-007](docs/decisions/007-containers-and-ci-cd.md)).

Details: [docs/devops.md](docs/devops.md), [docs/observability.md](docs/observability.md)

## Documentation Standards

- Documentation changes go in the same pull request as the code change.
- A decision that affects architecture is recorded as an ADR in
  [docs/decisions/](docs/decisions/) (`NNN-kebab-title.md`). Accepted ADRs are never rewritten;
  a new ADR supersedes them.
- API documentation lives in the contract, as descriptions on operations and fields, not in
  separate prose.
- `README.md` stays high-level. Details belong in `docs/`.

## Definition of Done

A change is done when all of these hold:

- [ ] Any API change is in `contract/openapi.yaml`, and lint plus the breaking-change check pass.
- [ ] The implementation follows the layer rules of the affected application.
- [ ] Tests exist at the levels required by [docs/testing.md](docs/testing.md), and they pass.
- [ ] For a backend change, the contract tests pass.
- [ ] Build, formatter and linter pass with no new warnings.
- [ ] Every CI check on the pull request is green.
- [ ] Documentation and ADRs are updated.
- [ ] No secrets, credentials or personal data are committed.
- [ ] Breaking changes are listed in the pull request description.

## Prohibited Practices

- Returning JPA entities from the API, or hand-writing models that the contract generates.
- Editing generated code.
- Editing, reordering or deleting an applied migration; `ddl-auto=update`.
- Using H2, or any database other than PostgreSQL, in tests.
- Putting business logic in controllers, views or composables; skipping a layer.
- Storing tokens in `localStorage`, `sessionStorage`, plain SharedPreferences or UserDefaults.
- Committing secrets, `.env` files or credentials.
- Logging tokens, contact message content or personal data.
- Identifying users by email instead of by Google's `sub` claim.
- Rendering user-submitted content as HTML.
- Test-only login endpoints, or flags that bypass token verification.
- Building SQL/JPQL by string concatenation.
- Changing the architecture without an ADR.
- Adding a dependency without a stated reason.
- Disabling or skipping tests to make a build pass.
- Force-pushing to `main` or `develop`, or committing to them directly.

When a standard conflicts with a requirement, raise the conflict and resolve it by changing the
standard (with an ADR where applicable). Don't work around it.
