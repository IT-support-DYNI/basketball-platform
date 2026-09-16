import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { submitSafeguardingReportSchema } from "@/lib/contracts/safeguarding";
import { primaryClubId } from "@/lib/safeguarding";
import { logAudit } from "@/lib/audit";
import { notifyUsers } from "@/lib/notify";
import { sendPushToUsers } from "@/lib/push";
import { sendMail } from "@/lib/mail";
import { safeguardingReportSubmittedMessage } from "@/lib/mail/templates";
import { baseUrl } from "@/lib/base-url";
import { prisma } from "@/lib/prisma";

/**
 * POST — public: submit a safeguarding concern or complaint. No auth
 * required — reporting shouldn't depend on having an account, and staying
 * anonymous is a deliberate option (only `description` is required).
 */
export const POST = route(async (req: NextRequest) => {
  const body = submitSafeguardingReportSchema.parse(await req.json());
  const clubId = await primaryClubId();

  const { reportId, adminIds } = await prisma.$transaction(async (tx) => {
    const saved = await tx.safeguardingReport.create({
      data: {
        clubId,
        reporterName: body.reporterName || null,
        reporterEmail: body.reporterEmail || null,
        relationship: body.relationship || null,
        concernAbout: body.concernAbout || null,
        description: body.description,
      },
    });

    await logAudit(tx, {
      actorUserId: null,
      action: "SAFEGUARDING_REPORT_SUBMITTED",
      entityType: "SafeguardingReport",
      entityId: saved.id,
    });

    const admins = await tx.user.findMany({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    });
    const ids = admins.map((a) => a.id);

    await notifyUsers(tx, ids, {
      type: "SAFEGUARDING_REPORT",
      title: "New safeguarding report",
      message: body.concernAbout
        ? `A concern was raised about ${body.concernAbout}.`
        : "A new safeguarding concern was submitted.",
      linkPath: "/admin/safeguarding",
    });

    return { reportId: saved.id, adminIds: ids };
  });

  // Outside the transaction — a network call, same reasoning as every other
  // push fan-out in this codebase (see lib/push.ts).
  await sendPushToUsers(
    adminIds,
    { title: "New safeguarding report", body: "A new safeguarding concern needs review.", url: "/admin/safeguarding" },
    "SAFEGUARDING",
  );

  // Also straight to the club's own safeguarding contact, not just admin
  // accounts in-app — sendMail never throws to the caller (lib/mail),
  // and no-ops quietly if this isn't configured.
  if (process.env.SAFEGUARDING_CONTACT_EMAIL) {
    await sendMail(
      safeguardingReportSubmittedMessage(
        process.env.SAFEGUARDING_CONTACT_EMAIL,
        `${baseUrl()}/admin/safeguarding`,
        body.concernAbout || null,
      ),
    );
  }

  // Deliberately no `created(report)` — never hand the submitted content
  // back in the response for an unauthenticated caller to inspect.
  return NextResponse.json({ id: reportId }, { status: 201 });
});

/** GET — admin-only: the safeguarding report queue, newest first. */
export const GET = route(async (req: NextRequest) => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const reports = await prisma.safeguardingReport.findMany({
    where: status ? { status: status as never } : undefined,
    include: { reviewedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(reports);
});
