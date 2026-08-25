import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireAuth, AuthorizationError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export const PATCH = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const notification = await prisma.notification.findUnique({ where: { id: Number(params.id) } });

  if (!notification) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (notification.userId !== Number(session.user.id)) {
    throw new AuthorizationError("You don't have access to this notification");
  }

  const updated = await prisma.notification.update({
    where: { id: notification.id },
    data: { isRead: true },
  });

  return NextResponse.json(updated);
});
