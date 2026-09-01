import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Brandmark from "@/components/Brandmark";
import StatusBadge from "@/components/StatusBadge";
import Alert from "@/components/ui/Alert";
import ResubmitRegistrationButton from "@/components/player/ResubmitRegistrationButton";
import ResendVerificationButton from "@/components/auth/ResendVerificationButton";

export default async function RegistrationStatusPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (session.user.role !== "PLAYER" || !session.user.playerId) redirect("/");

  const player = await prisma.playerProfile.findUnique({
    where: { id: session.user.playerId },
    include: { registrationTeam: { select: { name: true } }, user: { select: { emailVerifiedAt: true, email: true } } },
  });
  if (!player) redirect("/login");

  const emailVerified = player.user.emailVerifiedAt != null;

  if (player.registrationStatus === "APPROVED") redirect("/player/dashboard");

  const heading =
    player.registrationStatus === "PENDING"
      ? "Your registration is under review"
      : player.registrationStatus === "CHANGES_REQUESTED"
        ? "A small update is needed"
        : "Your registration wasn't approved";

  const body =
    player.registrationStatus === "PENDING"
      ? `You applied to join ${player.registrationTeam?.name ?? "a team"}. An administrator will review your registration shortly — you'll get a notification the moment there's a decision.`
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

      <div className="mt-6 w-full rounded-card border border-line bg-surface p-4 text-left">
        <p className="font-mono text-[11px] uppercase tracking-wider text-flame">Checklist</p>
        <ul className="mt-2 space-y-2 text-sm">
          <li className="flex items-center gap-2 text-success">
            <Check /> Profile submitted
          </li>
          <li className="flex items-center gap-2 text-success">
            <Check /> Registration terms accepted
          </li>
          {emailVerified ? (
            <li className="flex items-center gap-2 text-success">
              <Check /> Email address confirmed
            </li>
          ) : (
            <li className="flex flex-col gap-2 text-warning">
              <span className="flex items-center gap-2">
                <Dot /> Confirm your email — check {player.user.email} for the link
              </span>
              <ResendVerificationButton />
            </li>
          )}
        </ul>
        {!emailVerified && (
          <p className="mt-3 text-xs text-ink-faint">
            An administrator can&apos;t approve your registration until your email is confirmed.
          </p>
        )}
      </div>

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

function Check() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5 flex-none">
      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 flex-none rounded-full bg-current" />;
}
