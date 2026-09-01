import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { getOrCreateCalendarToken, rotateCalendarToken } from "@/lib/calendar-feed";
import { baseUrl } from "@/lib/base-url";

function feedUrl(token: string) {
  return `${baseUrl()}/api/v1/public/calendar.ics?token=${token}`;
}

/** GET — the caller's personal subscription URL (minting a token on first use). */
export const GET = route(async () => {
  const session = requireAuth(await getServerSession(authOptions));
  const token = await getOrCreateCalendarToken(Number(session.user.id));
  return ok({ url: feedUrl(token) });
});

/** POST — rotate the token, invalidating the old URL. */
export const POST = route(async () => {
  const session = requireAuth(await getServerSession(authOptions));
  const token = await rotateCalendarToken(Number(session.user.id));
  return ok({ url: feedUrl(token) });
});
