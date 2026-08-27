import { forwardRef, useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  error?: string;
};

/** Labelled text input with hint and inline error, wired for screen readers. */
export const TextField = forwardRef<HTMLInputElement, Props>(function TextField(
  { label, hint, error, id, className = "", ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {hint && (
        <p id={hintId} className="text-xs text-ink-dim">
          {hint}
        </p>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className={`h-10 w-full rounded-control border bg-surface px-3 text-ink placeholder:text-ink-faint transition focus:border-flame focus:outline-none focus:ring-2 focus:ring-flame/25 ${
          error ? "border-danger" : "border-line-strong"
        } ${className}`}
        {...rest}
      />
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
