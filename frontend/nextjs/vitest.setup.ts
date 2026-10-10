import { afterEach, beforeEach, vi } from "vitest";

/**
 * The server configuration the app validates on first use. A test that cares about one value
 * overrides it; the rest shouldn't have to know the others exist.
 */
beforeEach(() => {
  vi.stubEnv("API_BASE_URL", "http://api.test");
  vi.stubEnv("APP_URL", "http://localhost:3000");
  vi.stubEnv("GOOGLE_CLIENT_ID", "web-test-client");
  vi.stubEnv("GOOGLE_CLIENT_SECRET", "web-test-secret");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  // The configuration is read once per module instance, so each test starts from a clean one.
  vi.resetModules();
});
