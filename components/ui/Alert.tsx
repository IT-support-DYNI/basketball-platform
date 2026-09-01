import type { ReactNode } from "react";

type Tone = "danger" | "warning" | "success" | "info";

const TONES: Record<Tone, string> = {
  danger: "border-danger/40 bg-danger/10 text-danger",
  warning: "border-warning/40 bg-warning/10 text-warning",
  success: "border-success/40 bg-success/10 text-success",
  info: "border-info/40 bg-info/10 text-info",
};

/** Inline status message. `role="alert"` for danger/warning so it's announced. */
export default function Alert({
  tone = "info",
  children,
  className = "",
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : undefined}
      className={`rounded-control border px-3 py-2.5 text-sm ${TONES[tone]} ${className}`}
    >
      {children}
    </div>
  );
}
