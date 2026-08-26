import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlaybackUrl } from "@/lib/storage";

export default async function PlayerVideosPage() {
  const session = await getServerSession(authOptions);
  const { playerId, teamId } = session!.user;

  const assignmentRows = await prisma.videoAssignment.findMany({
    where: { OR: [{ playerId: playerId ?? -1 }, { teamId: teamId ?? -1 }] },
    include: { video: true },
    orderBy: { assignedAt: "desc" },
  });

  // Signed fresh per page load — the bucket is private, nothing here is a permanent public URL (see lib/storage.ts).
  const assignments = await Promise.all(
    assignmentRows.map(async (a) => ({ ...a, playbackUrl: await getPlaybackUrl(a.video.key) }))
  );

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Training Video Library</h1>
      <p className="mt-1 text-slate-600">Videos your coach has assigned to your team or to you personally.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {assignments.map((a) => (
          <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-slate-900">{a.video.title}</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {a.playerId ? "Assigned to you" : "Team"}
              </span>
            </div>
            {a.video.description && <p className="mt-1 text-sm text-slate-500">{a.video.description}</p>}
            <p className="mt-2 text-xs font-semibold text-court-700">{a.video.category.replace(/_/g, " ")}</p>
            <a href={a.playbackUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-court-700 hover:text-court-800">
              Watch →
            </a>
          </div>
        ))}
        {assignments.length === 0 && <p className="text-sm text-slate-500">No videos assigned yet.</p>}
      </div>
    </main>
  );
}
