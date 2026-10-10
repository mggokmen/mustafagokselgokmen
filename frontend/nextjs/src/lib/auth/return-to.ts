/**
 * Where to send the browser after sign-in. Only a path inside this app is allowed: an attacker who
 * chooses the destination turns sign-in into an open redirect
 * (docs/security.md#web-sign-in-flow).
 */
export function safeReturnTo(value: string | null | undefined, fallback = "/"): string {
  if (typeof value !== "string" || value.length === 0) {
    return fallback;
  }
  // A path, not a URL: no scheme, no authority, and no protocol-relative "//host" form. Backslashes
  // are rejected too, because browsers have treated "/\host" as an authority.
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }
  if (value.startsWith("/auth/")) {
    // Returning into the sign-in routes would start the flow again.
    return fallback;
  }
  return value;
}
