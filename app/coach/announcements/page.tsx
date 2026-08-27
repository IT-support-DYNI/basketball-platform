import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PostAnnouncementForm from "@/components/coach/PostAnnouncementForm";

export default async function CoachAnnouncementsPage() {
  const session = await getServerSession(authOptions);
  const teamIds = session!.user.teamIds ?? [];

  const [teams, announcements] = await Promise.all([
    prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true } }),
    prisma.announcement.findMany({
      where: { OR: [{ scope: "PLATFORM" }, { teamId: { in: teamIds } }] },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } }, team: { select: { name: true } } },
    }),
  ]);

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Announcements</h1>
      <p className="mt-1 text-slate-600">Post updates to your team, and see platform-wide announcements from Admin.</p>

      <div className="mt-6">
        <PostAnnouncementForm teams={teams} />
      </div>

      <ul className="mt-6 space-y-3">
        {announcements.map((a) => (
          <li key={a.id} className="rounded-2xl border border-slate-200 bg-surface p-5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-slate-900">{a.title}</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                {a.scope === "PLATFORM" ? "Platform-wide" : a.team?.name}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{a.body}</p>
            <p className="mt-2 text-xs text-slate-400">by {a.author.name} · {new Date(a.createdAt).toLocaleDateString()}</p>
          </li>
        ))}
        {announcements.length === 0 && <p className="text-sm text-slate-500">Nothing posted yet.</p>}
      </ul>
    </main>
  );
}
