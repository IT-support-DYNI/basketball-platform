import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { loadPlayerProfileView } from "@/lib/player-profile-view";
import PlayerProfileHero from "@/components/player/PlayerProfileHero";
import PlayerProfileSections from "@/components/player/PlayerProfileSections";

export default async function CoachPlayerProfilePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const playerId = Number(params.id);
  if (!Number.isInteger(playerId)) notFound();

  const player = await loadPlayerProfileView(playerId, session!);
  if (!player) notFound();

  return (
    <main className="flex flex-col gap-6">
      <PlayerProfileHero player={player} />
      <PlayerProfileSections player={player} />
    </main>
  );
}
