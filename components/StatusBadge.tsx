const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-sky-100 text-sky-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-rose-100 text-rose-700",
  ACTIVE: "bg-emerald-100 text-emerald-700",
  ARCHIVED: "bg-slate-100 text-slate-500",
  INACTIVE: "bg-slate-100 text-slate-500",
  PRESENT: "bg-emerald-100 text-emerald-700",
  ABSENT: "bg-rose-100 text-rose-700",
  LATE: "bg-amber-100 text-amber-700",
  EXCUSED: "bg-slate-100 text-slate-600",
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
  CHANGES_REQUESTED: "bg-sky-100 text-sky-700",
};

function label(status: string) {
  return status.replace(/_/g, " ");
}

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        STATUS_STYLES[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {label(status)}
    </span>
  );
}
