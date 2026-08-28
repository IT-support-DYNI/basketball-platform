import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export const GET = route(async () => {
  const session = requireAuth(await getServerSession(authOptions));

  const notifications = await prisma.notification.findMany({
    where: { userId: Number(session.user.id) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(notifications);
});
