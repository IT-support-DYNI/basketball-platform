import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/season";
import EditProfileForm from "@/components/player/EditProfileForm";

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
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Profile</h1>
        <p className="mt-3 text-sm text-ink-dim">Player profile not found.</p>
      </main>
    );
  }

  const membership = player.memberships[0];

  return (
    <main className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-flame to-ember text-2xl font-bold text-on-flame">
          {membership?.jerseyNumber ?? "🏀"}
        </span>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">{player.user.name}</h1>
          <p className="text-ink-dim">
            {membership?.position ?? "No position set"} · {membership?.team.name ?? "No team"} · {player.user.email}
          </p>
        </div>
      </div>

      <section className="rounded-card border border-line bg-surface p-5">
        <h2 className="font-bold text-ink">Your details</h2>
        <p className="mt-1 text-sm text-ink-dim">
          The club uses this for registration, safeguarding and getting hold of someone in an emergency.
        </p>
        <div className="mt-5">
          <EditProfileForm
            playerId={player.id}
            initial={{
              contactPhone: player.contactPhone,
              dateOfBirth: player.dateOfBirth?.toISOString() ?? null,
              address: player.address,
              nationality: player.nationality,
              heightCm: player.heightCm,
              preferredHand: player.preferredHand,
              bio: player.bio,
              emergencyContactName: player.emergencyContactName,
              emergencyContactPhone: player.emergencyContactPhone,
              emergencyContactRelation: player.emergencyContactRelation,
              guardianName: player.guardianName,
              guardianContact: player.guardianContact,
              medicalNotes: player.medicalNotes,
              welfareNotes: player.welfareNotes,
            }}
          />
        </div>
      </section>
    </main>
  );
}
