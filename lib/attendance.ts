import { AttendanceStatus } from "@prisma/client";

/*
 * Attendance % rule (ARCHITECTURE.md §6.2): Present and Late count as
 * attended; Absent counts against; Excused is dropped from both the
 * numerator and the denominator, so an excused absence neither helps
 * nor hurts the percentage. Lives here as the single source of truth
 * so every screen/endpoint that shows an attendance % agrees.
 */
export interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
  excused: number;
  /** Sessions counted toward the percentage (present + absent + late). */
  countedSessions: number;
  /** 0-100, rounded to the nearest whole percent. null if there's nothing to count yet. */
  percentage: number | null;
}

export function computeAttendanceStats(
  records: { status: AttendanceStatus }[]
): AttendanceStats {
  const stats = { present: 0, absent: 0, late: 0, excused: 0 };

  for (const record of records) {
    if (record.status === "PRESENT") stats.present += 1;
    else if (record.status === "ABSENT") stats.absent += 1;
    else if (record.status === "LATE") stats.late += 1;
    else if (record.status === "EXCUSED") stats.excused += 1;
  }

  const countedSessions = stats.present + stats.absent + stats.late;
  const attended = stats.present + stats.late;

  return {
    ...stats,
    countedSessions,
    percentage: countedSessions === 0 ? null : Math.round((attended / countedSessions) * 100),
  };
}
