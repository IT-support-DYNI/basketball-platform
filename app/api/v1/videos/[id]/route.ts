import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/authorization";
import { getPlaybackUrl } from "@/lib/storage";
import { prisma } from "@/lib/prisma";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  requireAuth(await getServerSession(authOptions));

  const video = await prisma.video.findUnique({
    where: { id: Number(params.id) },
    include: { assignments: { include: { team: true, player: { include: { user: true } } } } },
  });

  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ...video, playbackUrl: await getPlaybackUrl(video.key) });
});

export const DELETE = route<{ id: string }>(async (_req, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH", "ADMIN"]);
  const video = await prisma.video.findUnique({ where: { id: Number(params.id) } });
  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (session.user.role === "COACH" && video.uploadedByUserId !== Number(session.user.id)) {
    return NextResponse.json({ error: "You can only remove videos you uploaded" }, { status: 403 });
  }

  await prisma.video.delete({ where: { id: video.id } });
  return NextResponse.json({ ok: true });
});
