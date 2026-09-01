import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { route } from "@/lib/api";
import { requireAuth } from "@/lib/authorization";
import { pushSubscribeSchema, pushUnsubscribeSchema } from "@/lib/contracts/push";
import { prisma } from "@/lib/prisma";

export const POST = route(async (req: NextRequest) => {
  const session = requireAuth(await getServerSession(authOptions));
  const body = pushSubscribeSchema.parse(await req.json());

  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: { userId: Number(session.user.id), p256dh: body.keys.p256dh, auth: body.keys.auth },
    create: {
      userId: Number(session.user.id),
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
});

export const DELETE = route(async (req: NextRequest) => {
  const session = requireAuth(await getServerSession(authOptions));
  const body = pushUnsubscribeSchema.parse(await req.json());

  await prisma.pushSubscription.deleteMany({
    where: { endpoint: body.endpoint, userId: Number(session.user.id) },
  });

  return NextResponse.json({ ok: true });
});
