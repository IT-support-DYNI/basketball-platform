import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function PlayerFeedbackPage() {
  const session = await getServerSession(authOptions);
  const playerId = session!.user.playerId;

  const feedback = playerId
    ? await prisma.feedback.findMany({
        where: { playerId },
        include: {
          coach: { include: { user: { select: { name: true } } } },
          session: { select: { title: true } },
          evaluation: { select: { periodType: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Coach Feedback</h1>
      <p className="mt-1 text-slate-600">Everything your coach has shared with you.</p>

      <ul className="mt-6 space-y-3">
        {feedback.map((f) => (
          <li key={f.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="italic text-slate-700">"{f.message}"</p>
            <p className="mt-2 text-xs text-slate-400">
              — {f.coach.user.name} · {new Date(f.createdAt).toLocaleDateString()}
              {f.session ? ` · re: ${f.session.title}` : ""}
              {f.evaluation ? ` · re: ${f.evaluation.periodType.toLowerCase()} evaluation` : ""}
            </p>
          </li>
        ))}
        {feedback.length === 0 && <p className="text-sm text-slate-500">No feedback yet.</p>}
      </ul>
    </main>
  );
}
