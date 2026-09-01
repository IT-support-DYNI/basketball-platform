import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, noContent, NotFoundError } from "@/lib/api";
import { requireRole, requireTeamAccess } from "@/lib/authorization";
import { idParam } from "@/lib/contracts/common";
import { prisma } from "@/lib/prisma";

/** DELETE — remove a staff assignment (admin). */
export const DELETE = route<{ id: string; assignmentId: string }>(async (_req, { params, requestId }) => {
  const session = requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const teamId = idParam.parse(params.id);
  requireTeamAccess(session, teamId);

  const assignmentId = idParam.parse(params.assignmentId);
  const assignment = await prisma.staffAssignment.findFirst({ where: { id: assignmentId, teamId } });
  if (!assignment) throw new NotFoundError("That assignment wasn't found.");

  await prisma.staffAssignment.delete({ where: { id: assignmentId } });
  return noContent(requestId);
});
