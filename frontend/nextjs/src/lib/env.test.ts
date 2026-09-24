import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadEnv() {
  return (await import("./env")).env();
}

describe("env", () => {
  it("reads the backend address", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:8080");

    await expect(loadEnv()).resolves.toEqual({ API_BASE_URL: "http://localhost:8080" });
  });

  it("fails with the name of a missing variable", async () => {
    vi.stubEnv("API_BASE_URL", undefined);

    await expect(loadEnv()).rejects.toThrowError(/API_BASE_URL/);
  });

  it("fails when the address isn't a URL", async () => {
    vi.stubEnv("API_BASE_URL", "localhost:8080");

    await expect(loadEnv()).rejects.toThrowError(/API_BASE_URL/);
  });
});
