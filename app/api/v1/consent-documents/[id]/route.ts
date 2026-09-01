import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, NotFoundError } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { updateConsentDocumentSchema } from "@/lib/contracts/consent";
import { prisma } from "@/lib/prisma";

/** PATCH — rename, retire, or flip the "required" flag on a consent document. */
export const PATCH = route<{ id: string }>(async (req: NextRequest, { params }) => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const id = Number(params.id);
  const existing = await prisma.consentDocument.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("That document wasn't found.");

  const body = updateConsentDocumentSchema.parse(await req.json());
  const updated = await prisma.consentDocument.update({
    where: { id },
    data: {
      title: body.title,
      requiredForPlayers: body.requiredForPlayers,
      active: body.active,
    },
  });
  return ok(updated);
});
