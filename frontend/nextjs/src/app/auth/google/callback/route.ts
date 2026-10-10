import * as client from "openid-client";
import { NextResponse, type NextRequest } from "next/server";

import { createApiClient, unwrap } from "@/lib/api/api-client";
import { oidc, redirectUri } from "@/lib/auth/oidc";
import { safeReturnTo } from "@/lib/auth/return-to";
import {
  SIGN_IN_COOKIE,
  clearedSignInCookie,
  sessionCookies,
  type CookieDescriptor,
} from "@/lib/auth/session";
import { env } from "@/lib/env";

interface PendingSignIn {
  state: string;
  nonce: string;
  codeVerifier: string;
  returnTo: string;
}

/**
 * Finishes sign-in: checks what was started here, exchanges the code with Google, and trades the
 * resulting ID token for this API's own tokens. Nothing from the query string is trusted until
 * `state` and `nonce` have matched the cookie.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const pending = readPendingSignIn(request);
  if (pending === undefined) {
    // No cookie: the browser took longer than ten minutes, or this callback was reached without
    // starting a sign-in here.
    return failed("expired");
  }

  let idToken: string | undefined;
  try {
    const tokens = await client.authorizationCodeGrant(await oidc(), currentUrl(request), {
      pkceCodeVerifier: pending.codeVerifier,
      expectedState: pending.state,
      expectedNonce: pending.nonce,
      idTokenExpected: true,
    });
    idToken = tokens.id_token;
  } catch {
    // A mismatched state or nonce, a reused code, or an error returned by Google.
    return failed("failed");
  }

  if (idToken === undefined) {
    return failed("failed");
  }

  let session: CookieDescriptor[];
  try {
    const result = await createApiClient().POST("/api/v1/auth/google", { body: { idToken } });
    session = sessionCookies(unwrap(result));
  } catch {
    // The backend verifies the token again and owns the decision: an unverified email or an
    // audience that isn't ours is refused here, not in this app.
    return failed("rejected");
  }

  const response = NextResponse.redirect(new URL(safeReturnTo(pending.returnTo), env().APP_URL));
  for (const cookie of [...session, clearedSignInCookie()]) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }
  return response;
}

function readPendingSignIn(request: NextRequest): PendingSignIn | undefined {
  const raw = request.cookies.get(SIGN_IN_COOKIE)?.value;
  if (raw === undefined) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as PendingSignIn).state === "string" &&
      typeof (parsed as PendingSignIn).nonce === "string" &&
      typeof (parsed as PendingSignIn).codeVerifier === "string"
    ) {
      return parsed as PendingSignIn;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

/** The public address, not the one the request happened to arrive on. */
function currentUrl(request: NextRequest): URL {
  const url = new URL(redirectUri());
  url.search = request.nextUrl.search;
  return url;
}

function failed(reason: string): NextResponse {
  const login = new URL("/login", env().APP_URL);
  login.searchParams.set("error", reason);
  const response = NextResponse.redirect(login);
  const cleared = clearedSignInCookie();
  response.cookies.set(cleared.name, cleared.value, cleared.options);
  return response;
}
