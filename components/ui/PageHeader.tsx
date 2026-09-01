import type { ReactNode } from "react";

/** Standard page title block: eyebrow, big display heading, optional lead + actions. */
export default function PageHeader({
  eyebrow,
  title,
  lead,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-flame">{eyebrow}</p>
        )}
        <h1 className="mt-1 font-display text-2xl font-extrabold uppercase leading-tight tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {lead && <p className="mt-1.5 text-ink-dim">{lead}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
