import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireAuth, requireRole, requireTeamAccess } from "@/lib/authorization";
import { createSessionSchema } from "@/lib/validation/session";
import { notifyUsers, teamPlayerUserIds } from "@/lib/notify";
import { sendPushToUsers } from "@/lib/push";
import { prisma } from "@/lib/prisma";

export const GET = withApi<{ params: { id: string } }>(async (req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const teamId = Number(params.id);
  requireTeamAccess(session, teamId);

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const sessions = await prisma.trainingSession.findMany({
    where: {
      teamId,
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(sessions);
});

/** Per the PRD's permission matrix, only Coaches create sessions — Admin has full visibility but doesn't run training day-to-day. */
export const POST = withApi<{ params: { id: string } }>(async (req, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH"]);
  const teamId = Number(params.id);
  requireTeamAccess(session, teamId);

  const body = createSessionSchema.parse(await req.json());

  const [created, recipientUserIds] = await prisma.$transaction(async (tx) => {
    const session_ = await tx.trainingSession.create({
      data: {
        teamId,
        title: body.title,
        notes: body.notes,
        date: new Date(body.date),
        startTime: body.startTime,
        endTime: body.endTime,
        location: body.location,
        createdByCoachId: session.user.coachProfileId!,
      },
    });

    const recipients = await teamPlayerUserIds(tx, teamId);
    await notifyUsers(tx, recipients, {
      type: "TRAINING_CHANGE",
      title: "New training session scheduled",
      message: `${body.title} — ${body.date} at ${body.startTime}, ${body.location}.`,
      linkPath: "/player/training",
    });

    return [session_, recipients] as const;
  });

  await sendPushToUsers(recipientUserIds, {
    title: "New training session scheduled",
    body: `${body.title} — ${body.date} at ${body.startTime}, ${body.location}.`,
    url: "/player/training",
  });

  return NextResponse.json(created, { status: 201 });
});
