import type { MetadataRoute } from "next";

import { SITE_URL } from "@/features/landing/site-links";

/**
 * The public pages are the only ones worth crawling. Everything behind sign-in answers a crawler
 * with a redirect to /login, so there is nothing there to read.
 *
 * `/login` is deliberately **not** disallowed. It is the one private-ish page that renders, and it
 * asks not to be indexed in its own metadata — which a crawler can only obey if it is allowed to
 * fetch the page and see it. Disallowing it would hide the `noindex` and leave the address free to
 * appear in a result anyway.
 *
 * None of this is access control. Robots are asked, not stopped; the proxy is what refuses.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account", "/admin", "/contact", "/auth/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
