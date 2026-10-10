import { expect, test, type Page } from "@playwright/test";

import { signIn } from "./support";

/**
 * Sending a message goes through a Server Action, which checks the session, validates the input
 * and calls the API. These tests run against the real API, so the rules they show are the
 * contract's, not this app's idea of them.
 *
 * The API allows five messages per user per hour, and every test here signs in as the same user.
 * The test that reaches that limit is therefore the last one in this file.
 */
async function send(page: Page, subject: string, message: string): Promise<void> {
  const subjectField = page.getByLabel("Subject");
  await subjectField.fill(subject);
  await page.getByLabel("Message").fill(message);
  await page.getByRole("button", { name: "Send message" }).click();
  // React clears the form once the action has returned. Waiting for that is what makes a second
  // submission safe: typing into the form mid-flight would be wiped, and an empty message sent.
  await expect(subjectField).toHaveValue("", { timeout: 15_000 });
}

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test("a sent message appears in the visitor's own list", async ({ page }) => {
  await signIn(page, "/contact");
  const subject = `Kettle is broken ${Date.now()}`;

  await send(page, subject, "It boils, but it never stops.");

  await expect(page.getByText("Your message has been sent.")).toBeVisible();
  const entry = page.getByRole("listitem").filter({ hasText: subject });
  await expect(entry).toBeVisible();
  await expect(entry.getByText("New")).toBeVisible();
  await expect(entry.getByText("It boils, but it never stops.")).toBeVisible();
});

test("an empty form is refused, field by field", async ({ page }) => {
  await signIn(page, "/contact");

  await page.getByRole("button", { name: "Send message" }).click();

  await expect(page.getByText("Enter a subject.")).toBeVisible();
  await expect(page.getByText("Enter a message.")).toBeVisible();
  await expect(page.getByText("Your message has been sent.")).toBeHidden();
});

test("a subject of only spaces is refused, as the contract requires", async ({ page }) => {
  await signIn(page, "/contact");

  await send(page, "   ", "A message with a blank subject.");

  await expect(page.getByText("Enter a subject.")).toBeVisible();
});

test("message text is shown as text, never as markup", async ({ page }) => {
  await signIn(page, "/contact");
  const subject = `Markup ${Date.now()}`;

  await send(page, subject, "<script>alert('x')</script> <b>not bold</b>");

  const entry = page.getByRole("listitem").filter({ hasText: subject });
  await expect(entry).toBeVisible();
  await expect(entry.getByText("<b>not bold</b>", { exact: false })).toBeVisible();
  expect(await entry.locator("b").count()).toBe(0);
  expect(await entry.locator("script").count()).toBe(0);
});

test("the hourly limit tells the visitor when to try again", async ({ page }) => {
  await signIn(page, "/contact");

  const limitReached = page.getByText("You have sent several messages already.");

  // The limit is five an hour; earlier tests have used some of them. Keep sending until the API
  // refuses, which it must do well before this loop runs out.
  let limited = false;
  for (let attempt = 0; attempt < 8 && !limited; attempt++) {
    await send(page, `Limit ${attempt} ${Date.now()}`, "Another message.");
    limited = await limitReached.isVisible();
  }

  expect(limited, "the API should have refused one of these").toBe(true);
  await expect(page.getByText(/Please try again in \d+ minutes?\./)).toBeVisible();
});
