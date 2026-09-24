import { describe, expect, it, vi } from "vitest";

async function loadEnv() {
  return (await import("./env")).env();
}

describe("env", () => {
  it("reads the backend address", async () => {
    vi.stubEnv("API_BASE_URL", "http://localhost:8080");

    await expect(loadEnv()).resolves.toMatchObject({ API_BASE_URL: "http://localhost:8080" });
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
