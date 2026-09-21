import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, created, ConflictError, BadRequestError } from "@/lib/api";
import { requireAuth, requireRole } from "@/lib/authorization";
import { createPerformanceCategorySchema } from "@/lib/contracts/performance";
import { categoryKeyFromLabel } from "@/lib/performance-categories";
import { prisma } from "@/lib/prisma";

/** GET — the categories coaches score players on, in display order. Any
 *  signed-in user (the evaluation form needs this); `?all=1` additionally
 *  includes retired categories, for the admin management screen only. */
export const GET = route(async (req: NextRequest) => {
  const session = requireAuth(await getServerSession(authOptions));
  const includeInactive = new URL(req.url).searchParams.get("all") === "1" && session.user.role === "ADMIN";

  const categories = await prisma.performanceCategoryDefinition.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return ok(categories);
});

/** POST — add a new category (admin). New ones sort after every existing one. */
export const POST = route(async (req: NextRequest) => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const body = createPerformanceCategorySchema.parse(await req.json());

  const key = categoryKeyFromLabel(body.label);
  if (!key) throw new BadRequestError("That name doesn't resolve to a usable category key.");

  const existing = await prisma.performanceCategoryDefinition.findUnique({ where: { key } });
  if (existing) throw new ConflictError("A category with that name already exists.");

  const last = await prisma.performanceCategoryDefinition.findFirst({ orderBy: { sortOrder: "desc" } });

  const category = await prisma.performanceCategoryDefinition.create({
    data: { key, label: body.label, sortOrder: (last?.sortOrder ?? -1) + 1 },
  });
  return created(category);
});
