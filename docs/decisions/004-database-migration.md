# ADR-004: Database migrations with Flyway

- Status: Accepted
- Date: 2026-09-22

## Context

The database schema has to be reproducible in every environment (developer machines, Testcontainers,
CI, production) and reviewable like any other code change.

## Decision

- Flyway manages the schema, with plain SQL migrations (`V{n}__{description}.sql`).
- Migrations are forward-only. An applied migration is never edited, reordered or deleted.
- The application validates the schema on startup (`ddl-auto=validate`) and never generates it.
- Destructive changes are split across two releases: stop using, then drop.

Details: [database.md](../database.md#migrations).

## Alternatives considered

- **Hibernate schema generation (`ddl-auto=update`):** not reviewable, not reproducible, and it can't
  express data migrations or safe destructive changes.
- **Liquibase:** its database-independent changelog format has no value with a single database
  engine. Plain SQL is simpler to read and review.

## Consequences

- Every schema change goes through code review as plain SQL.
- Tests run against the real schema, created by the same migrations.
- Fixing a mistake always means adding a new migration.
- Whether alternative backends share these migrations is decided in a separate ADR, when the second
  backend implementation starts.
