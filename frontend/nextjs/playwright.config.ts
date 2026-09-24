import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests for the web app. They need the backend stack from `e2e/run-tests.sh`; Playwright
 * starts the app itself, built the way it is deployed rather than in dev mode.
 *
 * Three instances run, on three ports. They are the same build with the same configuration; only
 * the address differs, and the mock identity provider answers each one with a different account
 * (`e2e/mock-oidc.json`). That is how these tests get a `USER`, an `ADMIN` and a second user
 * without the app knowing anything about tests.
 */
const USER_PORT = 3100;
const ADMIN_PORT = 3101;
// A third account, used only to create messages that the admin did not send. It has a rate-limit
// bucket of its own, so the test that deliberately exhausts one cannot get in its way.
const AUTHOR_PORT = 3102;
const userUrl = `http://localhost:${USER_PORT}`;
const adminUrl = `http://localhost:${ADMIN_PORT}`;

function webServer(port: number) {
  return {
    command: `npm run start -- --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe" as const,
    stderr: "pipe" as const,
    env: {
      API_BASE_URL: "http://localhost:18080",
      APP_URL: `http://localhost:${port}`,
      GOOGLE_CLIENT_ID: "web-e2e",
      // The mock provider requires client authentication but doesn't check the password.
      GOOGLE_CLIENT_SECRET: "web-e2e-secret",
      GOOGLE_ISSUER: "http://localhost:18090/google",
    },
  };
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: { trace: "retain-on-failure" },
  projects: [
    {
      name: "user",
      testIgnore: /admin\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: userUrl },
    },
    {
      name: "admin",
      testMatch: /admin\.spec\.ts/,
      use: { ...devices["Desktop Chrome"], baseURL: adminUrl },
    },
  ],
  webServer: [webServer(USER_PORT), webServer(ADMIN_PORT), webServer(AUTHOR_PORT)],
});
