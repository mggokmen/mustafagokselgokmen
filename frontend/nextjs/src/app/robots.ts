import type { MetadataRoute } from "next";

import { SITE_URL } from "@/features/landing/site-links";

/**
 * The public pages are the only ones worth crawling. Everything behind sign-in answers a crawler
 * with a redirect to /login, so saying so here saves the round trip and keeps those addresses out
 * of a search result where they would only ever show a sign-in page.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/account", "/admin", "/contact", "/login", "/auth/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
