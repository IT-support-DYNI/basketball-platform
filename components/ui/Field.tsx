import type { ReactNode } from "react";

/**
 * Field building blocks shared by TextField / Select / Checkbox etc., plus a
 * form-level ErrorSummary. WCAG 2.2 AA wants errors both inline and summarised
 * at the top with links to each offending field.
 */

export function FieldHint({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="text-xs text-ink-dim">
      {children}
    </p>
  );
}

export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="text-xs font-medium text-danger">
      {children}
    </p>
  );
}

/** Renders at the top of a form when submission fails validation. Each entry
 *  links to its field by id, moving focus there. */
export function ErrorSummary({
  errors,
}: {
  errors: { id: string; message: string }[];
}) {
  const list = errors.filter((e) => e.message);
  if (list.length === 0) return null;

  return (
    <div
      role="alert"
      tabIndex={-1}
      className="rounded-control border border-danger/40 bg-danger/10 px-4 py-3"
    >
      <p className="text-sm font-semibold text-danger">
        {list.length === 1 ? "There's a problem" : `There are ${list.length} problems`} with this form
      </p>
      <ul className="mt-1.5 space-y-1 text-sm">
        {list.map((e) => (
          <li key={e.id}>
            <a href={`#${e.id}`} className="text-danger underline underline-offset-2 hover:no-underline">
              {e.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
