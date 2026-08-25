import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UploadVideoForm from "@/components/coach/UploadVideoForm";
import AssignVideoForm from "@/components/coach/AssignVideoForm";

export default async function CoachVideosPage() {
  const session = await getServerSession(authOptions);
  const teamIds = session!.user.teamIds ?? [];

  const [videos, teams] = await Promise.all([
    prisma.video.findMany({
      where: { uploadedByUserId: Number(session!.user.id) },
      orderBy: { createdAt: "desc" },
      include: { assignments: { include: { team: true, player: { include: { user: true } } } } },
    }),
    prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true } }),
  ]);

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Training Video Library</h1>
      <p className="mt-1 text-slate-600">Upload videos and assign them to a whole team or individual players.</p>

      <div className="mt-6">
        <UploadVideoForm />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {videos.map((v) => (
          <div key={v.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-slate-900">{v.title}</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{v.category.replace(/_/g, " ")}</span>
            </div>
            {v.description && <p className="mt-1 text-sm text-slate-500">{v.description}</p>}
            <div className="mt-3 flex flex-wrap gap-1">
              {v.assignments.map((a) => (
                <span key={a.id} className="rounded-full bg-court-50 px-2 py-0.5 text-xs font-semibold text-court-700">
                  {a.team ? a.team.name : a.player?.user.name}
                </span>
              ))}
            </div>
            <div className="mt-3">
              <AssignVideoForm videoId={v.id} teams={teams} />
            </div>
          </div>
        ))}
        {videos.length === 0 && <p className="text-sm text-slate-500">You haven't uploaded any videos yet.</p>}
      </div>
    </main>
  );
}
