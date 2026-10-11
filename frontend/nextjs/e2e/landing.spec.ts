import { expect, test } from "@playwright/test";

/**
 * The page a visitor sees first, and the headers it arrives with. The styling assertions are not
 * cosmetic: production once served this page under a Content-Security-Policy written for a static
 * placeholder, which blocked the stylesheet and every script. The HTML was still perfect, so
 * nothing that reads the markup could tell ([ADR-012](../../../docs/decisions/012-security-headers.md)).
 */

test("the page arrives with the policy that lets it render", async ({ page }) => {
  const response = await page.goto("/");

  const headers = response?.headers() ?? {};
  const policy = headers["content-security-policy"] ?? "";
  expect(policy).toContain("script-src 'self' 'unsafe-inline'");
  expect(policy).toContain("style-src 'self' 'unsafe-inline'");
  expect(policy).toContain("form-action 'self'");
  expect(policy).toContain("frame-ancestors 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});

test("the browser loads the stylesheet rather than refusing it", async ({ page }) => {
  const refusals: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && message.text().includes("Content Security Policy")) {
      refusals.push(message.text());
    }
  });

  await page.goto("/");

  // A blocked request never reaches the network, so it leaves no resource timing behind.
  const stylesheets = await page.evaluate(
    () =>
      performance.getEntriesByType("resource").filter((entry) => entry.name.endsWith(".css"))
        .length,
  );
  expect(stylesheets, "the stylesheet must actually be fetched").toBeGreaterThan(0);
  const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(background, "an unstyled body is transparent").not.toBe("rgba(0, 0, 0, 0)");
  expect(refusals).toEqual([]);
});

test("the page says who built it, what it is, and where the code is", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mustafa Göksel Gökmen");
  await expect(page.getByRole("link", { name: "Try the application" })).toHaveAttribute(
    "href",
    "/login",
  );
  await expect(page.getByRole("link", { name: "Read the source" })).toHaveAttribute(
    "href",
    /github\.com/,
  );
  for (const section of [
    "A contract first, then everything else",
    "Numbers that come from a test runner",
    "Four problems, and what was done about them",
    "Products I build and run",
    "Get in touch",
  ]) {
    await expect(page.getByRole("heading", { name: section })).toBeVisible();
  }
});

test("the diagram says which parts are not deployed", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("img", { name: /One OpenAPI contract/ })).toBeVisible();
  await expect(page.getByText("built and tested, not deployed")).toBeVisible();
});
