# ADR-001: API versioning in the URL path

- Status: Accepted
- Date: 2026-09-22

## Context

Three clients and several backend implementations depend on the same API. Mobile apps can't be
force-updated, so older app versions keep calling the API long after a change ships. The version an
app calls must be explicit and easy to see.

## Decision

The API version is part of the URL path: `/api/v1/...`.

- Non-breaking changes are made within the current version.
- A breaking change introduces `/api/v2`. It runs alongside `v1` until every client has migrated.

What counts as breaking is defined in [api.md](../api.md#compatibility).

## Alternatives considered

- **A version in a header or media type** (`Accept: application/vnd.x.v1+json`): invisible in logs
  and in the browser, harder to test with plain HTTP tools, and handled inconsistently by code
  generators.
- **A version query parameter:** easy to omit by accident, and it mixes versioning with filtering.

## Consequences

- The version is visible in every request, log line and test.
- Every generator and HTTP client supports it without configuration.
- Running two versions at once means maintaining two sets of routes on every backend. That cost
  keeps breaking changes rare.
