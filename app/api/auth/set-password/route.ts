import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { setPasswordSchema } from "@/lib/contracts/user";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

/** Any authenticated user sets their own password — used both for the forced first-login change and voluntary changes later. */
export const POST = route(async (req: NextRequest) => {
  const session = requireAuth(await getServerSession(authOptions));
  const body = setPasswordSchema.parse(await req.json());

  const passwordHash = await hashPassword(body.newPassword);
  await prisma.user.update({
    where: { id: Number(session.user.id) },
    data: { passwordHash, mustChangePassword: false },
  });

  return NextResponse.json({ ok: true });
});
