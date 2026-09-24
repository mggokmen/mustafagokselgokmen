import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "./api-error";
import { createApiClient, unwrap } from "./api-client";

const user = {
  id: "0199a1d1-0000-7000-8000-000000000001",
  email: "user@example.com",
  name: "Contract User",
  role: "USER",
} as const;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": status >= 400 ? "application/problem+json" : "application/json" },
  });
}

let calls: Request[];

beforeEach(() => {
  calls = [];
  vi.stubGlobal("fetch", (input: Request) => {
    calls.push(input);
    return Promise.resolve(jsonResponse(user));
  });
});

describe("createApiClient", () => {
  it("calls the backend configured in the environment", async () => {
    await createApiClient().GET("/api/v1/auth/me");

    expect(calls[0]?.url).toBe("http://api.test/api/v1/auth/me");
  });

  it("sends the access token as a Bearer header", async () => {
    await createApiClient({ accessToken: "an-access-token" }).GET("/api/v1/auth/me");

    expect(calls[0]?.headers.get("Authorization")).toBe("Bearer an-access-token");
  });

  it("sends no Authorization header without a token", async () => {
    await createApiClient().GET("/api/v1/auth/me");

    expect(calls[0]?.headers.get("Authorization")).toBeNull();
  });
});

describe("unwrap", () => {
  it("returns the body of a successful response", async () => {
    const result = await createApiClient().GET("/api/v1/auth/me");

    expect(unwrap(result)).toEqual(user);
  });

  it("throws the contract's error code when the request fails", async () => {
    vi.stubGlobal("fetch", () =>
      Promise.resolve(
        jsonResponse(
          {
            type: "about:blank",
            title: "Authentication required",
            status: 401,
            code: "UNAUTHENTICATED",
            detail: "Missing, invalid or expired credentials.",
          },
          401,
        ),
      ),
    );

    const result = await createApiClient().GET("/api/v1/auth/me");

    expect(() => unwrap(result)).toThrowError(ApiError);
    try {
      unwrap(result);
    } catch (error) {
      expect((error as ApiError).code).toBe("UNAUTHENTICATED");
      expect((error as ApiError).status).toBe(401);
    }
  });
});
