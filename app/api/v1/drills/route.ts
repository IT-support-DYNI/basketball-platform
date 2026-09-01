import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, created } from "@/lib/api";
import { requireAuth, requireAbility } from "@/lib/authorization";
import { getTenantContext } from "@/lib/tenant";
import { createDrillSchema, DRILL_CATEGORIES, DRILL_DIFFICULTIES } from "@/lib/contracts/training";
import { listDrills } from "@/lib/drills";
import { prisma } from "@/lib/prisma";

const isCategory = (v: string | null): v is (typeof DRILL_CATEGORIES)[number] =>
  !!v && (DRILL_CATEGORIES as readonly string[]).includes(v);
const isDifficulty = (v: string | null): v is (typeof DRILL_DIFFICULTIES)[number] =>
  !!v && (DRILL_DIFFICULTIES as readonly string[]).includes(v);

/** GET /api/v1/drills — the club's drill library (+ shared drills).
 *  `?category=&difficulty=&q=&tag=&archived=1` */
export const GET = route(async (req: NextRequest, { requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  requireAbility(session, "read", "Drill");
  const { clubId } = await getTenantContext(session);

  const sp = req.nextUrl.searchParams;
  const cat = sp.get("category");
  const diff = sp.get("difficulty");
  const items = await listDrills(clubId, {
    category: isCategory(cat) ? cat : null,
    difficulty: isDifficulty(diff) ? diff : null,
    q: sp.get("q"),
    tag: sp.get("tag"),
    includeArchived: sp.get("archived") === "1",
  });
  return ok(items, { requestId });
});

/** POST /api/v1/drills — add a drill to the club library. */
export const POST = route(async (req: NextRequest, { requestId }) => {
  const session = requireAuth(await getServerSession(authOptions));
  requireAbility(session, "create", "Drill");
  const { clubId } = await getTenantContext(session);
  const body = createDrillSchema.parse(await req.json());

  const drill = await prisma.drill.create({
    data: {
      clubId,
      createdByUserId: Number(session.user.id),
      name: body.name,
      category: body.category,
      difficulty: body.difficulty,
      summary: body.summary,
      instructions: body.instructions,
      coachingPoints: body.coachingPoints ?? [],
      commonMistakes: body.commonMistakes ?? [],
      durationMinutes: body.durationMinutes,
      minPlayers: body.minPlayers,
      maxPlayers: body.maxPlayers,
      equipment: body.equipment ?? [],
      courtDiagram: body.courtDiagram as never,
      tags: body.tags ?? [],
    },
  });
  return created(drill, requestId);
});
