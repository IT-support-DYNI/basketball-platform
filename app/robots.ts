import type { MetadataRoute } from "next";

import { SITE_URL, isIndexable } from "@/lib/site";

/** /robots.txt: crawl the public club site, stay out of the members' app and
 *  the API. Previews are closed to crawlers entirely (lib/site.ts).
 *  The sign-in screens stay crawlable on purpose: they carry a noindex tag
 *  (app/(auth)/layout.tsx), and Google can only drop a page it can read. */
export default function robots(): MetadataRoute.Robots {
  if (!isIndexable()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/club/"],
      disallow: ["/api/", "/admin/", "/coach/", "/player/", "/guardian/", "/settings/", "/messages", "/notifications"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
