import { NextResponse, type NextRequest } from "next/server";

import { refreshSession } from "@/lib/auth/refresh";
import { safeReturnTo } from "@/lib/auth/return-to";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearedSessionCookies,
} from "@/lib/auth/session";

/**
 * Guards the signed-in area and keeps the access token fresh. It is the first line, not the only
 * one: a Server Action is a POST to the page's own route, so every action checks the session
 * itself as well (docs/frontend/nextjs.md).
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  if (request.cookies.has(ACCESS_TOKEN_COOKIE)) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken === undefined) {
    return toLogin(request);
  }

  let refreshed;
  try {
    refreshed = await refreshSession(refreshToken);
  } catch {
    // The token was expired, already used or revoked. Whatever the reason, this browser has no
    // session any more, and the stale cookies go with it.
    const response = toLogin(request);
    for (const cookie of clearedSessionCookies()) {
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    }
    return response;
  }

  // The new token is put on the request as well, so the page rendering behind this proxy uses it
  // instead of waiting for the next request.
  for (const cookie of refreshed) {
    request.cookies.set(cookie.name, cookie.value);
  }
  const response = NextResponse.next({ request: { headers: request.headers } });
  for (const cookie of refreshed) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  return response;
}

function toLogin(request: NextRequest): NextResponse {
  const login = new URL("/login", request.nextUrl.origin);
  const returnTo = safeReturnTo(request.nextUrl.pathname + request.nextUrl.search);
  if (returnTo !== "/") {
    login.searchParams.set("returnTo", returnTo);
  }
  return NextResponse.redirect(login);
}

export const config = {
  // Only the signed-in area. Without a matcher this would also run for static files and images.
  matcher: ["/account/:path*", "/contact/:path*", "/admin/:path*"],
};
