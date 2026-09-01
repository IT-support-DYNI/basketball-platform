import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

/** GET /api/v1/notifications?category=&unread=1 — the caller's feed + unread count. */
export const GET = route(async (req: NextRequest) => {
  const session = requireAuth(await getServerSession(authOptions));
  const userId = Number(session.user.id);
  const sp = req.nextUrl.searchParams;
  const category = sp.get("category");
  const unreadOnly = sp.get("unread") === "1";

  const where = {
    userId,
    ...(category ? { category: category as never } : {}),
    ...(unreadOnly ? { isRead: false } : {}),
  };

  const [items, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: 80 }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return ok({ items, unreadCount });
});
