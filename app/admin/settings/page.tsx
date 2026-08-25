import { prisma } from "@/lib/prisma";
import PostAnnouncementForm from "@/components/admin/PostAnnouncementForm";
import DeleteAnnouncementButton from "@/components/admin/DeleteAnnouncementButton";

export default async function AdminSettingsPage() {
  const [teams, announcements] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { name: true } }, team: { select: { name: true } } },
    }),
  ]);

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Settings</h1>
      <p className="mt-1 text-slate-600">Platform-wide settings and announcements.</p>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-900">Announcements</h2>
        <p className="mt-1 text-sm text-slate-500">
          Post a platform-wide announcement (every player sees it) or one for a specific team. You can
          remove any announcement, including ones coaches posted for their own team.
        </p>

        <div className="mt-4">
          <PostAnnouncementForm teams={teams} />
        </div>

        <ul className="mt-6 divide-y divide-slate-100">
          {announcements.map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-800">{a.title}</p>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                    {a.scope === "PLATFORM" ? "Platform-wide" : a.team?.name}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{a.body}</p>
                <p className="mt-1 text-xs text-slate-400">by {a.author.name} · {new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
              <DeleteAnnouncementButton id={a.id} />
            </li>
          ))}
          {announcements.length === 0 && <p className="py-3 text-sm text-slate-500">Nothing posted yet.</p>}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-6">
        <p className="text-sm font-semibold text-slate-700">Planned for later</p>
        <p className="mt-1 text-sm text-slate-500">
          Multi-club configuration, configurable performance categories, and notification channels
          (email/SMS/push) are post-MVP — see ARCHITECTURE.md §8 (Future Features).
        </p>
      </section>
    </main>
  );
}
