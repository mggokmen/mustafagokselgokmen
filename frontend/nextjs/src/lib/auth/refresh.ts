import "server-only";

import { createApiClient, unwrap } from "@/lib/api/api-client";
import { sessionCookies, type CookieDescriptor } from "./session";

/**
 * Refresh tokens are single use, and reusing one revokes the whole family (ADR-003). A browser can
 * easily send two requests at once — a page and the prefetch of a link — and both would arrive
 * without an access token. Refreshing twice with the same token would then log the visitor out.
 *
 * So a refresh is shared: the first request performs it, and everything that arrives with the same
 * token while it is in flight, or just after, gets the same new cookies.
 */
const shared = new Map<string, Promise<CookieDescriptor[]>>();

/** How long a finished refresh keeps answering for the token it replaced. */
const SHARE_WINDOW_MS = 10_000;

export function refreshSession(refreshToken: string): Promise<CookieDescriptor[]> {
  const pending = shared.get(refreshToken);
  if (pending !== undefined) {
    return pending;
  }

  const started = exchange(refreshToken);
  shared.set(refreshToken, started);
  void started.then(
    () => {
      // Requests that set off before the new cookie reached the browser still carry the old token.
      setTimeout(() => shared.delete(refreshToken), SHARE_WINDOW_MS).unref?.();
    },
    () => {
      // A failure is not worth remembering: the next request should find out for itself.
      shared.delete(refreshToken);
    },
  );
  return started;
}

async function exchange(refreshToken: string): Promise<CookieDescriptor[]> {
  return sessionCookies(
    unwrap(await createApiClient().POST("/api/v1/auth/refresh", { body: { refreshToken } })),
  );
}
