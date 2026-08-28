import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { updateUserSchema } from "@/lib/contracts/user";
import { prisma } from "@/lib/prisma";

export const GET = route<{ id: string }>(async (_req, { params }) => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);

  const user = await prisma.user.findUnique({
    where: { id: Number(params.id) },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
      coachProfile: { select: { id: true, phone: true, bio: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
});

export const PATCH = route<{ id: string }>(async (req, { params }) => {
  requireRole(await getServerSession(authOptions), ["ADMIN"]);
  const body = updateUserSchema.parse(await req.json());
  const userId = Number(params.id);

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const touchesCoachFields = body.phone !== undefined || body.bio !== undefined;

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: body.name,
      isActive: body.isActive,
      ...(touchesCoachFields && target.role === "COACH"
        ? { coachProfile: { update: { phone: body.phone, bio: body.bio } } }
        : {}),
    },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  return NextResponse.json(user);
});
