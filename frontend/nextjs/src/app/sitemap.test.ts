import { describe, expect, it } from "vitest";

import sitemap from "./sitemap";

const entries = sitemap();

describe("sitemap", () => {
  it("lists every public page once per language", () => {
    expect(entries.map((entry) => entry.url)).toEqual([
      "https://mustafagokselgokmen.com.tr/",
      "https://mustafagokselgokmen.com.tr/tr",
      "https://mustafagokselgokmen.com.tr/privacy",
      "https://mustafagokselgokmen.com.tr/tr/privacy",
    ]);
  });

  it("gives every entry both languages, so either one leads to the other", () => {
    for (const entry of entries) {
      expect(Object.keys(entry.alternates?.languages ?? {})).toEqual(["en", "tr"]);
    }
  });

  it("uses absolute URLs, because a sitemap is read from somewhere else", () => {
    const urls = entries.flatMap((entry) => [
      entry.url,
      ...Object.values(entry.alternates?.languages ?? {}),
    ]);
    for (const url of urls) {
      expect(url).toMatch(/^https:\/\/mustafagokselgokmen\.com\.tr(\/|$)/);
    }
  });
});
