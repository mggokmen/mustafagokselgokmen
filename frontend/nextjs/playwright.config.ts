import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests for the sign-in flow. They need the backend stack from `e2e/run-tests.sh`;
 * Playwright starts the web app itself, built the way it is deployed rather than in dev mode.
 */
const PORT = 3100;
const APP_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["github"], ["list"]] : [["list"]],
  use: {
    baseURL: APP_URL,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: APP_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      API_BASE_URL: "http://localhost:18080",
      APP_URL,
      GOOGLE_CLIENT_ID: "web-e2e",
      // The mock provider requires client authentication but doesn't check the password.
      GOOGLE_CLIENT_SECRET: "web-e2e-secret",
      GOOGLE_ISSUER: "http://localhost:18090/google",
    },
  },
});
