import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  requireAuth(await getServerSession(authOptions));

  const coach = await prisma.coachProfile.findUnique({
    where: { id: Number(params.id) },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!coach) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const assignments = await prisma.staffAssignment.findMany({
    where: { userId: coach.userId },
    include: { team: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ ...coach, teams: assignments });
});
