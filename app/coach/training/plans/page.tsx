import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { listPlans } from "@/lib/training-plans";
import { planDurationMinutes, TRAINING_PLAN_STATUS_LABEL } from "@/lib/training";
import PageHeader from "@/components/ui/PageHeader";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/states";

export const metadata = { title: "Session plans" };

export default async function TrainingPlansPage() {
  const session = await getServerSession(authOptions);
  const teamIds = session!.user.teamIds ?? [];
  const [plans, templates] = await Promise.all([
    listPlans(teamIds, {}),
    listPlans(teamIds, { templates: true }),
  ]);

  const now = Date.now();
  const upcoming = plans.filter((p) => !p.date || new Date(p.date).getTime() >= now - 12 * 3600e3);
  const past = plans.filter((p) => p.date && new Date(p.date).getTime() < now - 12 * 3600e3);

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Coach"
        title="Session plans"
        lead="Structured plans for each training session — blocks, drills and a running time."
        actions={<ButtonLink href="/coach/training/plans/new">New plan</ButtonLink>}
      />

      {plans.length === 0 && templates.length === 0 ? (
        <EmptyState title="No plans yet" description="Build your first session plan, or save one as a template to reuse." />
      ) : (
        <>
          <Group title="Upcoming & drafts" plans={upcoming} />
          {templates.length > 0 && <Group title="Templates" plans={templates} />}
          {past.length > 0 && <Group title="Past sessions" plans={past} />}
        </>
      )}
    </main>
  );
}

function Group({
  title,
  plans,
}: {
  title: string;
  plans: Awaited<ReturnType<typeof listPlans>>;
}) {
  if (plans.length === 0) return null;
  return (
    <section>
      <h2 className="mb-2 font-mono text-[11px] uppercase tracking-wider text-ink-dim">{title}</h2>
      <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
        {plans.map((p) => (
          <li key={p.id}>
            <Link href={`/coach/training/plans/${p.id}`} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-surface-2">
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{p.title}</p>
                <p className="text-xs text-ink-faint">
                  {p.team.name}
                  {p.date ? ` · ${new Date(p.date).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}` : ""}
                  {` · ${p._count.blocks} blocks · ${planDurationMinutes(p.blocks)} min`}
                </p>
              </div>
              {!p.isTemplate && (
                <span className="flex-none rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-dim">
                  {TRAINING_PLAN_STATUS_LABEL[p.status as keyof typeof TRAINING_PLAN_STATUS_LABEL]}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
