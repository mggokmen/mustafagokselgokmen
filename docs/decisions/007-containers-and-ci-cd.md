# ADR-007: Docker Compose and GitHub Actions, without Kubernetes or Redis for now

- Status: Accepted
- Date: 2026-09-22

## Context

The project needs three things: local environments that can be reproduced, automated checks on
every change, and artifacts that can be published. Backends and clients will be added over time.
Today there is one API instance and one database, maintained by a single developer.

## Decision

- **Images:** every deployable application ships as a Docker image, built by a multi-stage
  Dockerfile.
- **Local stack and tests:** Docker Compose defines the local stack. Integration tests use
  Testcontainers.
- **CI:** GitHub Actions runs a workflow per application, triggered by path filters.
- **CD:** GitHub Actions runs on release tags and publishes the images to GitHub Container Registry.
- **Kubernetes and Redis** are not introduced until a concrete need appears.

Details: [devops.md](../devops.md).

## Alternatives considered

- **Kubernetes, including locally with kind or minikube:** it brings orchestration, service
  discovery and scaling, which a single API instance doesn't need, at a large operational cost.
- **Redis for rate limiting and caching:** in-memory rate limiting is correct for a single
  instance, and PostgreSQL already stores refresh tokens. Redis becomes relevant once the API runs
  as several instances.
- **Services installed directly on each machine instead of Compose:** the setup differs from one
  machine and developer to the next.
- **GitLab CI or Jenkins:** GitHub Actions is already integrated with the repository, Dependabot,
  CodeQL and GitHub Container Registry.

## Consequences

- A local setup needs only Docker, plus the SDKs for the applications being worked on.
- Every change is built and tested the same way in CI.
- Running several API instances will require revisiting rate limiting, with either Redis or a limit
  backed by the database. That change needs its own ADR.
- A deployment target still has to be chosen. The images are ready for any container platform.
