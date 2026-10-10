# Next.js Standard (`frontend/nextjs/`)

## Stack

- Next.js with the App Router
- React
- TypeScript in `strict` mode, with no `any`
- Tailwind CSS
- `openapi-typescript` and `openapi-fetch`
- `openid-client` for Sign in with Google
- zod

## Backend-for-frontend

```
Browser --(HttpOnly cookies)--> Next.js server --(Authorization: Bearer)--> Backend
```

- **The browser never sees tokens and never calls the backend.** Every backend call goes through a
  Server Component, a Server Action or a Route Handler.
- **`src/lib/api/api-client.ts` is the only module that creates the `openapi-fetch` client.** It:
  - is marked `server-only`
  - takes the access token from the session (`lib/auth`), which read it from the cookies
  - exposes `unwrap()`, which returns the body of a successful call and throws a typed `ApiError`
    for anything else, so a failed request is never mistaken for an empty result
- **Components never call `fetch` to get backend data.**
- **Every environment variable is server-only:** `API_BASE_URL`, `APP_URL`, `GOOGLE_CLIENT_ID`,
  `GOOGLE_CLIENT_SECRET`. None of them has the `NEXT_PUBLIC_` prefix.

## Layout

```
src/
├── app/
│   ├── (public)/                    public pages: static, no API calls
│   ├── login/page.tsx               "Sign in with Google"
│   ├── auth/google/route.ts         starts the OAuth flow
│   ├── auth/google/callback/route.ts
│   ├── (app)/layout.tsx             signed-in area
│   ├── (app)/contact/page.tsx       contact form + the user's own messages
│   ├── (app)/admin/messages/page.tsx  every message, filtered, with the status workflow
│   ├── error.tsx
│   └── not-found.tsx
├── features/contact/                components, actions.ts (Server Actions), schemas.ts (zod)
├── components/ui/                   shared presentational components
├── lib/api/                         api-client.ts, api-error.ts, types.ts, schema.d.ts (generated)
├── lib/auth/                        OIDC client setup, session cookie helpers
└── proxy.ts                         route protection and token refresh
```

## Server and client components

- **Components are Server Components by default**, and data is fetched in them.
- **`"use client"` only for interactivity**: state, effects, event handlers, browser APIs. Client
  components stay small, sit at the leaves of the component tree, and receive data as props.
- **Mutations are Server Actions.** An action calls the API client, then calls `revalidatePath` or
  `redirect`.
- **Where state lives:**
  - filters, pagination and sort: the URL (`searchParams`)
  - local UI state: React state
  - no global store
- **No client-side data-fetching library by default.** If one becomes necessary, it calls a Route
  Handler, never the backend.

## Sign-in

1. **`/login`** links to `/auth/google?returnTo=<path>`.
2. **`auth/google/route.ts`:**
   - Uses `openid-client` to create `state`, `nonce` and a PKCE verifier.
   - Stores them in an `HttpOnly` cookie that lives 10 minutes.
   - Redirects to Google with the scopes `openid email profile`.
3. **`auth/google/callback/route.ts`:**
   - Checks `state`, exchanges the code (client secret + PKCE verifier), and checks `nonce`.
   - Sends the resulting ID token to `POST /api/v1/auth/google`.
   - Sets the access and refresh token cookies (`HttpOnly`, `SameSite=Lax`, `Secure` in
     production) and deletes the temporary cookie.
   - Redirects to `returnTo`, which must be a relative path.
4. **`proxy.ts`:**
   - Redirects to `/login` when a protected route has no session cookie.
   - Refreshes tokens: when the access cookie is gone and a refresh token remains, it calls
     `/auth/refresh`, puts the new token on the request so the page behind it uses it, and sets the
     new cookies on the response. No token is ever parsed here; the access cookie is given a
     lifetime slightly shorter than its token, so "missing" is the signal to refresh.
   - **One refresh at a time.** A browser sends several requests at once — a page and the prefetch
     of a link — and all of them arrive without an access cookie. They share a single exchange
     (`lib/auth/refresh.ts`), because reusing a refresh token revokes the whole family
     ([ADR-003](../decisions/003-authentication.md)) and would sign the visitor out.
   - The sharing is per server process, like instance-local rate limiting: several instances would
     each refresh once. That becomes a question when there is more than one instance to deploy.
5. **Server Components can't set cookies,** so they never refresh tokens. On a 401 they call
   `redirect("/login")`.
6. **Logout** is a Server Action. It calls `/auth/logout`, deletes both cookies, and redirects.

## Admin views

- **Who may see them is the backend's answer.** The page asks `/auth/me` and shows anyone who
  isn't an `ADMIN` a **not found**, rather than a "not allowed": a page they may not use is not one
  whose existence they need confirmed. The backend refuses them with 403 regardless of what this
  app renders.
- **The status buttons offer only the moves the workflow allows**
  ([architecture.md](../architecture.md#message-status)), so the admin is not invited to ask for
  something that will be refused. The backend still decides.
- **Optimistic concurrency is carried by the form.** Each message's `version` is a hidden field, so
  a change is made against the message as it was displayed. A 409 means someone got there first, or
  the move isn't allowed: the list is revalidated and the admin is told, and nothing is overwritten.
- **Filters live in the URL** (`?status=NEW`), so a filtered list can be linked to and reloaded.

## Contact form

- The contact form submits to a Server Action. The action:
  1. validates the input with zod
  2. calls `createContactMessage`
  3. returns field errors, shown through `useActionState`
- A 400 response's `errors[]` array is mapped onto the matching form fields.
- A 429 response shows the retry time from `Retry-After`.
- The zod schemas mirror the contract's constraints (subject 1–150, message 1–5000, not blank). The
  server remains the authority.
- Message content is rendered as plain text only ([security.md](../security.md#xss)).

## Types

API types come only from the generated `schema.d.ts`. They are aliased in `lib/api/types.ts`, for
example `type ContactMessage = components["schemas"]["ContactMessageResponse"]`.

## Error handling

| `ApiError` | Handling |
|---|---|
| 401 | `redirect("/login")` |
| 404 | `notFound()` |
| 400 in a Server Action | return field errors to the form |
| 409 | show a message and reload the current data |
| 429 | show when the user can try again |
| Anything else | throw; `error.tsx` renders a generic message, never raw backend text |

## Security headers

`next.config` and `proxy.ts` set the headers listed in [security.md](../security.md#xss), including
a nonce-based Content-Security-Policy.

## Code generation

`npm run gen:api` runs `openapi-typescript ../../contract/openapi.yaml -o src/lib/api/schema.d.ts`.
It runs automatically through the `predev` and `prebuild` scripts. The output is gitignored.

## Commands

Node 24. Configuration comes from `.env.local`, copied from `.env.example`.

| Task | Command |
|---|---|
| Install | `npm install` |
| Develop | `npm run dev` |
| Unit tests | `npm test` (`npm run test:watch` while working) |
| End-to-end tests | `e2e/run-tests.sh` from anywhere (requires Docker) |
| Lint, format, types | `npm run lint`, `npm run format`, `npm run typecheck` |
| Build | `npm run build` |

Sign-in needs a Google OAuth client. To work without one, point `GOOGLE_ISSUER` at a mock provider,
which is what `e2e/run-tests.sh` does.

## Container

- **Standalone output** (`output: "standalone"`): the image holds a server and the files Next traced,
  not the sources and not a package manager.
- **Configuration is read at runtime,** so the image built in CI is the image that runs anywhere.
  The build is given no secrets at all.
- **`/healthz`** answers for the container's health check. It says that this process is serving and
  nothing more — no backend call — so a backend outage doesn't get the web app restarted.
- **`PORT` and `HOSTNAME`** are the server's own variables; the container sets `HOSTNAME=0.0.0.0` so
  it listens outside itself.
- Run it in the stack with `docker compose up --build web`, or from source with `npm run dev`.

## Tests

- **Vitest runs in a Node environment**, because everything tested here runs on the server. The
  config maps `server-only` to React's empty module, so server modules can be tested the way the
  server loads them.
- **Async Server Components are not unit-tested.** The Next.js testing guide recommends end-to-end
  tests for them, and that is where they are covered.
- **What unit tests are for:** the API client, error mapping, session and cookie helpers, and
  anything that decides something (redirects, validation, `returnTo`).
- **What end-to-end tests are for:** everything about a session that only a browser can show —
  which cookies it holds, what they are marked with, and where it is allowed to go. The cases are
  listed in [testing.md](../testing.md#web).
