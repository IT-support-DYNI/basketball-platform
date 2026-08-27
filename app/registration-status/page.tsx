import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
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

  return (
    <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-xl flex-col items-center justify-center px-6 py-12 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-court-500 to-court-700 text-2xl shadow-sm shadow-court-500/30">
        🏀
      </span>

      <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">
        {player.registrationStatus === "PENDING" && "Your registration is under review"}
        {player.registrationStatus === "CHANGES_REQUESTED" && "A small update is needed"}
        {player.registrationStatus === "REJECTED" && "Your registration wasn't approved"}
      </h1>

      <div className="mt-3">
        <StatusBadge status={player.registrationStatus} />
      </div>

      <p className="mt-4 text-slate-600">
        {player.registrationStatus === "PENDING" &&
          `You applied to join ${player.team?.name ?? "a team"}. An administrator will review your registration shortly — you'll get a notification the moment there's a decision.`}
        {player.registrationStatus === "CHANGES_REQUESTED" &&
          "An administrator has asked for a change before your registration can be approved."}
        {player.registrationStatus === "REJECTED" &&
          "If you believe this is a mistake, please contact the club directly."}
      </p>

      {player.registrationReviewNote && (
        <div className="mt-4 w-full rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900">
          <p className="font-semibold">Note from the club:</p>
          <p className="mt-1">{player.registrationReviewNote}</p>
        </div>
      )}

      {player.registrationStatus === "CHANGES_REQUESTED" && (
        <div className="mt-6">
          <ResubmitRegistrationButton playerId={player.id} />
        </div>
      )}
    </main>
  );
}
