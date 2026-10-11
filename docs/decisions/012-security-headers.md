# ADR-012: The application sends its own security headers

- Status: Accepted
- Date: 2026-10-11

## Context

[security.md](../security.md) has said since the first release that the web app sends a
nonce-based `Content-Security-Policy`. It never did. Nothing in `frontend/nextjs/` set a single
header, and no test looked for one, so the claim survived four releases unchallenged.

The headers a visitor actually received came from the nginx vhost on the server. That vhost was
written while the domain served a static placeholder, and its policy was written for that page:

```
default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
```

When the vhost became a reverse proxy in front of a Next.js application
([ADR-011](011-deployment.md)), the policy stayed. `default-src 'none'` with no `script-src` blocks
every script; a `style-src` that permits only inline styles blocks a stylesheet served as a file.
So production served **correct HTML with no CSS and no JavaScript**: an unstyled page, no
hydration, and `form-action 'none'` on top of that, which would have refused the contact form's
submission had anyone reached it.

Nothing caught this. The markup was right, so every check that reads markup passed — the build,
the unit tests, the end-to-end tests against a local server, and a `curl` of the deployed page.
What a browser was permitted to do with that markup was decided somewhere else entirely.

## Decision

### The headers ship with the code

`frontend/nextjs/next.config.ts` sets them, for every route. They are versioned, reviewed and
deployed with the application that depends on them, and a reverse proxy in front of it adds none
of its own.

Two `Content-Security-Policy` headers are not a fallback; a browser enforces every policy it
receives, so the result is their intersection and the strictest one silently wins. One source is
the only arrangement that can be reasoned about.

### The policy

| Directive | Why |
|---|---|
| `default-src 'self'` | Nothing is loaded from anywhere else. The application has no CDN, no analytics and no embedded media. |
| `script-src 'self' 'unsafe-inline'` | Next.js inlines the bootstrap that hands a prerendered page to React. |
| `style-src 'self' 'unsafe-inline'` | The stylesheet is a file; inline styles come from the framework. |
| `img-src 'self' data:` | The app renders no remote images. Avatars are stored as a URL and not displayed. |
| `connect-src 'self'` | The browser never calls the API directly; that is the point of the BFF. |
| `form-action 'self'` | Server Actions post to the page's own route. |
| `frame-ancestors 'none'`, `base-uri 'none'`, `object-src 'none'` | Clickjacking, base-tag injection and plugins. |

It also sends `X-Content-Type-Options`, `Referrer-Policy`, `Cross-Origin-Opener-Policy` and a
`Permissions-Policy` that turns off camera, microphone and geolocation.

### `'unsafe-inline'` for scripts, deliberately, and what makes it defensible

A nonce is per request. A page that carries one cannot be prerendered, so a nonce would make every
public page dynamic — and public pages being static is a stated property of this
architecture ([architecture.md](../architecture.md#web)).

What `'unsafe-inline'` protects against is an attacker who can already get markup into the page.
This application renders no user-supplied HTML anywhere: contact messages are plain text,
`dangerouslySetInnerHTML` is prohibited, and React escapes everything else
([security.md](../security.md#xss)). The directive is therefore a second line of defence that is
weakened, not the only one that is missing.

**The day any user-controlled content is rendered as markup, this trade stops being defensible**
and the nonce comes back, with the public pages becoming dynamic as its price.

### A test that a browser has to pass

`e2e/landing.spec.ts` asserts the headers, and asserts that a real browser **fetched the
stylesheet** and that the body is not transparent. The original failure was invisible to every
check that reads HTML, so the regression test is one that only a browser can fail.

## Alternatives considered

- **Fix the nginx vhost and leave it there.** It is one line and it is faster — it is how the live
  site was restored within minutes. As the permanent arrangement it keeps the policy in a file this
  repository cannot see, test or review, which is what produced the outage.
- **A nonce through the proxy, for every route.** Strictest, and it costs the static rendering of
  every public page. Worth paying when there is user-controlled markup to defend; there is none.
- **Hash-based `script-src`.** Next.js does not publish stable hashes for its inline bootstrap, so
  this would mean recomputing them on every build and discovering a mistake in production.
- **Report-only first.** Sound practice for a policy change on a live site with traffic. Here the
  policy was already broken in production, so reporting would have delayed the fix without telling
  anyone anything new.

## Consequences

- The reverse proxy must not add security headers for this site. `deploy/README.md` says so, and
  the vhost's own line is removed once a release carrying this change is deployed.
- `security.md` no longer promises a nonce. It describes what is sent and why, including the cost.
- A policy change is now a pull request with a failing test behind it, not an edit on a server.
- Cloudflare's analytics beacon is blocked by `script-src 'self'`. Nothing in the product needs it,
  and the privacy policy is quieter for its absence.
