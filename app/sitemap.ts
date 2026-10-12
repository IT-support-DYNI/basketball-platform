import type { MetadataRoute } from "next";

import { PUBLIC_PATHS, SITE_URL } from "@/lib/site";

/** /sitemap.xml: the public club pages, so search engines find them all. */
export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "/club" || path === "/club/news" ? "weekly" : "monthly",
    priority: path === "/club" ? 1 : 0.6,
  }));
}
