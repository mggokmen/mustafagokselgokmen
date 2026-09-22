# Spring Boot Standard (`backend/spring-boot/`)

This document covers what is specific to the Spring Boot implementation. The rules shared by all
backends are in [api.md](../api.md), [database.md](../database.md), [security.md](../security.md)
and [testing.md](../testing.md).

## Stack

- Java 21, built with the Maven wrapper (`./mvnw`). Maven coordinates: `com.mustafagokselgokmen:api`.
- Spring Boot 4.x, with the version pinned in `pom.xml`
- Spring Web MVC (not WebFlux)
- Spring Boot Actuator, used for health checks ([observability.md](../observability.md))
- Spring Data JPA (Hibernate), PostgreSQL, Flyway, Bean Validation
- Spring Security with OAuth2 Resource Server (Nimbus JOSE for JWT)
- openapi-generator-maven-plugin
- Bucket4j for rate limiting
- No Lombok: the contract generates the API models, and there are only a few entities.

## Package layout (bounded contexts)

```
src/main/java/com/mustafagokselgokmen/api/
├── identity/                          who the user is and what they may do
│   ├── User.java                      @Entity
│   ├── Role.java                      enum
│   ├── UserRepository.java
│   ├── UserService.java               creates or updates users from a verified Google identity
│   ├── AuthController.java            implements the generated AuthApi
│   ├── AuthService.java               Google sign-in, refresh, logout
│   ├── GoogleIdTokenVerifier.java     verifies Google ID tokens
│   ├── TokenService.java              issues access tokens and refresh tokens
│   ├── RefreshToken.java              @Entity
│   └── RefreshTokenRepository.java
├── contact/                           contact messages
│   ├── ContactMessageController.java  implements the generated ContactMessagesApi
│   ├── ContactMessageService.java
│   ├── ContactMessageRepository.java
│   ├── ContactMessage.java            @Entity that enforces its own status transitions
│   ├── ContactMessageStatus.java      enum with the allowed transitions
│   └── ContactMessageMapper.java      entity <-> generated models
└── common/
    ├── error/                         GlobalExceptionHandler, domain exceptions
    └── config/                        SecurityConfig, JPA auditing, rate limiting
```

This is a lightweight use of DDD: bounded contexts and domain rules, without extra layers.
- `contact` refers to a user only by ID. It reads just the user fields it needs for `author`, and
  never changes identity data.
- A context's entities are changed only by that context's services.
- A new package or interface needs a concrete reason, such as a second implementation or a real
  boundary.

Generated code goes under `target/`. The interfaces are in `com.mustafagokselgokmen.api.generated`
and the models are in `com.mustafagokselgokmen.api.generated.model`.

## Layer rules

**Controller**
- Implements the generated `XxxApi` interface. It declares no mappings of its own.
- Calls exactly one service method and returns a `ResponseEntity`.
- Contains no business logic, no repository access, no entities, no try/catch.

**Domain model (entities and enums)**
- Protects its own invariants. `ContactMessage.changeStatus(newStatus)` checks
  `ContactMessageStatus.canTransitionTo(...)` and throws `ConflictException` if the transition isn't
  allowed.
- A field governed by a rule has no public setter. New objects are created through constructors or
  factory methods that validate their input.
- Depends on no Spring beans.

**Service**
- Orchestrates use cases: loads and saves aggregates, checks authorization, and owns the
  transaction. `@Transactional(readOnly = true)` goes on the class and `@Transactional` on each
  write method.
- Delegates domain rules to the domain model instead of re-implementing them.
- Accepts and returns generated API models. Entities are mapped inside the transaction, so lazy
  associations resolve safely with `open-in-view` turned off.
- Throws domain exceptions (`NotFoundException`, `ConflictException`, `RateLimitedException`). It
  never throws HTTP types or `ResponseStatusException`.

**Repository**
- Spring Data interfaces only.
- Queries are derived or written in JPQL. A native query needs a comment explaining why.
- Associations that a response needs are loaded with `@EntityGraph` or fetch joins. For example,
  the `author` of a contact message. No N+1 queries.
- Role scoping is done in the query. For a `USER`, the service calls a method filtered by
  `user.id`; it never loads every row and filters in memory.

**Mapper**
- A plain class with explicit code. No mapping framework.

## Persistence

- `spring.jpa.hibernate.ddl-auto=validate` and `spring.jpa.open-in-view=false`.
- Migrations live in `src/main/resources/db/migration/` and follow
  [database.md](../database.md#migrations).
- **IDs:** `UUID`, generated with `@UuidGenerator` in the time-ordered style (version 7).
- **Timestamps:** `Instant`, with `createdAt` and `updatedAt` filled in by JPA auditing.
- **Versioning:** `ContactMessage` has `@Version`. Before changing the status, the service compares
  the `version` in the request with the entity's version. A mismatch throws `ConflictException`.
- **Associations** are `LAZY`. No cascades.

## Validation

- **Structural rules** are generated from the contract as Bean Validation annotations
  (`useBeanValidation=true`). Don't repeat them by hand.
- **Business rules** (status transitions, ownership, rate limits) are checked in the service, which
  throws a domain exception.

## Error handling

A single `@RestControllerAdvice` extending `ResponseEntityExceptionHandler` writes the ProblemDetail
format from [api.md](../api.md#errors):

| Exception | Status | `code` |
|---|---|---|
| `MethodArgumentNotValidException`, `HandlerMethodValidationException`, `HttpMessageNotReadableException`, `ConstraintViolationException` | 400 | `VALIDATION_FAILED` |
| `InvalidGoogleTokenException` | 401 | `UNAUTHENTICATED` |
| `NotFoundException` | 404 | `NOT_FOUND` |
| `ConflictException`, `OptimisticLockingFailureException`, `DataIntegrityViolationException` | 409 | `CONFLICT` |
| `RateLimitedException` | 429 | `RATE_LIMITED`, with `Retry-After` |
| Any other exception | 500 | `INTERNAL_ERROR`, logged with its stack trace; the client gets a generic `detail` |

Spring Security rejects unauthenticated and unauthorized requests before they reach the advice. A
custom `AuthenticationEntryPoint` (401, `UNAUTHENTICATED`) and a custom `AccessDeniedHandler` (403,
`FORBIDDEN`) write the same ProblemDetail format.

## Security

- **Stateless:**
  - `SessionCreationPolicy.STATELESS`
  - CSRF disabled
  - no CORS configuration ([security.md](../security.md#cors))
- **Two separate JWT decoders:**

| Decoder | Built with | Used for |
|---|---|---|
| API access tokens | `NimbusJwtDecoder.withSecretKey(...)`, HS256 | Registered as the resource server decoder. The `role` claim becomes a `ROLE_*` authority through a `JwtAuthenticationConverter`. |
| Google ID tokens | `NimbusJwtDecoder.withJwkSetUri(GOOGLE_JWKS_URI)` | Used only inside `GoogleIdTokenVerifier`. It is never registered as the resource server decoder. |

- **Google ID token verification:**
  - Validators check the issuer against `GOOGLE_ISSUERS`, the audience against
    `GOOGLE_CLIENT_IDS`, the token timestamps, and that `email_verified == true`.
  - This needs no Google client library.
- **API access tokens** are issued with `NimbusJwtEncoder`. No hand-written JWT code, and no
  third-party JWT library.
- **Refresh tokens:**
  - Generated with `SecureRandom`.
  - Stored as SHA-256 hashes in `refresh_tokens`.
  - Rotated and revoked as described in [security.md](../security.md#api-tokens).
- **Roles:** on every sign-in, `UserService` sets the user's role from `ADMIN_EMAILS`.
- **Authorization:**
  - `SecurityFilterChain` declares which routes are public and which require authentication.
  - Role rules and ownership rules use `@PreAuthorize` on service methods.
- **Rate limiting:** Bucket4j buckets kept in memory (the backend runs as a single instance), keyed
  by IP for `/auth` endpoints and by user ID for sending messages.

## Configuration

- `application.yml` holds the defaults and never secrets.
- When the API runs from source, it also reads `backend/spring-boot/.env` (gitignored; copy it from
  `.env.example`), through `spring.config.import`. In containers, real environment variables are
  used instead ([devops.md](../devops.md#configuration-and-secrets)).
- Profile-specific files, such as `application-local.yml` for seed data, are added only when they
  are actually needed.
- **Environment variables:**

| Variable | Required | Purpose |
|---|---|---|
| `DB_URL`, `DB_USER`, `DB_PASSWORD` | yes | Database connection |
| `JWT_SECRET` | yes | Signs API access tokens |
| `GOOGLE_CLIENT_IDS` | yes | Accepted audiences, comma-separated: the web and iOS client IDs |
| `ADMIN_EMAILS` | no | Comma-separated emails that are granted `ADMIN` |
| `GOOGLE_ISSUERS`, `GOOGLE_JWKS_URI` | no | Default to Google; overridden only by tests |

- The application refuses to start if a required variable is missing.
- **Swagger UI**, if enabled, serves the static contract: springdoc is pointed at `/openapi.yaml`.
  Never generate the spec from annotations.

## Container image

`backend/spring-boot/Dockerfile` is a multi-stage build. Its build context is the repository root.
The resulting image runs the layered jar on a JRE, as a non-root user, with a health check.
Details: [devops.md](../devops.md#docker).

## Code generation

openapi-generator-maven-plugin:
- `inputSpec`: `${project.basedir}/../../contract/openapi.yaml`
- `generatorName`: `spring`
- `apiPackage`: `com.mustafagokselgokmen.api.generated`
- `modelPackage`: `com.mustafagokselgokmen.api.generated.model`
- `configOptions`:
  - `interfaceOnly=true`
  - `useTags=true`
  - `useBeanValidation=true`
  - `openApiNullable=false`
  - `skipDefaultInterface=true`
  - the Spring Boot option that matches the pinned major version
