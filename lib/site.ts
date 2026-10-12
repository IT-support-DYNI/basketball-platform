/**
 * The public site's canonical address, for search engines (robots.txt,
 * sitemap, structured data). Fixed to the real domain on purpose: a Vercel
 * preview URL must never advertise itself as the club's site.
 */
export const SITE_URL = "https://dyniblazers.co.uk";

/** Only the production deployment should be indexed; previews and local runs
 *  tell crawlers to stay out. */
export const isIndexable = () => process.env.VERCEL_ENV === "production";

/** Public pages worth listing in the sitemap (player and coach profiles are
 *  opt-in and marked noindex, so they're left out). */
export const PUBLIC_PATHS = [
  "/club",
  "/club/about",
  "/club/teams",
  "/club/roster",
  "/club/coaches",
  "/club/moments",
  "/club/news",
  "/club/safeguarding",
  "/club/privacy",
  "/club/terms",
] as const;
