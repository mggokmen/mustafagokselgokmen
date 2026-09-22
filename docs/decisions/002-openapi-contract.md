# ADR-002: OpenAPI contract first

- Status: Accepted
- Date: 2026-09-22

## Context

Several clients (web, Android, iOS) and several backend implementations (Spring Boot, Go, .NET,
FastAPI) must expose and consume exactly the same API. Hand-written clients drift apart. A spec
generated from one backend's code makes that backend's behavior the de facto standard, including its
accidents.

## Decision

`contract/openapi.yaml` is the canonical API contract.

- Every API change starts in the contract.
- Each backend implements server interfaces generated from the contract.
- Each client uses code generated from the contract. Generated code is never edited.
- The contract uses OpenAPI 3.0.3, the version every chosen generator supports fully.
- Every backend is verified against the contract with the same test suite: Schemathesis for
  conformance, Hurl for scenarios.

## Alternatives considered

- **Code first** (the spec generated from Spring annotations with springdoc): the spec would become a
  by-product of one implementation, and the other backends would have to reverse-engineer it.
- **Hand-written clients and DTOs:** three copies of every model, kept in sync manually.

## Consequences

- API disagreements show up at build time (generated code) or in the contract tests, not at runtime.
- Clients can be built against the contract before the backend exists.
- Generator limitations shape the contract: named schemas only, no generic types, OpenAPI 3.0.
- Every API change takes one extra step: editing the contract, then regenerating code.
