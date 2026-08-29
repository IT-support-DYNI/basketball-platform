import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, noContent } from "@/lib/api";
import { ConflictError, NotFoundError } from "@/lib/api/errors";
import { requireRole } from "@/lib/authorization";
import { assertSameClub, getTenantContext } from "@/lib/tenant";
import { updateVenueSchema } from "@/lib/contracts/event";
import { prisma } from "@/lib/prisma";

export const PATCH = route<{ id: string }>(async (req: NextRequest, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const ctx = await getTenantContext(session);

  const existing = await prisma.venue.findUnique({ where: { id: Number(params.id) } });
  if (!existing) throw new NotFoundError("That venue wasn't found.");
  assertSameClub(existing.clubId, ctx);

  const body = updateVenueSchema.parse(await req.json());
  const venue = await prisma.venue.update({
    where: { id: existing.id },
    data: {
      name: body.name,
      address: body.address,
      mapLat: body.mapLat === undefined ? undefined : body.mapLat,
      mapLng: body.mapLng === undefined ? undefined : body.mapLng,
      notes: body.notes,
      checkInPin: body.checkInPin === undefined ? undefined : body.checkInPin,
    },
  });
  return ok(venue);
});

export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const ctx = await getTenantContext(session);

  const existing = await prisma.venue.findUnique({
    where: { id: Number(params.id) },
    include: { _count: { select: { events: true } } },
  });
  if (!existing) throw new NotFoundError("That venue wasn't found.");
  assertSameClub(existing.clubId, ctx);
  if (existing._count.events > 0) {
    throw new ConflictError("This venue is used by one or more events — reassign them first.");
  }

  await prisma.venue.delete({ where: { id: existing.id } });
  return noContent();
});
