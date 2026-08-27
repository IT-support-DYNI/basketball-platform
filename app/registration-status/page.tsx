import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Brandmark from "@/components/Brandmark";
import StatusBadge from "@/components/StatusBadge";
import Alert from "@/components/ui/Alert";
import ResubmitRegistrationButton from "@/components/player/ResubmitRegistrationButton";

export default async function RegistrationStatusPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "PLAYER" || !session.user.playerId) redirect("/");

  const player = await prisma.playerProfile.findUnique({
    where: { id: session.user.playerId },
    include: { team: { select: { name: true } } },
  });
  if (!player) redirect("/login");

  if (player.registrationStatus === "APPROVED") redirect("/player/dashboard");

  const heading =
    player.registrationStatus === "PENDING"
      ? "Your registration is under review"
      : player.registrationStatus === "CHANGES_REQUESTED"
        ? "A small update is needed"
        : "Your registration wasn't approved";

  const body =
    player.registrationStatus === "PENDING"
      ? `You applied to join ${player.team?.name ?? "a team"}. An administrator will review your registration shortly — you'll get a notification the moment there's a decision.`
      : player.registrationStatus === "CHANGES_REQUESTED"
        ? "An administrator has asked for a change before your registration can be approved."
        : "If you think this is a mistake, please contact the club directly.";

  return (
    <main className="mx-auto flex min-h-[calc(100vh-56px)] max-w-lg flex-col items-center justify-center px-6 py-12 text-center">
      <Brandmark size="lg" wordmark={false} />

      <h1 className="mt-5 font-display text-2xl font-extrabold uppercase tracking-tight text-ink">
        {heading}
      </h1>

      <div className="mt-3">
        <StatusBadge status={player.registrationStatus} />
      </div>

      <p className="mt-4 text-ink-dim">{body}</p>

      {player.registrationReviewNote && (
        <Alert tone="warning" className="mt-5 w-full text-left">
          <p className="font-semibold">Note from the club</p>
          <p className="mt-1">{player.registrationReviewNote}</p>
        </Alert>
      )}

      {player.registrationStatus === "CHANGES_REQUESTED" && (
        <div className="mt-6">
          <ResubmitRegistrationButton playerId={player.id} />
        </div>
      )}
    </main>
  );
}
