import { NextRequest, NextResponse } from "next/server";

import { runRsvpReminders } from "@/lib/reminders";

/**
 * Daily RSVP-reminder job. Invoked by Vercel Cron (see vercel.json), which sends
 * `Authorization: Bearer $CRON_SECRET` automatically when that env var is set.
 * Returns 401 if the secret is configured and doesn't match; if no secret is
 * configured (local dev) it runs unguarded.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runRsvpReminders();
  return NextResponse.json({ ok: true, ...result });
}
