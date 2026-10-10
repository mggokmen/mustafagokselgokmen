import "server-only";

import { z } from "zod";

/**
 * Server-side configuration. Nothing here has the NEXT_PUBLIC_ prefix, so none of it can reach the
 * browser (docs/frontend/nextjs.md).
 */
const schema = z.object({
  /**
   * Where the backend listens, without a trailing slash. The scheme is required: `localhost:8080`
   * parses as a URL whose protocol is `localhost:`, which would fail later and further away.
   */
  API_BASE_URL: z.url({ protocol: /^https?$/ }),

  /** This app's own address. The OAuth redirect URI is built from it. */
  APP_URL: z.url({ protocol: /^https?$/ }),

  /** The web OAuth client from Google Cloud. The secret makes this a confidential client. */
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  /**
   * Overridden only so tests can run against a mock provider. Anything but Google is therefore
   * allowed to be plain http, which {@link ./auth/oidc.ts} enables explicitly.
   */
  GOOGLE_ISSUER: z.url({ protocol: /^https?$/ }).default("https://accounts.google.com"),
});

export type Env = z.infer<typeof schema>;

let cached: Env | undefined;

/**
 * Reads and validates the environment on first use, so a missing or malformed value fails with a
 * clear message instead of an undefined URL somewhere in a request.
 */
export function env(): Env {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const problems = parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      throw new Error(`Invalid environment configuration: ${problems}`);
    }
    cached = parsed.data;
  }
  return cached;
}

/** True when cookies must carry the `Secure` attribute, i.e. everywhere but local http. */
export function isSecureDeployment(): boolean {
  return new URL(env().APP_URL).protocol === "https:";
}
