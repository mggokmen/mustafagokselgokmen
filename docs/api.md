# API Standards

[`contract/openapi.yaml`](../contract/openapi.yaml) is the API. This document describes the
conventions the contract follows. If the two disagree, the contract is fixed to match this document.

The contract uses **OpenAPI 3.0.3**, because every stack's code generator supports it fully.

## Change workflow

1. Edit `contract/openapi.yaml`.
2. Lint it: `npx @redocly/cli lint contract/openapi.yaml`
3. Check for breaking changes against `develop`:
   `oasdiff breaking <develop-version> contract/openapi.yaml`.
   If the change is breaking, follow [Compatibility](#compatibility).
4. Regenerate the code in every consumer ([Code generation](#code-generation)).
5. Implement the change in the backend, then update the clients.
6. Make sure the contract tests pass ([testing.md](testing.md#contract-tests)).

## Resources and URLs

- The API is REST over JSON. Every path starts with `/api/v1` ([ADR-001](decisions/001-api-versioning.md)).
- **Resources** are plural kebab-case nouns:
  - `/api/v1/contact-messages`
  - `/api/v1/contact-messages/{contactMessageId}`
- **Path parameters** are named `<resource>Id`, for example `contactMessageId`.
- **State changes** are modeled as a sub-resource that is replaced with `PUT`, for example
  `PUT /api/v1/contact-messages/{contactMessageId}/status`.
- **No verbs** appear in paths, except under `/api/v1/auth`.
- **JSON fields and query parameters** are camelCase.

## HTTP methods

| Method | Use | Idempotent | Request body |
|---|---|---|---|
| `GET` | Read a resource or a collection | yes | no |
| `POST` | Create a resource; the actions under `/auth` | no | yes |
| `PUT` | Replace a resource or a sub-resource (such as `/status`) completely | yes | yes |
| `DELETE` | Delete a resource | yes | no |

`PATCH` is not used. With partial updates, a generated Kotlin or Swift client can't tell an omitted
field from a field set to `null`. Replacing a sub-resource with `PUT` avoids that problem.

## Status codes

| Case | Status |
|---|---|
| `GET` succeeded | 200 |
| `POST` created a resource | 201, with a `Location` header and the created resource in the body |
| `PUT` succeeded | 200, with the resulting resource in the body |
| `DELETE` succeeded, or an action with no result | 204 |
| Malformed body, invalid parameter or failed validation | 400 |
| Access token missing, invalid or expired; sign-in rejected | 401 |
| Authenticated, but not permitted | 403 |
| Resource doesn't exist, or the caller isn't allowed to see it | 404 (so its existence isn't revealed) |
| Stale `version`, unique-constraint violation, or disallowed state transition | 409 |
| Rate limit exceeded | 429, with a `Retry-After` header |
| Unexpected server error | 500 (internals are never exposed) |

Every operation declares its 4xx responses. 500 is implied and isn't declared per operation.

## Errors

Every error body is a ProblemDetail (RFC 9457) with the content type `application/problem+json`:

```json
{
  "type": "about:blank",
  "title": "Validation failed",
  "status": 400,
  "detail": "Request body has 1 invalid field",
  "instance": "/api/v1/contact-messages",
  "code": "VALIDATION_FAILED",
  "errors": [{ "field": "subject", "message": "must not be blank" }]
}
```

| `code` | Status |
|---|---|
| `VALIDATION_FAILED` | 400 |
| `UNAUTHENTICATED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `CONFLICT` | 409 |
| `RATE_LIMITED` | 429 |
| `INTERNAL_ERROR` | 500 |

- Clients decide what to do based on `code`, never on `title` or `detail`. Those two are
  human-readable text and may change.
- `code` is typed as a plain string, not an enum, so adding a new code doesn't break existing
  clients.
- `errors` is present only when `code` is `VALIDATION_FAILED`. Field paths use dot and index
  notation, for example `items[0].name`.

## Pagination

Every collection endpoint is paginated.

- **Request:** `?page=0&size=20`. `page` is zero-based. `size` defaults to 20, with a maximum of 100.
- **Response:** each resource has its own page schema, such as `ContactMessagePage`. A single
  generic page schema can't be used, because not every generator handles generics:

```json
{ "items": [], "page": 0, "size": 20, "totalItems": 134, "totalPages": 7 }
```

## Sorting

- A single `sort=<field>,<asc|desc>` parameter, for example `sort=createdAt,desc`.
- The fields each endpoint can be sorted by are an allowlist in the contract (a `pattern`). Any
  other value returns 400.
- Each endpoint documents its default sort. The server always adds `id` as a final tie-breaker, so
  paging is deterministic.

## Filtering

- **Text search:** `q` does a case-insensitive "contains" search on the fields listed in the
  operation's description.
- **Exact-match filters** are named after the field: `?status=NEW`. To match several values, repeat
  the parameter: `?status=NEW&status=IN_PROGRESS`.
- **Range filters** use `<field>From` (inclusive) and `<field>To` (exclusive), for example
  `createdAtFrom` and `createdAtTo`.
- Only the filters declared in the contract are supported. Unknown query parameters are ignored.

## Validation

- **Structural rules** are defined in the contract and enforced by the backend: type, required,
  length, pattern, range.
- **Business rules** are enforced in the backend's service layer: allowed state transitions,
  ownership, rate limits.
- Client-side validation exists only to give quick feedback. The server is always the authority.

## Request and response models

- **Separate schemas for requests and responses:** `CreateXxxRequest`, `UpdateXxxStatusRequest`,
  `XxxResponse`, `XxxPage`. A resource embedded in another one uses `XxxSummary`, for example
  `UserSummary`.
- **Every schema is named** under `components/schemas`. Inline objects aren't allowed, because the
  generators need the names.
- **Every operation** has a camelCase `operationId` (`listContactMessages`) and exactly one `tag`.
  These become class and method names in every language.
- **Required and nullable:** every field that is always present is `required`. `nullable` is used
  only when null means something different from an absent field.
- **Formats:** IDs are UUID strings. Timestamps are ISO-8601 in UTC (`createdAt`, `updatedAt`).
  Enums are `UPPER_SNAKE_CASE` strings.
- **Related resources:** requests reference them by ID. Responses may embed a summary of them, as
  `author` does.
- **Internal data** never appears in a response: Google subject IDs, token hashes, internal flags.
- **Optimistic concurrency:** resources that can be changed through the API expose `version`. A
  `PUT` must send back the version it read. If that version is stale, the result is 409.

## Authentication

- **Sign-in:** users sign in with Google ([ADR-006](decisions/006-google-sign-in.md)).
  1. The client gets a Google ID token.
  2. It exchanges the token at `POST /api/v1/auth/google`.
  3. It receives this API's own token pair ([ADR-003](decisions/003-authentication.md)).
- **Protected operations** require `Authorization: Bearer <accessToken>`. In the contract this is
  the global `bearerAuth` scheme; public operations override it with `security: []`.
- **Auth endpoints:**

| Endpoint | Returns |
|---|---|
| `POST /api/v1/auth/google` | `TokenResponse` |
| `POST /api/v1/auth/refresh` | `TokenResponse` |
| `POST /api/v1/auth/logout` | 204 |
| `GET /api/v1/auth/me` | `UserResponse` |

- Token verification, lifetimes, rotation and storage are described in
  [security.md](security.md#authentication).

## Authorization

- **Roles:** `USER` and `ADMIN`. Each operation's description states the role it requires, for
  example "Requires role ADMIN".
- **Role-scoped collections:** one endpoint can return different data depending on the caller's
  role. `ADMIN` sees every contact message; `USER` sees only their own. The operation's description
  states the scope.
- **401, 403 or 404:**
  - 401: the caller isn't authenticated.
  - 403: the caller lacks the required role.
  - 404: the resource doesn't exist, or the caller isn't allowed to see it.

## Compatibility

Allowed within `/api/v1`:
- a new endpoint
- a new optional request field
- a new response field (every client ignores fields it doesn't know)
- a new error `code`

Breaking, so it requires `/api/v2` or a deprecation cycle:
- removing or renaming anything
- a new required request field
- a changed type or format
- a changed status code
- stricter validation
- a new enum value in a response

To deprecate something, set `deprecated: true` and name the replacement in its description. Remove
it only after every client has migrated. List every breaking change in the pull request description.

## Code generation

| Consumer | Tool | Output |
|---|---|---|
| `backend/spring-boot` | openapi-generator `spring` (`interfaceOnly`), Maven plugin | API interfaces and models, generated at build time |
| `frontend/nextjs` | `openapi-typescript` + `openapi-fetch` | `src/lib/api/schema.d.ts`, generated by `npm run gen:api` |
| `mobile/android` | openapi-generator `kotlin` (`jvm-retrofit2`, kotlinx serialization), Gradle plugin | generated at build time |
| `mobile/ios` | `swift-openapi-generator`, SPM build plugin | generated at build time |

Generated code is gitignored and never edited. If generated code is wrong, fix the contract or the
generator configuration.
