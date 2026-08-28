"use client";

import * as RadixRadio from "@radix-ui/react-radio-group";
import { useId, type ReactNode } from "react";

import { cn } from "@/lib/cn";
import { FieldError, FieldHint } from "./Field";

type Option = { value: string; label: ReactNode; description?: ReactNode };

export function RadioGroup({
  label,
  hint,
  error,
  name,
  value,
  defaultValue,
  onValueChange,
  options,
  required,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  options: Option[];
  required?: boolean;
}) {
  const groupId = useId();
  const hintId = hint ? `${groupId}-hint` : undefined;
  const errorId = error ? `${groupId}-error` : undefined;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {hint && <FieldHint id={hintId}>{hint}</FieldHint>}
      <RadixRadio.Root
        name={name}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        required={required}
        aria-describedby={[hintId, errorId].filter(Boolean).join(" ") || undefined}
        className="flex flex-col gap-2"
      >
        {options.map((opt) => {
          const optId = `${groupId}-${opt.value}`;
          const optLabelId = `${optId}-label`;
          return (
            <div key={opt.value} className="flex items-start gap-2.5">
              <RadixRadio.Item
                id={optId}
                value={opt.value}
                aria-labelledby={optLabelId}
                className={cn(
                  "mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border transition",
                  "border-line-strong bg-surface",
                  "data-[state=checked]:border-flame",
                )}
              >
                <RadixRadio.Indicator className="h-2 w-2 rounded-full bg-flame" />
              </RadixRadio.Item>
              <label id={optLabelId} htmlFor={optId} className="text-sm text-ink">
                {opt.label}
                {opt.description && (
                  <span className="mt-0.5 block text-xs text-ink-dim">{opt.description}</span>
                )}
              </label>
            </div>
          );
        })}
      </RadixRadio.Root>
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
