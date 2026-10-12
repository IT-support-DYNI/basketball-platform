import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, created, ForbiddenError } from "@/lib/api";
import { requireAuth, requireAbility } from "@/lib/authorization";
import { getTenantContext } from "@/lib/tenant";
import { createPlaySchema, PLAY_TYPES } from "@/lib/contracts/playbook";
import { isStaff, listPlayLibrary, listPlaybook, playbookTeamIds } from "@/lib/plays";
import { prisma } from "@/lib/prisma";

const isType = (v: string | null): v is (typeof PLAY_TYPES)[number] =>
  !!v && (PLAY_TYPES as readonly string[]).includes(v);

/**
 * GET /api/v1/plays: coaches and admins get the club's play library
 * (`?type=&q=&archived=1`); players and guardians get their team playbook,
 * i.e. only plays assigned to their (or their children's) teams.
 */
export const GET = route(async (req: NextRequest, { requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));

  if (isStaff(session)) {
    requireAbility(session, "read", "Play");
    const { clubId } = await getTenantContext(session);
    const sp = req.nextUrl.searchParams;
    const type = sp.get("type");
    const plays = await listPlayLibrary(clubId, {
      type: isType(type) ? type : null,
      q: sp.get("q"),
      includeArchived: sp.get("archived") === "1",
    });
    return ok(plays, { requestId });
  }

  if (session.user.role === "PLAYER" || session.user.role === "GUARDIAN") {
    return ok(await listPlaybook(await playbookTeamIds(session)), { requestId });
  }

  throw new ForbiddenError();
});

/** POST /api/v1/plays: add a play to the club library. */
export const POST = route(async (req: NextRequest, { requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  requireAbility(session, "create", "Play");
  const { clubId } = await getTenantContext(session);
  const body = createPlaySchema.parse(await req.json());

  const play = await prisma.play.create({
    data: {
      clubId,
      createdByUserId: Number(session.user.id),
      name: body.name,
      type: body.type,
      notes: body.notes,
      courtDiagram: (body.courtDiagram ?? undefined) as never,
    },
    select: { id: true },
  });
  return created(play, requestId);
});
