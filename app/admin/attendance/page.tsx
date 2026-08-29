import { prisma } from "@/lib/prisma";
import AttendanceReport from "@/components/reports/AttendanceReport";

export default async function AdminAttendancePage() {
  const teams = await prisma.team.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <main className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink">Attendance</h1>
        <p className="mt-1 text-ink-dim">Per-player rates by team over a date range (view-only — coaches mark attendance).</p>
      </div>

      <section className="rounded-card border border-line bg-surface p-5">
        <AttendanceReport teams={teams} />
      </section>
    </main>
  );
}
