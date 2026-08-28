import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route, ok, created, ConflictError } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { createStaffUserSchema } from "@/lib/contracts/user";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

/** Admin-only: staff directory (Admins + Coaches). Players are managed via
 *  a team's roster. */
export const GET = route(async (_req, { requestId }) => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);

  const users = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "COACH"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });

  return ok(users, { requestId });
});

export const POST = route(async (req: NextRequest, { requestId }) => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const body = createStaffUserSchema.parse(await req.json());
  const email = body.email.trim().toLowerCase();

  if (await prisma.user.findUnique({ where: { email } })) {
    throw new ConflictError("A user with that email already exists.");
  }

  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);

  const user = await prisma.user.create({
    data: {
      email,
      name: body.name,
      role: body.role,
      passwordHash,
      mustChangePassword: true,
      emailVerifiedAt: new Date(), // admin-provisioned — no self-verification step
      ...(body.role === "COACH"
        ? { coachProfile: { create: { phone: body.phone, bio: body.bio } } }
        : {}),
    },
    select: { id: true, email: true, name: true, role: true },
  });

  // Returned once — the admin relays this to the new user (no email provider
  // on the free tier).
  return created({ user, tempPassword }, requestId);
});
