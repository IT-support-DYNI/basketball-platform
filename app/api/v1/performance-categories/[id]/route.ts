import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, NotFoundError, ConflictError } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { idParam } from "@/lib/contracts/common";
import { updatePerformanceCategorySchema } from "@/lib/contracts/performance";
import { prisma } from "@/lib/prisma";

/** PATCH — rename, reorder, or activate/retire a category (admin). Retiring
 *  is the only removal path: past evaluations still reference the category
 *  via PerformanceCategoryScore, so it's deactivated, never deleted. */
export const PATCH = route<{ id: string }>(async (req: NextRequest, { params }) => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const id = idParam.parse(params.id);

  const existing = await prisma.performanceCategoryDefinition.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError("That category wasn't found.");

  const body = updatePerformanceCategorySchema.parse(await req.json());

  if (body.isActive === false && existing.isActive) {
    const activeCount = await prisma.performanceCategoryDefinition.count({ where: { isActive: true } });
    if (activeCount <= 1) {
      throw new ConflictError("At least one category needs to stay active so coaches can record evaluations.");
    }
  }

  const category = await prisma.performanceCategoryDefinition.update({
    where: { id },
    data: { label: body.label, sortOrder: body.sortOrder, isActive: body.isActive },
  });
  return ok(category);
});
