import {
  TRAINING_BLOCK_CATEGORY_LABEL,
  planDurationMinutes,
} from "@/lib/training";

export type PlanReadData = {
  title: string;
  objectives: string | null;
  blocks: {
    category: string;
    title: string | null;
    durationMinutes: number | null;
    notes: string | null;
    drillName: string | null;
  }[];
};

/** Read-only rendering of a session plan — shown to players in the calendar
 *  dialog, and reused anywhere a plan needs to be displayed without editing. */
export default function PlanReadView({ plan }: { plan: PlanReadData }) {
  const total = planDurationMinutes(plan.blocks);
  return (
    <div className="flex flex-col gap-3">
      {plan.objectives && <p className="text-sm text-ink-dim">{plan.objectives}</p>}
      <p className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
        {plan.blocks.length} {plan.blocks.length === 1 ? "block" : "blocks"} · {total} min
      </p>
      <ol className="flex flex-col gap-2">
        {plan.blocks.map((b, i) => (
          <li key={i} className="rounded-control border border-line bg-surface-2 px-3 py-2 text-sm">
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-semibold text-ink">
                {b.title || TRAINING_BLOCK_CATEGORY_LABEL[b.category as keyof typeof TRAINING_BLOCK_CATEGORY_LABEL]}
              </span>
              {b.durationMinutes ? <span className="flex-none text-xs text-ink-faint">{b.durationMinutes} min</span> : null}
            </div>
            {b.title && (
              <span className="text-xs text-ink-faint">
                {TRAINING_BLOCK_CATEGORY_LABEL[b.category as keyof typeof TRAINING_BLOCK_CATEGORY_LABEL]}
              </span>
            )}
            {b.drillName && <p className="mt-0.5 text-xs text-ink-dim">Drill: {b.drillName}</p>}
            {b.notes && <p className="mt-1 whitespace-pre-wrap text-xs text-ink-dim">{b.notes}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}
