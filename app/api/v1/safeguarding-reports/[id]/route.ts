import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, NotFoundError } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { reviewSafeguardingReportSchema } from "@/lib/contracts/safeguarding";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

/** PATCH — admin updates a report's status and/or adds internal review notes. */
export const PATCH = route<{ id: string }>(async (req, { params, requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const body = reviewSafeguardingReportSchema.parse(await req.json());
  const reportId = Number(params.id);

  const existing = await prisma.safeguardingReport.findUnique({ where: { id: reportId } });
  if (!existing) throw new NotFoundError("That report wasn't found.");

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.safeguardingReport.update({
      where: { id: reportId },
      data: {
        status: body.status,
        reviewNotes: body.reviewNotes ?? existing.reviewNotes,
        reviewedByUserId: Number(session.user.id),
        reviewedAt: new Date(),
      },
    });

    await logAudit(tx, {
      actorUserId: Number(session.user.id),
      action: "SAFEGUARDING_REPORT_UPDATED",
      entityType: "SafeguardingReport",
      entityId: reportId,
      metadata: { status: body.status },
    });

    return saved;
  });

  return ok(updated, { requestId });
});
