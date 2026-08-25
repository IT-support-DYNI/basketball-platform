import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireRole, AuthorizationError } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";

export const DELETE = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN", "COACH"]);
  const announcement = await prisma.announcement.findUnique({ where: { id: Number(params.id) } });
  if (!announcement) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAuthor = announcement.authorUserId === Number(session.user.id);
  if (session.user.role !== "ADMIN" && !isAuthor) {
    throw new AuthorizationError("You can only remove announcements you posted");
  }

  await prisma.announcement.delete({ where: { id: announcement.id } });
  return NextResponse.json({ ok: true });
});
