import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPlaybackUrl } from "@/lib/storage";
import UploadVideoForm from "@/app/coach/videos/_components/UploadVideoForm";
import AssignVideoForm from "@/app/coach/videos/_components/AssignVideoForm";

export default async function CoachVideosPage() {
  const session = await getServerSession(authOptions);
  const teamIds = session!.user.teamIds ?? [];

  const [rawVideos, teams] = await Promise.all([
    prisma.video.findMany({
      where: { uploadedByUserId: Number(session!.user.id) },
      orderBy: { createdAt: "desc" },
      include: { assignments: { include: { team: true, player: { include: { user: true } } } } },
    }),
    prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true } }),
  ]);

  // Signed fresh per page load — the bucket is private, nothing here is a permanent public URL (see lib/storage.ts).
  // A linked video (externalUrl, no key) plays straight from wherever it's hosted.
  const videos = await Promise.all(
    rawVideos.map(async (v) => ({
      ...v,
      playbackUrl: v.externalUrl ?? (v.key ? await getPlaybackUrl(v.key) : ""),
      thumbnailUrl: v.thumbnailKey ? await getPlaybackUrl(v.thumbnailKey) : null,
    }))
  );

  return (
    <main>
      <h1 className="font-display text-3xl text-ink">Training Video Library</h1>
      <p className="mt-1 text-slate-600">Upload videos and assign them to a whole team or individual players.</p>

      <div className="mt-6">
        <UploadVideoForm />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {videos.map((v) => (
          <div key={v.id} className="rounded-card border border-line bg-surface p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-slate-900">{v.title}</p>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">{v.category.replace(/_/g, " ")}</span>
            </div>
            {v.description && <p className="mt-1 text-sm text-slate-500">{v.description}</p>}
            {v.key ? (
              // eslint-disable-next-line jsx-a11y/media-has-caption -- coach-uploaded training clips, no caption track exists
              <video
                controls
                preload="none"
                poster={v.thumbnailUrl ?? undefined}
                src={v.playbackUrl}
                className="mt-3 aspect-video w-full rounded-control bg-black"
              />
            ) : (
              <a
                href={v.playbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex aspect-video w-full items-center justify-center rounded-control border border-line bg-slate-50 text-sm font-semibold text-court-700 hover:bg-slate-100"
              >
                Watch on original site →
              </a>
            )}
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
