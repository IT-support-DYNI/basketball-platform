import { NextResponse } from "next/server";

import { route } from "@/lib/api";
import { prisma } from "@/lib/prisma";

/** Unauthenticated — just enough for the public registration form's team picker. No roster/private data. */
export const GET = route(async () => {
  const teams = await prisma.team.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, name: true, ageGroup: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(teams);
});
