"use client";

import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { useId, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { FieldError } from "./Field";

export function Checkbox({
  label,
  description,
  error,
  id,
  checked,
  defaultChecked,
  onCheckedChange,
  name,
  required,
  className,
}: {
  label: ReactNode;
  description?: ReactNode;
  error?: string;
  id?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  name?: string;
  required?: boolean;
  className?: string;
}) {
  const autoId = useId();
  const boxId = id ?? autoId;
  const labelId = `${boxId}-label`;
  const errorId = error ? `${boxId}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-start gap-2.5">
        <RadixCheckbox.Root
          id={boxId}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={(v) => onCheckedChange?.(v === true)}
          name={name}
          required={required}
          aria-labelledby={labelId}
          aria-describedby={errorId}
          className={cn(
            "mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded border transition",
            "border-line-strong bg-surface",
            "data-[state=checked]:border-flame data-[state=checked]:bg-flame data-[state=checked]:text-on-flame",
          )}
        >
          <RadixCheckbox.Indicator>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3 w-3">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </RadixCheckbox.Indicator>
        </RadixCheckbox.Root>
        <label id={labelId} htmlFor={boxId} className="text-sm text-ink">
          {label}
          {description && <span className="mt-0.5 block text-xs text-ink-dim">{description}</span>}
        </label>
      </div>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
