import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { assignCoachSchema } from "@/lib/contracts/team";
import { prisma } from "@/lib/prisma";

export const POST = route<{ id: string }>(async (req, { params }) => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const body = assignCoachSchema.parse(await req.json());
  const teamId = Number(params.id);

  const existing = await prisma.teamCoach.findUnique({
    where: { teamId_coachProfileId: { teamId, coachProfileId: body.coachProfileId } },
  });
  if (existing) {
    return NextResponse.json({ error: "That coach is already assigned to this team" }, { status: 409 });
  }

  const assignment = await prisma.teamCoach.create({
    data: { teamId, coachProfileId: body.coachProfileId, isPrimary: body.isPrimary ?? false },
  });

  return NextResponse.json(assignment, { status: 201 });
});
