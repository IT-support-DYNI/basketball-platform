import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { consentStatusFor, resolveConsentSubject } from "@/lib/consent";

/** GET /api/v1/consent[?playerProfileId=] — the consent checklist for the
 *  caller (or their child). */
export const GET = route(async (req: NextRequest) => {
  const session = requireAuth(await getServerSession(authOptions));
  const pid = req.nextUrl.searchParams.get("playerProfileId");
  const { playerProfileId } = await resolveConsentSubject(session, pid ? Number(pid) : undefined);

  const items = await consentStatusFor(playerProfileId);
  return ok({
    playerProfileId,
    items,
    outstanding: items.filter((i) => i.required && i.acceptedAt == null).length,
  });
});
