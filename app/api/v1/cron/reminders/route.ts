import { NextRequest, NextResponse } from "next/server";

import { runRsvpReminders } from "@/lib/reminders";
import { runNotificationDigest } from "@/lib/digest";

/**
 * The daily cron job (Vercel Cron — see vercel.json). Runs the RSVP nudges and
 * the unread-notification digest. Vercel sends `Authorization: Bearer
 * $CRON_SECRET` automatically when that env var is set; if no secret is
 * configured (local dev) it runs unguarded.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [rsvp, digest] = await Promise.all([runRsvpReminders(), runNotificationDigest()]);
  return NextResponse.json({ ok: true, rsvp, digest });
}
