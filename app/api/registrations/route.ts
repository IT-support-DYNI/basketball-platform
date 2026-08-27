import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

/** Admin-only — the registration review queue (DYNI Blazers PRD §9, "Administrator dashboard" / Journey D). */
export const GET = withApi(async (req: NextRequest) => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const registrations = await prisma.playerProfile.findMany({
    where: status ? { registrationStatus: status as never } : { registrationStatus: { not: "APPROVED" } },
    include: {
      user: { select: { id: true, name: true, email: true, createdAt: true } },
      team: { select: { id: true, name: true } },
      registrationReviewedBy: { select: { name: true } },
    },
    orderBy: { registrationSubmittedAt: "desc" },
  });

  return NextResponse.json(registrations);
});
