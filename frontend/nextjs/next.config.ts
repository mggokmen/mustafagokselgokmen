import type { NextConfig } from "next";

/**
 * The policy the browser is given. It lives here, with the code it protects, rather than in a
 * reverse proxy this repository cannot see: a proxy once served this app a policy written for a
 * static placeholder, and every stylesheet and script was blocked for every visitor
 * ([ADR-012](../../docs/decisions/012-security-headers.md)).
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  // Next.js inlines the bootstrap that hands a prerendered page to React. A nonce would be
  // stricter, but a nonce is per request, and the public pages are prerendered (ADR-012).
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  // Server Actions post to the page's own route, and nothing here posts anywhere else.
  "form-action 'self'",
  "base-uri 'none'",
  "object-src 'none'",
  "frame-ancestors 'none'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // The image ships a server and the files it traced, not the whole node_modules tree
  // (docs/devops.md#images).
  output: "standalone",
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
