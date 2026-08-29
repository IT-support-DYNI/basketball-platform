import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok } from "@/lib/api";
import { ForbiddenError, NotFoundError } from "@/lib/api/errors";
import { requireRole } from "@/lib/authorization";
import { authorize } from "@/lib/authz/guard";
import { prisma } from "@/lib/prisma";

/** GET /api/v1/attendance/{id}/audit — the correction history for one record. */
export const GET = route<{ id: string }>(async (_req, { params }) => {
  const session = requireRole(await getServerSession(authOptions), ["COACH", "ADMIN"]);
  const record = await prisma.attendanceRecord.findUnique({
    where: { id: Number(params.id) },
    select: { id: true, event: { select: { teamId: true } } },
  });
  if (!record) throw new NotFoundError("That attendance record wasn't found.");
  if (record.event.teamId == null || authorize(session).cannot("record", "Attendance", { teamId: record.event.teamId })) {
    throw new ForbiddenError("You don't run this event.");
  }

  const audits = await prisma.attendanceAudit.findMany({
    where: { recordId: record.id },
    orderBy: { changedAt: "desc" },
    select: {
      id: true,
      before: true,
      after: true,
      reason: true,
      changedAt: true,
      changedBy: { select: { name: true } },
    },
  });
  return ok(audits);
});
