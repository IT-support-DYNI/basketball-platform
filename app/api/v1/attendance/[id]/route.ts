import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { requireRole } from "@/lib/authorization";
import { authorize } from "@/lib/authz/guard";
import { correctAttendanceSchema } from "@/lib/contracts/attendance";
import { prisma } from "@/lib/prisma";

/**
 * PATCH /api/v1/attendance/{id} — a coach corrects one record. The `reason` is
 * mandatory and every change is written to AttendanceAudit (brief §11).
 */
export const PATCH = route<{ id: string }>(async (req: NextRequest, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH", "ADMIN"]);
  const record = await prisma.attendanceRecord.findUnique({
    where: { id: Number(params.id) },
    select: {
      id: true,
      status: true,
      note: true,
      checkInAt: true,
      checkOutAt: true,
      method: true,
      event: { select: { teamId: true } },
    },
  });
  if (!record) throw new NotFoundError("That attendance record wasn't found.");
  if (record.event.teamId == null || authorize(session).cannot("record", "Attendance", { teamId: record.event.teamId })) {
    throw new ForbiddenError("You don't run this event.");
  }

  const body = correctAttendanceSchema.parse(await req.json());

  const before = {
    status: record.status,
    note: record.note,
    checkInAt: record.checkInAt?.toISOString() ?? null,
    checkOutAt: record.checkOutAt?.toISOString() ?? null,
  };

  const data: Record<string, unknown> = {
    recordedByCoachId: session.user.coachProfileId ?? undefined,
    recordedAt: new Date(),
  };
  if (body.status != null) data.status = body.status;
  if (body.note !== undefined) data.note = body.note;
  if (body.checkInAt !== undefined) data.checkInAt = body.checkInAt ? new Date(body.checkInAt) : null;
  if (body.checkOutAt !== undefined) data.checkOutAt = body.checkOutAt ? new Date(body.checkOutAt) : null;

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.attendanceRecord.update({
      where: { id: record.id },
      data,
      select: { id: true, status: true, note: true, checkInAt: true, checkOutAt: true, method: true },
    });
    const after = {
      status: saved.status,
      note: saved.note,
      checkInAt: saved.checkInAt?.toISOString() ?? null,
      checkOutAt: saved.checkOutAt?.toISOString() ?? null,
    };
    await tx.attendanceAudit.create({
      data: {
        recordId: record.id,
        changedByUserId: Number(session.user.id),
        before,
        after,
        reason: body.reason,
      },
    });
    return saved;
  });

  return ok(updated);
});
