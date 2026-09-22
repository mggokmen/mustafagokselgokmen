# ADR-006: Sign in with Google

- Status: Accepted
- Date: 2026-09-22

## Context

The application needs authenticated users for two reasons: to attribute contact messages to their
authors and to grant admin access. Storing passwords would bring a lot of extra work: hashing, reset
flows, email verification and brute-force protection. Every client platform (web, Android, iOS) has
native support for Google sign-in.

## Decision

Google is the only identity provider.

- **Each client gets a Google ID token its own way:**
  - Web: an OAuth code flow run by the Next.js server
  - Android: Credential Manager
  - iOS: the Google Sign-In SDK
- **The client exchanges the token** at `POST /api/v1/auth/google`. The backend:
  1. verifies the token (signature, issuer, audience, expiry, `email_verified`)
  2. creates the user or refreshes their profile
  3. issues its own access and refresh tokens ([ADR-003](003-authentication.md))
- **Users are identified by Google's `sub` claim**, never by email.
- **`ADMIN` is granted** through an allowlist of verified emails (`ADMIN_EMAILS`).
- **The issuer and the JWKS URI are configurable**, so automated tests can use a mock OpenID Connect
  provider.

Details: [security.md](../security.md#authentication).

## Alternatives considered

- **Email and password:** all the account-management work described above, for no benefit to this
  product.
- **The backend runs the OAuth redirect flow itself:** awkward for native apps, and it doesn't fit
  the mobile sign-in SDKs.
- **Using Google tokens directly as API tokens:**
  - Their audience is a Google client, not this API.
  - They can't be revoked by us.
  - They carry no application roles.
  - Every backend would depend on Google's token lifecycle.
- **Sessions managed by Auth.js in Next.js:** they only work for the web, so mobile would need a
  second mechanism.

## Consequences

- No passwords are stored, and there are no reset or verification flows.
- Every user needs a Google account.
- A Google Cloud project with OAuth client IDs for web, Android and iOS is required.
- The API's own token design (ADR-003) stays the same. Google is involved only at sign-in.
- Each backend implements ID token verification. Every ecosystem in scope has a mature library for
  this.
- Contract tests sign in through a mock provider, so they never depend on Google.
- Publishing the iOS app on the App Store would require an additional login option that meets App
  Review Guideline 4.8. This is out of scope for the MVP.
