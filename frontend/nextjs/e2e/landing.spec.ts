import { expect, test } from "@playwright/test";

import { signIn } from "./support";

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
    "/contact",
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

test("the header and footer carry the site, on every public page", async ({ page }) => {
  await page.goto("/privacy");

  const header = page.getByRole("banner");
  await expect(header.getByRole("link", { name: "Mustafa Göksel Gökmen" })).toHaveAttribute(
    "href",
    "/",
  );
  await expect(header.getByRole("link", { name: "Send a message" })).toHaveAttribute(
    "href",
    "/contact",
  );

  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "LinkedIn" })).toHaveAttribute(
    "href",
    /linkedin\.com/,
  );
  // The version is read from package.json, so a build states its own version.
  await expect(footer.getByText(/^v\d+\.\d+\.\d+$/)).toBeVisible();
});

test("a phone gets the whole page, not a page wider than the phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow, "nothing may push the page sideways").toBe(0);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("a link to this site unfolds into a card that says who it is", async ({ page, request }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("Mustafa Göksel Gökmen · Senior Software Developer");
  // The card's address is absolute and canonical, because a scraper reads it from somewhere else
  // entirely. The image itself belongs to this build, so it is fetched from this server.
  const declared = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(declared).toMatch(/^https:\/\/mustafagokselgokmen\.com\.tr\/opengraph-image/);

  const image = await request.get(new URL(declared ?? "").pathname);
  expect(image.status()).toBe(200);
  expect(image.headers()["content-type"]).toContain("image/png");
});

test("a visitor who is already signed in lands on the form, not back here", async ({ page }) => {
  await signIn(page, "/");

  await page.getByRole("link", { name: "Try the application" }).click();

  // The first version of this page pointed at /login, which redirects a visitor who already has a
  // session to "/" — so signing in appeared to do nothing, and the form could not be found at all.
  await expect(page).toHaveURL("/contact");
  await expect(page.getByLabel("Subject")).toBeVisible();
});

test("a visitor without a session is taken through sign-in and left at the form", async ({
  page,
  context,
}) => {
  await context.clearCookies();
  await page.goto("/");

  await page.getByRole("link", { name: "Try the application" }).click();

  // The proxy guards /contact, and what it remembers is where the visitor was going.
  await expect(page).toHaveURL("/login?returnTo=%2Fcontact");
  await page.getByRole("link", { name: "Continue with Google" }).click();

  await expect(page).toHaveURL("/contact");
  await expect(page.getByLabel("Subject")).toBeVisible();
});

test("the Turkish page is the same page in another language, not another site", async ({
  page,
}) => {
  const response = await page.goto("/tr");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle("Mustafa Göksel Gökmen · Kıdemli Yazılım Geliştirici");
  await expect(page.getByRole("heading", { name: "Önce tanım, sonra kod" })).toBeVisible();
  // The numbers are the one thing both languages share: a test runner has no language. Comparing
  // the two pages keeps that true without this test having to know the current count.
  const turkishFigure = await page.locator("dl dt").first().innerText();
  await page.goto("/");
  expect(turkishFigure).toBe(await page.locator("dl dt").first().innerText());
  await page.goto("/tr");
  await expect(page.locator("div[lang='tr']").first()).toBeVisible();

  const alternates = await page
    .locator("link[rel='alternate']")
    .evaluateAll((links) =>
      links.map(
        (link) =>
          `${link.getAttribute("hreflang")} ${new URL((link as HTMLLinkElement).href).pathname}`,
      ),
    );
  expect(alternates).toEqual(expect.arrayContaining(["en /", "tr /tr"]));
});

test("the language switch crosses over and back, keeping the page", async ({ page }) => {
  await page.goto("/privacy");

  await page.getByRole("link", { name: "Türkçe" }).click();
  await expect(page).toHaveURL("/tr/privacy");
  await expect(page.getByRole("heading", { name: "Gizlilik", level: 1 })).toBeVisible();

  await page.getByRole("link", { name: "English" }).click();
  await expect(page).toHaveURL("/privacy");
  await expect(page.getByRole("heading", { name: "Privacy", level: 1 })).toBeVisible();
});

test("the Turkish page says what is only in English", async ({ page }) => {
  await page.goto("/tr");

  // The application behind sign-in is not translated, and the page admits it rather than
  // surprising a visitor who follows the button (ADR-013).
  await expect(
    page.getByText("Uygulamanın giriş sonrası ekranları şimdilik yalnızca İngilizce."),
  ).toBeVisible();
});

test("a crawler is told what to read and what to leave alone", async ({ request }) => {
  const robots = await request.get("/robots.txt");

  expect(robots.status()).toBe(200);
  const body = await robots.text();
  expect(body).toContain("Sitemap: https://mustafagokselgokmen.com.tr/sitemap.xml");
  // Everything behind sign-in answers a crawler with a redirect to /login.
  for (const path of ["/account", "/admin", "/contact", "/auth/"]) {
    expect(body).toContain(`Disallow: ${path}`);
  }
  // /login must stay crawlable, or the noindex on it is never read.
  expect(body).not.toContain("Disallow: /login");
});

test("the sitemap lists both languages of both public pages", async ({ request }) => {
  const response = await request.get("/sitemap.xml");

  expect(response.status()).toBe(200);
  const xml = await response.text();
  for (const path of ["/", "/tr", "/privacy", "/tr/privacy"]) {
    expect(xml).toContain(`<loc>https://mustafagokselgokmen.com.tr${path}</loc>`);
  }
  expect(xml).toContain('hreflang="tr"');
});

test("the sign-in page asks not to be indexed", async ({ page }) => {
  await page.goto("/login");

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});
