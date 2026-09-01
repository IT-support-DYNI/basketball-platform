import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes, ReactNode } from "react";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
};

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, hint, error, id, className = "", children, ...rest },
  ref,
) {
  const autoId = useId();
  const selectId = id ?? autoId;
  const hintId = hint ? `${selectId}-hint` : undefined;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-ink-dim">
          {hint}
        </p>
      )}
      <select
        ref={ref}
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={`h-10 w-full rounded-control border bg-surface px-3 text-ink transition focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/25 ${
          error ? "border-danger" : "border-line-strong"
        } ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
