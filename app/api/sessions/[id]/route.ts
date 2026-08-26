import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { withApi } from "@/lib/api";
import { requireAuth, requireRole, requireTeamAccess } from "@/lib/authorization";
import { updateSessionSchema } from "@/lib/validation/session";
import { notifyUsers, teamPlayerUserIds } from "@/lib/notify";
import { sendPushToUsers } from "@/lib/push";
import { prisma } from "@/lib/prisma";

export const GET = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const session = requireAuth(await getServerSession(authOptions));
  const trainingSession = await prisma.trainingSession.findUnique({
    where: { id: Number(params.id) },
    include: { team: { select: { id: true, name: true } } },
  });
  if (!trainingSession) return NextResponse.json({ error: "Not found" }, { status: 404 });

  requireTeamAccess(session, trainingSession.teamId);
  return NextResponse.json(trainingSession);
});

/** Edit or cancel — Coach only, and only for their own team's sessions (matches the PRD permission matrix). */
export const PATCH = withApi<{ params: { id: string } }>(async (req, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH"]);
  const existing = await prisma.trainingSession.findUnique({ where: { id: Number(params.id) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  requireTeamAccess(session, existing.teamId);
  const body = updateSessionSchema.parse(await req.json());

  const [updated, recipientUserIds] = await prisma.$transaction(async (tx) => {
    const saved = await tx.trainingSession.update({
      where: { id: existing.id },
      data: {
        title: body.title,
        notes: body.notes,
        date: body.date ? new Date(body.date) : undefined,
        startTime: body.startTime,
        endTime: body.endTime,
        location: body.location,
        status: body.status,
      },
    });

    const recipients = await teamPlayerUserIds(tx, existing.teamId);
    const changeSummary = body.status === "CANCELLED" ? `${saved.title} was cancelled.` : `${saved.title} was updated.`;

    await notifyUsers(tx, recipients, {
      type: "TRAINING_CHANGE",
      title: body.status === "CANCELLED" ? "Training session cancelled" : "Training session updated",
      message: changeSummary,
      linkPath: "/player/training",
    });

    return [saved, recipients] as const;
  });

  await sendPushToUsers(recipientUserIds, {
    title: body.status === "CANCELLED" ? "Training session cancelled" : "Training session updated",
    body: updated.title,
    url: "/player/training",
  });

  return NextResponse.json(updated);
});

export const DELETE = withApi<{ params: { id: string } }>(async (_req, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH"]);
  const existing = await prisma.trainingSession.findUnique({ where: { id: Number(params.id) } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  requireTeamAccess(session, existing.teamId);
  // "Cancel" per the PRD is a status, not a hard delete — training history/attendance should stay intact.
  const [updated, recipientUserIds] = await prisma.$transaction(async (tx) => {
    const saved = await tx.trainingSession.update({
      where: { id: existing.id },
      data: { status: "CANCELLED" },
    });

    const recipients = await teamPlayerUserIds(tx, existing.teamId);
    await notifyUsers(tx, recipients, {
      type: "TRAINING_CHANGE",
      title: "Training session cancelled",
      message: `${saved.title} was cancelled.`,
      linkPath: "/player/training",
    });

    return [saved, recipients] as const;
  });

  await sendPushToUsers(recipientUserIds, {
    title: "Training session cancelled",
    body: updated.title,
    url: "/player/training",
  });

  return NextResponse.json(updated);
});
