import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/season";
import EditContactForm from "@/components/player/EditContactForm";

export default async function PlayerProfilePage() {
  const session = await getServerSession(authOptions);
  const playerId = session!.user.playerId;
  const season = await getActiveSeason();

  const player = playerId
    ? await prisma.playerProfile.findUnique({
        where: { id: playerId },
        include: {
          user: true,
          memberships: {
            where: { seasonId: season.id, status: { notIn: ["FORMER", "INACTIVE"] } },
            include: { team: { select: { name: true } } },
            take: 1,
          },
        },
      })
    : null;

  if (!player) {
    return (
      <main>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Profile</h1>
        <p className="mt-3 text-sm text-slate-500">Player profile not found.</p>
      </main>
    );
  }

  const membership = player.memberships[0];

  return (
    <main>
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-court-500 to-court-700 text-2xl font-bold text-white">
          {membership?.jerseyNumber ?? "🏀"}
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{player.user.name}</h1>
          <p className="text-slate-600">
            {membership?.position ?? "No position set"} · {membership?.team.name ?? "No team"}
          </p>
        </div>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-surface p-5">
        <h2 className="font-bold text-slate-900">Contact info</h2>
        <p className="mt-1 text-sm text-slate-500">{player.user.email}</p>
        <div className="mt-4">
          <EditContactForm playerId={player.id} initialPhone={player.contactPhone} />
        </div>
      </section>
    </main>
  );
}
