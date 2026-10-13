import { ok, route } from "@/lib/api";
import { getPublicScoreboard } from "@/lib/live-scores";

// A per-request DB read: never prerender it at build time.
export const dynamic = "force-dynamic";

/**
 * GET /api/v1/public/live-scores: the homepage scoreboard, unauthenticated.
 * Public-visibility matches only (lib/live-scores.ts). Cached at the edge for
 * a few seconds so a busy match day doesn't turn every visitor's poll into a
 * database query.
 */
export const GET = route(async (_req, { requestId }) =>
  ok(await getPublicScoreboard(), {
    requestId,
    headers: { "Cache-Control": "public, s-maxage=5, stale-while-revalidate=10" },
  }),
);
