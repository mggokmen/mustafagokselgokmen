import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearedSessionCookies,
  sessionCookies,
} from "./session";

const tokens = {
  accessToken: "an-access-token",
  refreshToken: "a-refresh-token",
  tokenType: "Bearer",
  expiresIn: 900,
};

beforeEach(() => {
  // The deployment these tests describe is served over https.
  vi.stubEnv("APP_URL", "https://example.com");
});

describe("sessionCookies", () => {
  it("keeps both tokens out of reach of browser JavaScript", () => {
    for (const cookie of sessionCookies(tokens)) {
      expect(cookie.options.httpOnly).toBe(true);
      expect(cookie.options.sameSite).toBe("lax");
      expect(cookie.options.path).toBe("/");
    }
  });

  it("expires the access cookie before its token does", () => {
    const [access] = sessionCookies(tokens);

    expect(access?.name).toBe(ACCESS_TOKEN_COOKIE);
    expect(access?.value).toBe("an-access-token");
    expect(access?.options.maxAge).toBeLessThan(tokens.expiresIn);
    expect(access?.options.maxAge).toBe(870);
  });

  it("never gives the access cookie a lifetime that would delete it", () => {
    const [access] = sessionCookies({ ...tokens, expiresIn: 5 });

    expect(access?.options.maxAge).toBeGreaterThan(0);
  });

  it("keeps the refresh cookie for the token's 30 days", () => {
    const [, refresh] = sessionCookies(tokens);

    expect(refresh?.name).toBe(REFRESH_TOKEN_COOKIE);
    expect(refresh?.options.maxAge).toBe(30 * 24 * 60 * 60);
  });

  it("marks cookies Secure when the app is served over https", () => {
    for (const cookie of sessionCookies(tokens)) {
      expect(cookie.options.secure).toBe(true);
    }
  });

  it("allows plain cookies for local http development", async () => {
    vi.stubEnv("APP_URL", "http://localhost:3000");
    vi.resetModules();
    const { sessionCookies: local } = await import("./session");

    expect(local(tokens).every((cookie) => cookie.options.secure)).toBe(false);
  });
});

describe("clearedSessionCookies", () => {
  it("expires both cookies", () => {
    const cleared = clearedSessionCookies();

    expect(cleared.map((cookie) => cookie.name)).toEqual([
      ACCESS_TOKEN_COOKIE,
      REFRESH_TOKEN_COOKIE,
    ]);
    for (const cookie of cleared) {
      expect(cookie.value).toBe("");
      expect(cookie.options.maxAge).toBe(0);
    }
  });
});
