import { describe, expect, it } from "vitest";

import { safeReturnTo } from "./return-to";

describe("safeReturnTo", () => {
  it("keeps a path inside the app", () => {
    expect(safeReturnTo("/account")).toBe("/account");
    expect(safeReturnTo("/contact?status=NEW")).toBe("/contact?status=NEW");
  });

  it.each([
    ["https://evil.example.com/steal", "an absolute URL"],
    ["//evil.example.com/steal", "a protocol-relative URL"],
    ["/\\evil.example.com", "a backslash authority"],
    ["http://localhost:3000/account", "even this app's own origin spelled in full"],
    ["javascript:alert(1)", "a script URL"],
    ["account", "a relative path"],
  ])("refuses %s (%s)", (value) => {
    expect(safeReturnTo(value)).toBe("/");
  });

  it("refuses to return into the sign-in routes", () => {
    expect(safeReturnTo("/auth/google")).toBe("/");
    expect(safeReturnTo("/auth/google/callback?code=x")).toBe("/");
  });

  it("falls back when there is no value", () => {
    expect(safeReturnTo(null)).toBe("/");
    expect(safeReturnTo(undefined)).toBe("/");
    expect(safeReturnTo("")).toBe("/");
  });

  it("uses the given fallback", () => {
    expect(safeReturnTo("https://evil.example.com", "/account")).toBe("/account");
  });
});
