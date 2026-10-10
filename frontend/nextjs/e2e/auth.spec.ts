import { expect, test } from "@playwright/test";

import { ACCESS_TOKEN, REFRESH_TOKEN, SIGN_IN, cookieNames, signIn } from "./support";

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test("an unauthenticated visitor is sent to sign-in, and told where they were going", async ({
  page,
}) => {
  await page.goto("/account");

  await expect(page).toHaveURL("/login?returnTo=%2Faccount");
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("signing in returns the visitor to the page they asked for", async ({ page }) => {
  await signIn(page, "/account");

  await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
  await expect(page.getByText("user@example.com").first()).toBeVisible();
  await expect(page.getByText("USER", { exact: true })).toBeVisible();
});

test("the session lives in cookies the browser's JavaScript cannot read", async ({
  page,
  context,
}) => {
  await signIn(page);

  const cookies = await context.cookies();
  const session = cookies.filter((cookie) => [ACCESS_TOKEN, REFRESH_TOKEN].includes(cookie.name));
  expect(session).toHaveLength(2);
  for (const cookie of session) {
    expect(cookie.httpOnly, `${cookie.name} must be HttpOnly`).toBe(true);
    expect(cookie.sameSite, `${cookie.name} must be SameSite=Lax`).toBe("Lax");
    expect(cookie.path).toBe("/");
  }
  // The temporary sign-in cookie is gone once the callback has used it.
  expect(await cookieNames(context)).not.toContain(SIGN_IN);

  await expect.poll(async () => page.evaluate(() => document.cookie)).not.toContain(ACCESS_TOKEN);
});

test("a callback without a sign-in cookie is refused", async ({ page }) => {
  await page.goto("/auth/google/callback?code=made-up&state=made-up");

  await expect(page).toHaveURL("/login?error=expired");
  // By its text, not its role: Next.js renders a route announcer with role="alert" too.
  await expect(page.getByText("That sign-in took too long")).toBeVisible();
});

test("a callback whose state does not match the one that was issued is refused", async ({
  page,
  context,
}) => {
  await context.addCookies([
    {
      name: SIGN_IN,
      value: JSON.stringify({
        state: "the-state-this-app-issued",
        nonce: "a-nonce",
        codeVerifier: "a-code-verifier-long-enough-to-look-real-000000000",
        returnTo: "/account",
      }),
      url: "http://localhost:3100",
    },
  ]);

  await page.goto("/auth/google/callback?code=made-up&state=a-state-someone-else-chose");

  await expect(page).toHaveURL("/login?error=failed");
  await expect(page.getByText("Sign-in could not be completed")).toBeVisible();
  expect(await cookieNames(context)).not.toContain(ACCESS_TOKEN);
});

test("an expired access token is renewed without the visitor noticing", async ({
  page,
  context,
}) => {
  await signIn(page);
  const before = (await context.cookies()).find((cookie) => cookie.name === REFRESH_TOKEN);
  expect(before).toBeDefined();

  // What the browser does when the access cookie reaches its age: only the refresh token is left.
  await context.clearCookies({ name: ACCESS_TOKEN });
  expect(await cookieNames(context)).not.toContain(ACCESS_TOKEN);

  await page.goto("/account");

  await expect(page.getByRole("heading", { name: "Account" })).toBeVisible();
  expect(await cookieNames(context)).toContain(ACCESS_TOKEN);
  // The refresh token is single use and rotates (ADR-003). Its value is random, so it always
  // changes; two access tokens minted in the same second for the same user are identical.
  const after = (await context.cookies()).find((cookie) => cookie.name === REFRESH_TOKEN);
  expect(after?.value).not.toBe(before?.value);
});

test("a visitor whose session is gone is sent back to sign-in", async ({ page, context }) => {
  await signIn(page);
  await context.clearCookies();

  await page.goto("/account");

  await expect(page).toHaveURL("/login?returnTo=%2Faccount");
});

test("a refresh token that the backend has revoked ends the session", async ({ page, context }) => {
  await signIn(page);
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL("/");

  const names = await cookieNames(context);
  expect(names).not.toContain(ACCESS_TOKEN);
  expect(names).not.toContain(REFRESH_TOKEN);

  await page.goto("/account");
  await expect(page).toHaveURL("/login?returnTo=%2Faccount");
});

test("a POST to a protected route is guarded too, like the Server Actions that use it", async ({
  request,
}) => {
  const response = await request.post("/account", {
    maxRedirects: 0,
    failOnStatusCode: false,
  });

  expect(response.status()).toBeGreaterThanOrEqual(300);
  expect(response.status()).toBeLessThan(400);
  expect(response.headers()["location"]).toContain("/login");
});

test("an already signed-in visitor is not shown the sign-in page again", async ({ page }) => {
  await signIn(page);

  await page.goto("/login?returnTo=%2Faccount");

  await expect(page).toHaveURL("/account");
});
