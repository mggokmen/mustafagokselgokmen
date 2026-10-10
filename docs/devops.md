# DevOps Standards

This document describes how the applications are built, packaged, configured, verified in CI and
delivered.

## Environments

| Environment | How it runs | Configuration |
|---|---|---|
| Local development | Docker Compose runs PostgreSQL. The API runs either in Compose or from source. | `.env` files (gitignored), copied from `.env.example` |
| CI | GitHub Actions on `ubuntu-latest`. Testcontainers provides PostgreSQL. | No secrets are needed to build and test |
| Production | Images from GitHub Container Registry, configured with environment variables | The hosting platform's secret store (to be decided) |

The same image runs in every environment; only the configuration changes. Nothing
environment-specific is baked into an image.

## Docker

### Images

- **One multi-stage Dockerfile per deployable application,** kept next to its code:
  `backend/spring-boot/`, `backend/notification-service/` and `frontend/nextjs/`.
- **The build context is the repository root:** the API's build reads `contract/openapi.yaml`, and
  one `.dockerignore` then covers every image. It keeps everything else out of the context,
  including every `.env` file.
- **Build stage:**
  - Uses a JDK image.
  - Dependencies are resolved in their own cached layer, then the application is built.
  - Tests don't run here. CI runs them before it builds the image.
- **Runtime stage:**
  - Uses a JRE-only image.
  - Uses the Spring Boot layered jar, so dependency layers are rebuilt only when dependencies change.
  - Runs as a non-root user.
  - Has a `HEALTHCHECK` against `/actuator/health`.
- **The web runtime stage** ships Next.js's standalone output: a server and the files it traced,
  without the sources or a package manager. **npm and corepack are removed**, because a runtime has
  no use for them and their bundled dependencies are the image's largest source of reported
  vulnerabilities.
- **The build takes no configuration.** If a build ever needed a secret to succeed, the same image
  could not run in every environment, so that would be the bug.
- **Base images** are pinned to a major version (`eclipse-temurin:21-jre`, `node:24-alpine`,
  `postgres:18`). Dependabot proposes updates.
- **Logging:** containers log JSON; local runs log plain text ([observability.md](observability.md)).

### Docker Compose

- **`docker-compose.yml`** at the repository root defines the local stack: `postgres`, `kafka`,
  `api`, `notification` and `web`. The web app can also run from source against the stack
  (`npm run dev`), which is the usual way to work on it.
- **The contract test stack leaves Kafka and the notification service out** and sets
  `OUTBOX_TARGET=log`, because those tests check the API, not the broker.
- **Each service has its own database.** `docker/postgres/init/` creates the notification service's
  database and role when the data volume is empty. An existing stack picks it up after
  `docker compose down -v`.
- **Only containers with a real purpose.** For example, Redis is not added until a feature needs it
  ([ADR-007](decisions/007-containers-and-ci-cd.md)).
- **Port:** PostgreSQL is published on host port **5433**, so it doesn't clash with a locally
  installed PostgreSQL.

| Command | What it does |
|---|---|
| `docker compose up -d postgres` | Starts the database only, for running the API from source |
| `docker compose up --build` | Starts the database, the broker, the API and the notification service |
| `docker compose down` | Stops the stack and keeps the data. Add `-v` to also delete the database volume. |

## Configuration and secrets

- **All configuration comes from environment variables.**
- **Local development:**
  - The root `.env` is read by Compose.
  - `backend/spring-boot/.env` is read by the API when it runs from source.
  - Only the `.env.example` files are committed.
- **CI:**
  - Secrets live in GitHub Actions secrets.
  - Each workflow and job declares the minimum `permissions` it needs.
- **Production:** secrets come from the platform's secret store. They are never in the image, the
  repository or the Compose file.

## Continuous integration

Workflows live in `.github/workflows/`.
- **Pull requests** run every workflow, whichever files changed. That way each required check
  always reports a result (see [Branch protection](#branch-protection)).
- **Pushes to `main` and `develop`** run a workflow only when the files it covers change (path
  filters).

| Workflow | Stages |
|---|---|
| `contract.yml` | 1. Lint (Redocly)<br>2. Breaking-change check against the target branch (oasdiff; pull requests only) |
| `backend-spring-boot.yml` | 1. Format check (Spotless)<br>2. Build, including code generation<br>3. Unit and integration tests (Testcontainers)<br>4. Docker image build<br>5. Image vulnerability scan (Trivy)<br>6. Contract tests: Hurl and Schemathesis via `contract/run-tests.sh` |
| `backend-notification-service.yml` | 1. Format check (Spotless)<br>2. Build<br>3. Consumer tests against PostgreSQL and Kafka (Testcontainers)<br>4. Docker image build<br>5. Image vulnerability scan (Trivy) |
| `web.yml` | 1. Generate the API types from the contract<br>2. Format check (Prettier)<br>3. Lint (ESLint)<br>4. Type check (`tsc`)<br>5. Unit tests (Vitest)<br>6. Build<br>7. Docker image build<br>8. Image vulnerability scan (Trivy)<br>9. End-to-end tests: a real browser against the API and a mock identity provider (`frontend/nextjs/e2e/run-tests.sh`) |
| `codeql.yml` | Static security analysis (CodeQL) of the Java code and the workflow files. Also runs weekly. |

The target pipeline for a pull request is:

```
Lint → Build → Unit tests → Integration tests → Contract tests → Security scan → Docker build
```

What is not in CI yet: **Android and iOS workflows.** They are added when those applications are
scaffolded.

Path filters don't trigger on a branch's first push. The contract and backend workflows can also be
started manually (`workflow_dispatch`), for example with
`gh workflow run backend-spring-boot.yml --ref develop`.

Every check must pass before merging ([git.md](git.md)).

## Branch protection

`main` and `develop` are protected with these settings:

| Setting | Value |
|---|---|
| Changes only through pull requests | yes; 0 required approvals, because there is a single maintainer |
| Required status checks | `Lint` and `Breaking changes` (Contract)<br>`Lint, build and test`, `Docker image and vulnerability scan` and `Contract tests` (Backend)<br>`Lint, build and test the notification service` and `Notification image and vulnerability scan` (Notification service)<br>`Lint, build and test the web app`, `Web image and vulnerability scan` and `Web end-to-end tests` (Web)<br>`Analyze (java-kotlin)` and `Analyze (actions)` (CodeQL) |
| Branch must be up to date before merging | yes |
| Conversations must be resolved | yes |
| Force pushes and deletion | blocked |
| Rules apply to administrators | yes |

When a workflow or job is added or renamed, update this list and the branch protection settings in
the same pull request.

## Continuous delivery

CI and CD are separate. CI proves that a change is correct; CD publishes a released version.

| Trigger | Result |
|---|---|
| Tag `vX.Y.Z` on `main` (`release.yml`) | One image per deployable — `mustafagokselgokmen-api`, `mustafagokselgokmen-notification` and `mustafagokselgokmen-web` under `ghcr.io/<owner>/` — each tagged `X.Y.Z`, `X.Y`, `latest` and the commit SHA |

Deployment isn't configured yet. Once a hosting target is chosen, a `deploy` job runs after the
image is published:
- to staging, from `develop`
- to production, from release tags, behind a GitHub Environment that requires manual approval

## Supply chain

- **Actions:**
  - Third-party actions are pinned to a full commit SHA, with the version in a comment.
  - GitHub-owned actions (`actions/*`, `github/*`) are pinned to a major version tag.
  - Dependabot updates both.
- **Tools** used in workflows are pinned to a version (`@redocly/cli@2.54.0`, `oasdiff@v1.32.1`).
- **Dependabot** checks Maven, Docker, Docker Compose and GitHub Actions weekly. It opens pull
  requests against `develop`, using Conventional Commit messages.
- **Major versions of Java (`eclipse-temurin`) and PostgreSQL** are ignored by Dependabot. Moving
  to a new major version is a project decision that changes the build, the images, CI and the
  documentation together.
- **Vulnerability gates:**
  - Trivy scans images and fails on CRITICAL or HIGH findings that have a fix available.
  - CodeQL scans the code.
  - Dependabot alerts cover dependencies.

## Not used yet

- **Kubernetes:** one API and one database don't need an orchestrator.
- **Redis:** nothing needs cache or state shared across instances yet.

The reasoning is in [ADR-007](decisions/007-containers-and-ci-cd.md).
