import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, BadRequestError } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { acceptConsentSchema } from "@/lib/contracts/consent";
import { consentStatusFor, resolveConsentSubject } from "@/lib/consent";
import { prisma } from "@/lib/prisma";

/** POST /api/v1/consent/accept — record acceptance of one or more current
 *  versions for the caller (or their child). Acceptance is append-only. */
export const POST = route(async (req: NextRequest) => {
  const session = requireAuth(await getServerSession(authOptions));
  const body = acceptConsentSchema.parse(await req.json());
  const { playerProfileId, byGuardian } = await resolveConsentSubject(session, body.playerProfileId);
  const acceptedByUserId = Number(session.user.id);

  // Only current versions of active documents may be accepted — never an
  // arbitrary or superseded id.
  const items = await consentStatusFor(playerProfileId);
  const currentIds = new Set(items.map((i) => i.version.id));
  if (body.versionIds.some((id) => !currentIds.has(id))) {
    throw new BadRequestError("One or more documents are out of date — reload and try again.");
  }

  await prisma.$transaction(
    body.versionIds.map((documentVersionId) =>
      prisma.consentRecord.upsert({
        where: { documentVersionId_playerProfileId: { documentVersionId, playerProfileId } },
        create: { documentVersionId, playerProfileId, acceptedByUserId, byGuardian },
        update: {},
      }),
    ),
  );

  const after = await consentStatusFor(playerProfileId);
  return ok({ outstanding: after.filter((i) => i.required && i.acceptedAt == null).length });
});
