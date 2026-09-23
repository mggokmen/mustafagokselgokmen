# Security Standards

## Authentication

Authentication has two steps. First, Google proves who the user is. Then the API issues its own
tokens, which the client uses for every later request.

### Identity: Sign in with Google

- **Google is the only identity provider.** The application stores no passwords.
  See [ADR-006](decisions/006-google-sign-in.md).
- **Each client gets a Google ID token** with the scopes `openid email profile`:

| Client | How it gets the token |
|---|---|
| Web | The authorization code flow with PKCE, `state` and `nonce`, run by the Next.js server. The client secret never leaves that server. |
| Android | Credential Manager (Sign in with Google), with the web client ID as `serverClientId`. |
| iOS | The Google Sign-In SDK. |

- **The client sends the ID token** to `POST /api/v1/auth/google`. The backend accepts it only if
  all of these hold:
  - The signature verifies against Google's published keys (JWKS).
  - `iss` is `https://accounts.google.com` or `accounts.google.com`.
  - `aud` is one of the project's OAuth client IDs (`GOOGLE_CLIENT_IDS`).
  - `exp` is in the future.
  - `email_verified` is `true`.
- **Users are identified by the Google `sub` claim**, stored as `users.google_subject`, never by
  email. An email address can change, and a Google Workspace address can be reassigned to someone
  else.
- **The profile is refreshed on every sign-in.** `email`, `name` and `avatar_url` are updated from
  the token. If `name` is missing, the email is used instead.
- **The Google ID token is used once.** It is never stored or forwarded.

### API tokens

- **Access token:**
  - A JWT signed with HS256, valid for 15 minutes.
  - Claims: `sub` (the application's own user ID, not Google's), `role`, `iat`, `exp`.
  - Verified on every request. There is no server-side session.
- **Refresh token:**
  - An opaque random value of 256 bits, valid for 30 days.
  - Stored only as a SHA-256 hash, together with its user, expiry and token family.
  - **Rotated on every use:** the token that was presented becomes invalid.
  - **Reuse detection:** if a token that was already rotated is presented again, the whole family
    is revoked, which logs out every session derived from it.
  - Logout revokes the family.
  - A refresh issues the new access token with the user's current role from the database.

## Roles

| Role | How it's assigned |
|---|---|
| `USER` | Every new user gets it. |
| `ADMIN` | Granted at sign-in when the user's verified email is in `ADMIN_EMAILS`. Removed at the next sign-in once the email is no longer listed. |

- A role change takes effect at the user's next sign-in.
- No API endpoint changes roles.

## Token storage

| Platform | Storage | Never |
|---|---|---|
| Web | `HttpOnly`, `Secure`, `SameSite=Lax` cookies, set by the Next.js server; browser JavaScript can't read them | `localStorage`, `sessionStorage`, cookies readable by JavaScript |
| Android | DataStore, encrypted with an Android Keystore key (Tink) | plain SharedPreferences, files, logs |
| iOS | Keychain (`kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly`) | UserDefaults, files, logs |

## Authorization

- **Enforced only in the backend's service layer.** Clients may hide UI the user can't use, but a
  client is never the enforcement point.
- **Contact messages are private:**
  - A message can be read only by its author and by `ADMIN`.
  - Anyone else gets 404.
  - For a `USER`, list endpoints return only their own messages.

## Rate limiting

| Endpoint | Limit | Status |
|---|---|---|
| `POST /auth/google` | 10 requests per minute per client | implemented |
| `POST /auth/refresh` | 30 requests per minute per client | implemented |
| `POST /contact-messages` | 5 messages per user per hour | with the contact feature |

- Exceeding a limit returns 429 with the `RATE_LIMITED` code and a `Retry-After` header in seconds.
- Limits are configurable (`RATE_LIMIT_SIGN_IN_REQUESTS`, `RATE_LIMIT_REFRESH_REQUESTS`).
- A client is its IP address, so a deployment behind a proxy or load balancer has to pass the real
  address through. Otherwise every request looks like one client.
- **Counting is local to the application instance.** Running several instances behind a load
  balancer needs a shared store, such as Redis, otherwise each instance allows the full limit on its
  own. Introducing it will need its own ADR, like every other piece of infrastructure
  ([ADR-007](decisions/007-containers-and-ci-cd.md)).
- General API limits are added when a real need appears.

## Web sign-in flow

- **`openid-client`** runs the OAuth/OpenID Connect flow. Hand-written OAuth handling is not allowed.
- **`state`, `nonce` and the PKCE verifier:**
  - They protect against callback CSRF, token replay and authorization-code interception.
  - They are kept in an `HttpOnly` cookie that lives 10 minutes and is deleted after the callback.
- **The post-login redirect target (`returnTo`)** must be a relative path. This prevents open
  redirects.

## CORS

- **The backend has no CORS configuration.** Browsers never call it directly (see the BFF in
  [architecture.md](architecture.md)), and mobile apps aren't subject to CORS.
- If a browser client ever needs direct access, use an explicit allowlist of origins. Never use `*`
  together with credentials.

## CSRF

- **Backend:** CSRF protection is disabled. The backend accepts only Bearer tokens in a header,
  never cookies.
- **Web:**
  - Session cookies are `SameSite=Lax`.
  - Mutations go through Server Actions, which Next.js protects with an Origin check.
  - Route Handlers that change state verify the `Origin` header.

## Input validation

- **Every input is validated on the server.**
  - Structure is defined by the contract: types, lengths, patterns and ranges.
  - Business rules are checked in the service layer.
- Client-side validation only improves the user experience.
- Request bodies are limited to 1 MB unless an endpoint documents otherwise.

## SQL injection

- Only parameterized queries are allowed: Spring Data, JPQL parameters, prepared statements.
- Building SQL or JPQL by concatenating strings is prohibited.
- Sort fields from the client pass through an allowlist before they reach a query.

## XSS

- **Contact messages are untrusted input**, and admins view them. They are always rendered as plain
  text, never as HTML or Markdown.
- React escapes output. `dangerouslySetInnerHTML` is prohibited.
- The web app sends these headers:
  - a nonce-based `Content-Security-Policy`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `frame-ancestors 'none'`
- The API returns only JSON, with the correct `Content-Type`.

## Secrets and configuration

- **Secrets come only from environment variables:**
  - `.env*` files are gitignored.
  - A `.env.example` with placeholder values is committed.

| Secret | Held by |
|---|---|
| `JWT_SECRET` (at least 256 random bits) | Backend |
| Database credentials | Backend |
| `GOOGLE_CLIENT_SECRET` | Next.js server only |

- **Startup:** an application refuses to start if a required secret is missing.
- **Mobile apps** contain only OAuth client IDs, which are public by design. Treat anything inside an
  app binary as public.
- **A leaked secret** is rotated immediately. Rewriting git history alone isn't enough.

## Test identity provider

- **The backend's Google settings can be overridden:**
  - `GOOGLE_ISSUERS` sets the accepted token issuers.
  - `GOOGLE_JWKS_URI` sets where the signing keys are fetched from.
  - Both default to Google.
- **Automated tests** point these settings at a local mock OpenID Connect provider. The mock signs
  ID tokens for a test `USER` and a test `ADMIN`.
- No backend has a test-only login endpoint or a flag that bypasses verification.
- Production deployments never override these settings.

## Logging

- **Never log:**
  - tokens (Google ID, access, refresh) or the `Authorization` header
  - request bodies of `/auth` endpoints
  - the subject or body of contact messages
  - personal data beyond the user ID
- Every request log includes the user ID and a request ID, so events can be traced.
- For a 500 error, the stack trace goes to the logs and the client gets a generic message.

## File uploads

These rules apply once any feature accepts uploads:

- The server enforces a maximum file size.
- Allowed content types come from an allowlist and are checked by the file's signature (magic
  bytes), never by its extension or its `Content-Type` header.
- Files are stored outside the application, or in object storage, under random names. The original
  file name is kept only as metadata.
- Files are served with `Content-Disposition` and `X-Content-Type-Options: nosniff`, and are never
  executed.
- Images are re-encoded, which strips metadata such as EXIF.

## Transport

- HTTPS everywhere except in local development. HSTS is enabled in production.
- Cleartext HTTP is allowed only in debug builds: through the Android network security config, and
  through an iOS ATS exception in the Debug configuration.

## Dependencies

- Dependabot proposes dependency updates and raises vulnerability alerts.
- In CI, CodeQL analyzes the code and Trivy scans every image. A CRITICAL or HIGH finding that has a
  fix available fails the build ([devops.md](devops.md#supply-chain)).
- A known critical vulnerability blocks a release.
