import "server-only";

import { cookies } from "next/headers";

import type { TokenResponse } from "@/lib/api/types";
import { isSecureDeployment } from "@/lib/env";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
/** Holds `state`, `nonce`, the PKCE verifier and `returnTo` between the two sign-in requests. */
export const SIGN_IN_COOKIE = "sign_in";

/** ADR-003: a refresh token is valid for 30 days. */
const REFRESH_TOKEN_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
/** An unfinished sign-in is abandoned after ten minutes (docs/frontend/nextjs.md). */
export const SIGN_IN_MAX_AGE_SECONDS = 10 * 60;
/**
 * The access cookie is dropped by the browser slightly before its token expires, so a request never
 * carries a token that dies on the way. When it's gone and a refresh token remains, the proxy
 * refreshes.
 */
const EXPIRY_SKEW_SECONDS = 30;

export interface CookieDescriptor {
  name: string;
  value: string;
  options: {
    httpOnly: true;
    sameSite: "lax";
    secure: boolean;
    path: "/";
    maxAge: number;
  };
}

function descriptor(name: string, value: string, maxAge: number): CookieDescriptor {
  return {
    name,
    value,
    options: {
      httpOnly: true,
      // Lax still sends the cookie on the top-level redirect back from Google, and not on
      // cross-site POSTs.
      sameSite: "lax",
      secure: isSecureDeployment(),
      path: "/",
      maxAge,
    },
  };
}

/** The cookies that represent a signed-in browser. Nothing else may write them. */
export function sessionCookies(tokens: TokenResponse): CookieDescriptor[] {
  return [
    descriptor(
      ACCESS_TOKEN_COOKIE,
      tokens.accessToken,
      Math.max(1, tokens.expiresIn - EXPIRY_SKEW_SECONDS),
    ),
    descriptor(REFRESH_TOKEN_COOKIE, tokens.refreshToken, REFRESH_TOKEN_MAX_AGE_SECONDS),
  ];
}

/** Both session cookies, expired. Used on logout and whenever a refresh is refused. */
export function clearedSessionCookies(): CookieDescriptor[] {
  return [descriptor(ACCESS_TOKEN_COOKIE, "", 0), descriptor(REFRESH_TOKEN_COOKIE, "", 0)];
}

export function signInCookie(value: string): CookieDescriptor {
  return descriptor(SIGN_IN_COOKIE, value, SIGN_IN_MAX_AGE_SECONDS);
}

export function clearedSignInCookie(): CookieDescriptor {
  return descriptor(SIGN_IN_COOKIE, "", 0);
}

export async function readAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function readRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_TOKEN_COOKIE)?.value;
}

/**
 * Writes cookies from a Route Handler or a Server Action. Server Components can't set cookies, so
 * they never call this.
 */
export async function writeCookies(descriptors: CookieDescriptor[]): Promise<void> {
  const store = await cookies();
  for (const { name, value, options } of descriptors) {
    store.set(name, value, options);
  }
}
