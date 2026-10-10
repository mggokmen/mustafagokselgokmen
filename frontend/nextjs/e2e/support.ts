import type { BrowserContext, Page } from "@playwright/test";

export const ACCESS_TOKEN = "access_token";
export const REFRESH_TOKEN = "refresh_token";
export const SIGN_IN = "sign_in";

/**
 * The mock provider signs in without asking anything, so reaching /auth/google is the whole flow:
 * authorization request, callback, code exchange, and the backend's own token pair.
 */
export async function signIn(page: Page, returnTo = "/account"): Promise<void> {
  await page.goto(`/auth/google?returnTo=${encodeURIComponent(returnTo)}`);
  await page.waitForURL(returnTo);
}

export async function cookieNames(context: BrowserContext): Promise<string[]> {
  return (await context.cookies()).map((cookie) => cookie.name);
}

/** Every test in a run signs in as this user, so they share one rate-limit bucket. */
export const TEST_USER_EMAIL = "user@example.com";
