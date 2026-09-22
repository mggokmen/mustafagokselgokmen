# ADR-003: Authentication with JWT access tokens and rotating refresh tokens

- Status: Accepted
- Date: 2026-09-22

## Context

The API serves a web app and two native mobile apps, and it has several backend implementations that
must behave identically. Authentication must:
- work without server-side sessions
- allow sessions to be revoked
- keep tokens out of reach of browser JavaScript

## Decision

- **Access token:** a JWT signed with HS256, valid for 15 minutes, verified on every request.
- **Refresh token:**
  - an opaque random value, valid for 30 days
  - stored hashed on the server
  - rotated on every use
  - reusing an already-rotated token revokes the whole token family
- **Web:** backend-for-frontend. The Next.js server holds both tokens in HttpOnly cookies and calls
  the backend with a Bearer header. The browser never sees a token.
- **Mobile:** tokens are stored in the Android Keystore (encrypted DataStore) and the iOS Keychain.

Details: [security.md](../security.md#authentication).

## Alternatives considered

- **Server-side sessions with cookies:** a poor fit for native clients, and each backend would need
  shared session storage.
- **Only long-lived JWTs:** can't be revoked before they expire.
- **Tokens in browser storage:** any XSS vulnerability could steal them.
- **An external identity provider** (Keycloak, Auth0): more infrastructure than the project needs
  now. It remains an option; the token contract would stay the same.

## Consequences

- The backend is stateless for requests. It needs no CORS or CSRF handling, because browsers never
  call it directly.
- A stolen access token is usable for at most 15 minutes. A stolen refresh token is detected the
  next time the legitimate client refreshes.
- Every client implements refresh handling, and each must ensure that concurrent 401 responses
  trigger only one refresh.
- The web app depends on its server for every backend call. It can't be served as static files alone.
