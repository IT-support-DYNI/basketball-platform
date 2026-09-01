import { NextRequest, NextResponse } from "next/server";

import { eventsForFeedToken } from "@/lib/calendar-feed";
import { buildCalendar } from "@/lib/ics";

// Token-gated DB read — must run per request, never at build time.
export const dynamic = "force-dynamic";

/**
 * Personal calendar subscription feed. Public (calendar apps don't send
 * cookies) but gated by an unguessable per-user token — reveal / rotate it via
 * GET|POST /api/v1/calendar/token.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return new NextResponse("Missing token", { status: 400 });

  const result = await eventsForFeedToken(token);
  if (!result) return new NextResponse("Unknown token", { status: 404 });

  const body = buildCalendar(result.events, result.name);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="dyni-blazers.ics"',
      "Cache-Control": "private, max-age=900",
    },
  });
}
