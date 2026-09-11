import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getActiveSeason } from "@/lib/season";
import { loadPlayerProfileView } from "@/lib/player-profile-view";
import EditProfileForm from "@/components/player/EditProfileForm";
import PlayerProfileHero from "@/components/player/PlayerProfileHero";
import PlayerProfileSections from "@/components/player/PlayerProfileSections";
import ScrollReveal from "@/components/player/ScrollReveal";

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
        <h1 className="font-display text-3xl text-ink">Profile</h1>
        <p className="mt-3 text-sm text-ink-dim">Player profile not found.</p>
      </main>
    );
  }

  const heroView = await loadPlayerProfileView(player.id, session!);

  return (
    <main className="flex flex-col gap-8">
      {heroView && (
        <>
          <PlayerProfileHero player={heroView} editable />
          <PlayerProfileSections player={heroView} editable />
        </>
      )}

      <ScrollReveal delayMs={260}>
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
                weightKg: player.weightKg,
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
      </ScrollReveal>
    </main>
  );
}
