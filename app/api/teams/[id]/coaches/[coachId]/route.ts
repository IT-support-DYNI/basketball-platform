import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export const DELETE = withApi<{ params: { id: string; coachId: string } }>(async (_req, { params }) => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);

  await prisma.teamCoach.delete({
    where: {
      teamId_coachProfileId: {
        teamId: Number(params.id),
        coachProfileId: Number(params.coachId),
      },
    },
  });

  return NextResponse.json({ ok: true });
});
