import { Session } from "next-auth";

import { computeAttendanceStats } from "./attendance";
import { prisma } from "./prisma";
import { rosterPlayerFilter } from "./roster";

/** Membership statuses that don't count towards a team's live roster size. */
const OFF_ROSTER = ["FORMER", "INACTIVE"] as const;

/*
 * Shared by app/api/dashboard/route.ts (for any future non-web client)
 * and the dashboard pages themselves (Server Components call this
 * directly rather than fetching their own API — see ARCHITECTURE.md's
 * lesson-learned about self-referential HTTP calls from the sibling
 * tournament-app project).
 */

export async function getAdminDashboard() {
  const [totalUsers, totalTeams, totalCoaches, totalPlayers, pendingRegistrations, teams, recentAnnouncements] =
    await Promise.all([
      prisma.user.count(),
      prisma.team.count(),
      prisma.coachProfile.count(),
      prisma.playerProfile.count(),
      prisma.playerProfile.count({ where: { registrationStatus: { not: "APPROVED" } } }),
      prisma.team.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { memberships: { where: { status: { notIn: [...OFF_ROSTER] } } } } } },
      }),
      prisma.announcement.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { author: { select: { name: true } } },
      }),
    ]);

  const activeTeams = teams.map((t) => ({ ...t, playerCount: t._count.memberships }));

  return {
    stats: { totalUsers, totalTeams, totalCoaches, totalPlayers, pendingRegistrations },
    activeTeams,
    recentAnnouncements,
  };
}

export async function getCoachDashboard(session: Session) {
  const teamIds = session.user.teamIds ?? [];
  const now = new Date();

  const [players, nextSession, recentAnnouncements, recentVideos, recentAttendance] = await Promise.all([
    prisma.playerProfile.findMany({
      where: rosterPlayerFilter(teamIds),
      include: {
        user: { select: { name: true } },
        evaluations: { orderBy: { periodStart: "desc" }, take: 1 },
      },
    }),
    prisma.trainingSession.findFirst({
      where: { teamId: { in: teamIds }, date: { gte: now }, status: "SCHEDULED" },
      orderBy: { date: "asc" },
      include: { team: { select: { name: true } } },
    }),
    prisma.announcement.findMany({
      where: { OR: [{ scope: "PLATFORM" }, { teamId: { in: teamIds } }] },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.video.findMany({
      where: { uploadedByUserId: Number(session.user.id) },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.attendanceRecord.findMany({
      where: { session: { teamId: { in: teamIds } } },
      orderBy: { recordedAt: "desc" },
      take: 200,
    }),
  ]);

  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const playersNeedingReview = players
    .filter((p) => !p.evaluations[0] || p.evaluations[0].periodStart < thirtyDaysAgo)
    .map((p) => ({ id: p.id, name: p.user.name }));

  return {
    numberOfPlayers: players.length,
    nextSession,
    attendanceSummary: computeAttendanceStats(recentAttendance),
    recentAnnouncements,
    recentVideos,
    playersNeedingReview,
  };
}

export async function getPlayerDashboard(session: Session) {
  const playerId = session.user.playerId;
  if (!playerId) {
    return {
      nextSession: null,
      attendance: null,
      weeklyEvaluation: null,
      monthlyEvaluation: null,
      monthlyTrend: [],
      latestVideo: null,
      latestFeedback: null,
      notifications: [],
    };
  }

  const now = new Date();
  const [nextSession, attendanceRecords, evaluations, latestVideo, latestFeedback, notifications] =
    await Promise.all([
      session.user.teamId
        ? prisma.trainingSession.findFirst({
            where: { teamId: session.user.teamId, date: { gte: now }, status: "SCHEDULED" },
            orderBy: { date: "asc" },
          })
        : null,
      prisma.attendanceRecord.findMany({ where: { playerId } }),
      prisma.performanceEvaluation.findMany({
        where: { playerId },
        include: { categoryScores: true },
        orderBy: { periodStart: "desc" },
        take: 12,
      }),
      prisma.videoAssignment.findFirst({
        where: { OR: [{ playerId }, { teamId: session.user.teamId ?? -1 }] },
        orderBy: { assignedAt: "desc" },
        include: { video: true },
      }),
      prisma.feedback.findFirst({
        where: { playerId },
        orderBy: { createdAt: "desc" },
        include: { coach: { include: { user: { select: { name: true } } } } },
      }),
      prisma.notification.findMany({
        where: { userId: Number(session.user.id) },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  return {
    nextSession,
    attendance: computeAttendanceStats(attendanceRecords),
    weeklyEvaluation: evaluations.find((e) => e.periodType === "WEEKLY") ?? null,
    monthlyEvaluation: evaluations.find((e) => e.periodType === "MONTHLY") ?? null,
    monthlyTrend: evaluations
      .filter((e) => e.periodType === "MONTHLY")
      .reverse()
      .map((e) => ({ periodStart: e.periodStart, overallScore: e.overallScore })),
    latestVideo: latestVideo?.video ?? null,
    latestFeedback,
    notifications,
  };
}
