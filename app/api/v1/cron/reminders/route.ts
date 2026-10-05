import { NextRequest, NextResponse } from "next/server";

import { runRsvpReminders } from "@/lib/reminders";
import { runNotificationDigest } from "@/lib/digest";

// Never prerender: the handler skips the header check when no CRON_SECRET is
// set (as at build time), so without this Next would run it during the static
// export and hit the database.
export const dynamic = "force-dynamic";

/**
 * The daily cron job (Vercel Cron — see vercel.json). Runs the RSVP nudges and
 * the unread-notification digest. Vercel sends `Authorization: Bearer
 * $CRON_SECRET` automatically when that env var is set. Without a secret it
 * runs unguarded in local dev only; a production deploy that's missing the
 * env var refuses rather than letting anyone trigger mass notifications.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  // Checked separately so a missing secret can never compare equal to the
  // literal header "Bearer undefined".
  const unauthorized = secret
    ? req.headers.get("authorization") !== `Bearer ${secret}`
    : process.env.NODE_ENV === "production";
  if (unauthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [rsvp, digest] = await Promise.all([runRsvpReminders(), runNotificationDigest()]);
  return NextResponse.json({ ok: true, rsvp, digest });
}
