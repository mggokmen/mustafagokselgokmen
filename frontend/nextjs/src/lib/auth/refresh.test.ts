import { describe, expect, it, vi } from "vitest";

function tokens(refreshToken: string): Response {
  return new Response(
    JSON.stringify({
      accessToken: "an-access-token",
      refreshToken,
      tokenType: "Bearer",
      expiresIn: 900,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}

function refused(): Response {
  return new Response(
    JSON.stringify({
      type: "about:blank",
      title: "Authentication required",
      status: 401,
      code: "UNAUTHENTICATED",
    }),
    { status: 401, headers: { "Content-Type": "application/problem+json" } },
  );
}

describe("refreshSession", () => {
  it("exchanges once for callers that arrive together with the same token", async () => {
    let exchanges = 0;
    vi.stubGlobal("fetch", () => {
      exchanges += 1;
      return Promise.resolve(tokens("a-new-refresh-token"));
    });
    const { refreshSession } = await import("./refresh");

    const [first, second] = await Promise.all([
      refreshSession("the-old-token"),
      refreshSession("the-old-token"),
    ]);

    // Reusing a refresh token revokes the family (ADR-003), so twice would end the session.
    expect(exchanges).toBe(1);
    expect(first).toEqual(second);
  });

  it("still answers a request that started before the new cookie arrived", async () => {
    let exchanges = 0;
    vi.stubGlobal("fetch", () => {
      exchanges += 1;
      return Promise.resolve(tokens("a-new-refresh-token"));
    });
    const { refreshSession } = await import("./refresh");

    await refreshSession("the-old-token");
    await refreshSession("the-old-token");

    expect(exchanges).toBe(1);
  });

  it("lets the next request try again after a refusal", async () => {
    let exchanges = 0;
    vi.stubGlobal("fetch", () => {
      exchanges += 1;
      return Promise.resolve(exchanges === 1 ? refused() : tokens("a-new-refresh-token"));
    });
    const { refreshSession } = await import("./refresh");

    await expect(refreshSession("the-old-token")).rejects.toThrowError();
    await expect(refreshSession("the-old-token")).resolves.toHaveLength(2);

    expect(exchanges).toBe(2);
  });

  it("does not mix up two browsers", async () => {
    const seen: string[] = [];
    vi.stubGlobal("fetch", async (request: Request) => {
      const body = (await request.json()) as { refreshToken: string };
      seen.push(body.refreshToken);
      return tokens(`new-for-${body.refreshToken}`);
    });
    const { refreshSession } = await import("./refresh");

    const [one, two] = await Promise.all([refreshSession("first"), refreshSession("second")]);

    expect(seen.sort()).toEqual(["first", "second"]);
    expect(one[1]?.value).toBe("new-for-first");
    expect(two[1]?.value).toBe("new-for-second");
  });
});
