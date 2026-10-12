import { describe, expect, it } from "vitest";

import { counterpartPath, localeOf, pathIn } from "./locale";

describe("localeOf", () => {
  it("reads Turkish from the prefix", () => {
    expect(localeOf("/tr")).toBe("tr");
    expect(localeOf("/tr/privacy")).toBe("tr");
  });

  it("treats everything else as English, including a path that merely starts with those letters", () => {
    expect(localeOf("/")).toBe("en");
    expect(localeOf("/privacy")).toBe("en");
    expect(localeOf("/treasury")).toBe("en");
  });
});

describe("counterpartPath", () => {
  it("crosses from English to Turkish", () => {
    expect(counterpartPath("/")).toBe("/tr");
    expect(counterpartPath("/privacy")).toBe("/tr/privacy");
  });

  it("crosses back", () => {
    expect(counterpartPath("/tr")).toBe("/");
    expect(counterpartPath("/tr/privacy")).toBe("/privacy");
  });

  it("returns to where it started when crossed twice", () => {
    for (const path of ["/", "/privacy", "/tr", "/tr/privacy"]) {
      expect(counterpartPath(counterpartPath(path))).toBe(path);
    }
  });

  it("ignores a trailing slash rather than producing a path with two", () => {
    expect(counterpartPath("/privacy/")).toBe("/tr/privacy");
    expect(counterpartPath("/tr/")).toBe("/");
  });
});

describe("pathIn", () => {
  it("leaves English paths alone and prefixes Turkish ones", () => {
    expect(pathIn("en", "/privacy")).toBe("/privacy");
    expect(pathIn("tr", "/privacy")).toBe("/tr/privacy");
    expect(pathIn("tr", "/")).toBe("/tr");
  });
});
