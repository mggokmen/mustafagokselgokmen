import * as client from "openid-client";
import { NextResponse, type NextRequest } from "next/server";

import { oidc, redirectUri } from "@/lib/auth/oidc";
import { safeReturnTo } from "@/lib/auth/return-to";
import { signInCookie } from "@/lib/auth/session";

/**
 * Starts sign-in. The browser is sent to Google; `state`, `nonce` and the PKCE verifier wait in a
 * short-lived HttpOnly cookie for the callback to check them
 * (docs/security.md#web-sign-in-flow).
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const config = await oidc();

  const codeVerifier = client.randomPKCECodeVerifier();
  const pending = {
    state: client.randomState(),
    nonce: client.randomNonce(),
    codeVerifier,
    returnTo: safeReturnTo(request.nextUrl.searchParams.get("returnTo")),
  };

  const authorizationUrl = client.buildAuthorizationUrl(config, {
    redirect_uri: redirectUri(),
    scope: "openid email profile",
    code_challenge: await client.calculatePKCECodeChallenge(codeVerifier),
    code_challenge_method: "S256",
    state: pending.state,
    nonce: pending.nonce,
  });

  const response = NextResponse.redirect(authorizationUrl);
  const cookie = signInCookie(JSON.stringify(pending));
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
