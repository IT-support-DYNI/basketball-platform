import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/authorization";
import { createVideoSchema } from "@/lib/validation/video";
import { prisma } from "@/lib/prisma";

/** Admin: every video. Coach: videos for their teams (+ ones they uploaded). Player: videos assigned to their team or to them personally. */
export const GET = withApi(async (req: NextRequest) => {
  const session = requireAuth(await getServerSession(authOptions));
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");

  const categoryFilter = category ? { category: category as never } : {};

  let where;
  if (session.user.role === "ADMIN") {
    where = categoryFilter;
  } else if (session.user.role === "COACH") {
    where = {
      ...categoryFilter,
      OR: [
        { uploadedByUserId: Number(session.user.id) },
        { assignments: { some: { teamId: { in: session.user.teamIds ?? [] } } } },
      ],
    };
  } else {
    where = {
      ...categoryFilter,
      assignments: {
        some: {
          OR: [
            { teamId: session.user.teamId ?? -1 },
            { playerId: session.user.playerId ?? -1 },
          ],
        },
      },
    };
  }

  const videos = await prisma.video.findMany({
    where,
    include: { assignments: true, uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(videos);
});

/** Records a video already uploaded to R2 (see /api/videos/upload-url) — Coach only. */
export const POST = withApi(async (req: NextRequest) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH"]);
  const body = createVideoSchema.parse(await req.json());

  const video = await prisma.video.create({
    data: {
      title: body.title,
      description: body.description,
      category: body.category,
      url: body.url,
      thumbnailUrl: body.thumbnailUrl,
      uploadedByUserId: Number(session.user.id),
    },
  });

  return NextResponse.json(video, { status: 201 });
});
