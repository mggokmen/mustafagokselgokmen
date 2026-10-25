/** Everything the public pages link to, in one place, so a URL is written once. */

/**
 * Where this site lives. It is a constant rather than configuration because the metadata built
 * from it — the canonical URL and the social card — is baked into statically rendered pages at
 * build time, and the build is given no configuration at all (docs/devops.md#images).
 */
export const SITE_URL = "https://www.mustafagokselgokmen.com.tr";

export const GITHUB_URL = "https://github.com/mggokmen/mustafagokselgokmen";
export const LINKEDIN_URL = "https://www.linkedin.com/in/mustafa-goksel-gokmen/";
export const CONTACT_EMAIL = "iletisim@mustafagokselgokmen.com.tr";

/** The sections a visitor can jump to. The ids are on the sections themselves. */
export const SECTIONS = [
  { id: "architecture", label: "Architecture" },
  { id: "evidence", label: "Evidence" },
  { id: "decisions", label: "Decisions" },
  { id: "work", label: "Work" },
] as const;
