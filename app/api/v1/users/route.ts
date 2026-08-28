import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { createStaffUserSchema } from "@/lib/contracts/user";
import { generateTempPassword, hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

/** Admin-only: platform user directory (Admins + Coaches — Players are managed via /api/teams/:id/players). */
export const GET = route(async () => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);

  const users = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "COACH"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  });

  return NextResponse.json(users);
});

export const POST = route(async (req: NextRequest) => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const body = createStaffUserSchema.parse(await req.json());
  const email = body.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "A user with that email already exists" }, { status: 409 });
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
      ...(body.role === "COACH"
        ? { coachProfile: { create: { phone: body.phone, bio: body.bio } } }
        : {}),
    },
    select: { id: true, email: true, name: true, role: true },
  });

  // Returned once — the admin relays this to the new user manually (ARCHITECTURE.md §6.1, no email sending in MVP).
  return NextResponse.json({ user, tempPassword }, { status: 201 });
});
