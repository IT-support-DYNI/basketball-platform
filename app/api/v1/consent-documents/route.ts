import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, created } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { createConsentDocumentSchema } from "@/lib/contracts/consent";
import { getTenantContext } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

/** GET — every consent document with its current version + acceptance count. */
export const GET = route(async () => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const docs = await prisma.consentDocument.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      versions: { orderBy: { version: "desc" } },
      _count: { select: { versions: true } },
    },
  });
  const withCounts = await Promise.all(
    docs.map(async (d) => {
      const current = d.versions[0];
      const accepted = current
        ? await prisma.consentRecord.count({ where: { documentVersionId: current.id } })
        : 0;
      return { ...d, currentVersion: current ?? null, acceptedCount: accepted };
    }),
  );
  return ok(withCounts);
});

/** POST — create a document and its first version in one step. */
export const POST = route(async (req: NextRequest) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const ctx = await getTenantContext(session);
  const body = createConsentDocumentSchema.parse(await req.json());

  const doc = await prisma.consentDocument.create({
    data: {
      clubId: ctx.clubId ?? null,
      type: body.type,
      title: body.title,
      requiredForPlayers: body.requiredForPlayers,
      versions: { create: { version: 1, body: body.body } },
    },
    include: { versions: true },
  });
  return created(doc);
});
