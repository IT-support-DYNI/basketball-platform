import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/authorization";
import { getPlaybackUrl } from "@/lib/storage";
import { idParam } from "@/lib/contracts/common";
import { videoAssignmentSelect, visibleAssignmentWhere, visibleVideoWhere } from "@/lib/videos";
import { prisma } from "@/lib/prisma";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));

  const id = idParam.safeParse(params.id);
  if (!id.success) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const video = await prisma.video.findFirst({
    where: { id: id.data, ...visibleVideoWhere(session) },
    include: {
      assignments: { where: visibleAssignmentWhere(session), select: videoAssignmentSelect },
    },
  });

  if (!video) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [playbackUrl, thumbnailUrl] = await Promise.all([
    video.externalUrl ?? (video.key ? getPlaybackUrl(video.key) : ""),
    video.thumbnailKey ? getPlaybackUrl(video.thumbnailKey) : null,
  ]);
  return NextResponse.json({ ...video, playbackUrl, thumbnailUrl });
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
