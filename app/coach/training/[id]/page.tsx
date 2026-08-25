import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import MarkAttendanceForm from "@/components/coach/MarkAttendanceForm";
import SessionStatusControls from "@/components/coach/SessionStatusControls";

export default async function CoachSessionDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const sessionId = Number(params.id);

  const trainingSession = await prisma.trainingSession.findUnique({
    where: { id: sessionId },
    include: { team: { include: { players: { include: { user: true } } } }, attendanceRecords: true },
  });
  if (!trainingSession) notFound();
  if (!session?.user.teamIds?.includes(trainingSession.teamId)) redirect("/coach/training");

  const players = trainingSession.team.players.map((p) => ({
    id: p.id,
    name: p.user.name,
    currentStatus: trainingSession.attendanceRecords.find((r) => r.playerId === p.id)?.status ?? null,
  }));

  return (
    <main>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{trainingSession.title}</h1>
            <StatusBadge status={trainingSession.status} />
          </div>
          <p className="mt-1 text-slate-600">
            {trainingSession.team.name} · {new Date(trainingSession.date).toLocaleDateString()} ·{" "}
            {trainingSession.startTime}–{trainingSession.endTime} · {trainingSession.location}
          </p>
          {trainingSession.notes && <p className="mt-2 text-sm text-slate-500">{trainingSession.notes}</p>}
        </div>
        <SessionStatusControls sessionId={trainingSession.id} status={trainingSession.status} />
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-900">Attendance</h2>
        <div className="mt-3">
          <MarkAttendanceForm sessionId={trainingSession.id} players={players} />
        </div>
      </section>
    </main>
  );
}
