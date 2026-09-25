import { expect, test, type Browser, type Page } from "@playwright/test";

import { signIn } from "./support";

/**
 * This project runs against the instance on port 3101, which the mock provider answers with
 * admin@example.com — an address the API's allowlist grants `ADMIN` (`e2e/compose.e2e.yml`). The
 * app knows nothing about that: the role comes from the backend, in the token it issued.
 */
const USER_APP = "http://localhost:3100";
/** author@example.com: a plain user whose only job is to have written something. */
const AUTHOR_APP = "http://localhost:3102";

/** Sends a message as a user who is not this admin, in a browser of its own. */
async function messageFromAnotherUser(browser: Browser, subject: string): Promise<void> {
  const context = await browser.newContext({ baseURL: AUTHOR_APP });
  const page = await context.newPage();
  await signIn(page, "/contact");
  await page.getByLabel("Subject").fill(subject);
  await page.getByLabel("Message").fill("Sent by someone who is not an admin.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Your message has been sent.")).toBeVisible();
  await context.close();
}

function entry(page: Page, subject: string) {
  return page.getByRole("listitem").filter({ hasText: subject });
}

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

test("an admin sees messages they did not send", async ({ page, browser }) => {
  const subject = `From a user ${Date.now()}`;
  await messageFromAnotherUser(browser, subject);

  await signIn(page, "/admin/messages");

  const message = entry(page, subject);
  await expect(message).toBeVisible();
  await expect(message.getByText("author@example.com")).toBeVisible();
  await expect(message.getByText("New")).toBeVisible();
});

test("an admin moves a message through the workflow", async ({ page, browser }) => {
  const subject = `Workflow ${Date.now()}`;
  await messageFromAnotherUser(browser, subject);
  await signIn(page, "/admin/messages");

  const message = entry(page, subject);
  await message.getByRole("button", { name: "Start" }).click();
  await expect(message.getByText("In progress")).toBeVisible();

  await message.getByRole("button", { name: "Resolve" }).click();
  await expect(message.getByText("Resolved")).toBeVisible();

  // A resolved message can be reopened, and only that.
  await expect(message.getByRole("button", { name: "Reopen" })).toBeVisible();
  await expect(message.getByRole("button", { name: "Resolve" })).toBeHidden();
});

test("only the moves the workflow allows are offered", async ({ page, browser }) => {
  const subject = `Offered moves ${Date.now()}`;
  await messageFromAnotherUser(browser, subject);
  await signIn(page, "/admin/messages");

  const message = entry(page, subject);
  await expect(message.getByRole("button", { name: "Start" })).toBeVisible();
  await expect(message.getByRole("button", { name: "Resolve" })).toBeVisible();
  await expect(message.getByRole("button", { name: "Mark as new" })).toBeHidden();
});

test("a filter narrows the list and can be linked to", async ({ page, browser }) => {
  const subject = `Filtered ${Date.now()}`;
  await messageFromAnotherUser(browser, subject);
  await signIn(page, "/admin/messages");

  await entry(page, subject).getByRole("button", { name: "Start" }).click();
  await expect(entry(page, subject).getByText("In progress")).toBeVisible();

  await page.getByRole("link", { name: "New", exact: true }).click();

  await expect(page).toHaveURL("/admin/messages?status=NEW");
  await expect(entry(page, subject)).toBeHidden();

  // The filter is in the URL, so it survives a reload.
  await page.reload();
  await expect(entry(page, subject)).toBeHidden();
  await page.goto("/admin/messages?status=IN_PROGRESS");
  await expect(entry(page, subject)).toBeVisible();
});

test("a change made against a stale version is refused, and the list shown is current", async ({
  page,
  browser,
}) => {
  const subject = `Concurrent ${Date.now()}`;
  await messageFromAnotherUser(browser, subject);
  await signIn(page, "/admin/messages");
  await expect(entry(page, subject)).toBeVisible();

  // A second admin, in another browser, moves the same message first. The first page still shows
  // the version it rendered.
  const other = await browser.newContext();
  const otherPage = await other.newPage();
  await signIn(otherPage, "/admin/messages");
  await entry(otherPage, subject).getByRole("button", { name: "Start" }).click();
  await expect(entry(otherPage, subject).getByText("In progress")).toBeVisible();
  await other.close();

  await entry(page, subject).getByRole("button", { name: "Resolve" }).click();

  await expect(page.getByText("This message changed while you were looking at it")).toBeVisible();
  // Nothing was overwritten, and what is on screen now is what the backend holds.
  await expect(entry(page, subject).getByText("In progress")).toBeVisible();
});

test("the admin area is not there for anyone else", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: USER_APP });
  const page = await context.newPage();
  await signIn(page, "/contact");

  await page.goto(`${USER_APP}/admin/messages`);

  // Not found rather than forbidden: a page they may not use is not one whose existence they need
  // confirmed. The backend refuses them regardless.
  await expect(page.getByText("This page could not be found.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "All messages" })).toBeHidden();
  await context.close();
});
