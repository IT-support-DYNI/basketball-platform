import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export const PATCH = withApi(async () => {
  const session = requireAuth(await getServerSession(authOptions));

  await prisma.notification.updateMany({
    where: { userId: Number(session.user.id), isRead: false },
    data: { isRead: true },
  });

  return NextResponse.json({ ok: true });
});
