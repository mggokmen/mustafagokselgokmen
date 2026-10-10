import "server-only";

import * as client from "openid-client";

import { env } from "@/lib/env";

let discovered: Promise<client.Configuration> | undefined;

/**
 * The OpenID Connect provider, discovered once per server process. Hand-written OAuth handling is
 * not allowed: the library validates the responses, the state, the nonce and the PKCE verifier
 * (docs/security.md#web-sign-in-flow).
 */
export function oidc(): Promise<client.Configuration> {
  discovered ??= discover().catch((error: unknown) => {
    // A failed discovery must not be cached, or one flaky start would break sign-in until the
    // process restarts.
    discovered = undefined;
    throw error;
  });
  return discovered;
}

async function discover(): Promise<client.Configuration> {
  const { GOOGLE_ISSUER, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = env();
  const issuer = new URL(GOOGLE_ISSUER);
  // Google is always https. Plain http means the mock provider used by the tests, and the library
  // refuses to talk to it unless this is said out loud. It has to be said here rather than on the
  // finished configuration, because discovery is itself a request to the issuer.
  const insecure =
    issuer.protocol === "http:" ? { execute: [client.allowInsecureRequests] } : undefined;
  return client.discovery(issuer, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, undefined, insecure);
}

/** Where Google sends the browser back. It must match the URI registered for the OAuth client. */
export function redirectUri(): string {
  return new URL("/auth/google/callback", env().APP_URL).toString();
}
