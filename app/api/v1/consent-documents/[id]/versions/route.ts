import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, created, NotFoundError } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { publishConsentVersionSchema } from "@/lib/contracts/consent";
import { publishConsentVersion } from "@/lib/consent";
import { prisma } from "@/lib/prisma";

/** POST — publish a new version. Every player must re-accept it if the
 *  document is required. */
export const POST = route<{ id: string }>(async (req: NextRequest, { params }) => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const documentId = Number(params.id);
  const doc = await prisma.consentDocument.findUnique({ where: { id: documentId } });
  if (!doc) throw new NotFoundError("That document wasn't found.");

  const body = publishConsentVersionSchema.parse(await req.json());
  const version = await publishConsentVersion(documentId, body.body);
  return created(version);
});
