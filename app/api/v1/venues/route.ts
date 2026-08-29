import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, created } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/authorization";
import { createVenueSchema } from "@/lib/contracts/event";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

/** GET — the club's venues (any signed-in member can read; used by the
 *  event-create form's venue picker). */
export const GET = route(async () => {
  const session = requireAuth(await getServerSession(authOptions));
  const ctx = await getTenantContext(session);
  const venues = await prisma.venue.findMany({
    where: { OR: [{ clubId: ctx.clubId }, { clubId: null }] },
    orderBy: { name: "asc" },
  });
  return ok(venues);
});

/** POST — create a venue (admin only). */
export const POST = route(async (req: NextRequest) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const ctx = await getTenantContext(session);
  const body = createVenueSchema.parse(await req.json());

  const venue = await prisma.venue.create({
    data: {
      clubId: ctx.clubId,
      name: body.name,
      address: body.address,
      mapLat: body.mapLat ?? null,
      mapLng: body.mapLng ?? null,
      notes: body.notes,
      checkInPin: body.checkInPin ?? null,
    },
  });
  return created(venue);
});
