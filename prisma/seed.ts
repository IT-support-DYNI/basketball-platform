/*
 * Local dev data only — creates one Admin, one Coach with a team,
 * and two Players, all with password "password123" so you can log
 * in and click through every role immediately after `npm run prisma:migrate`.
 * Run with: npm run prisma:seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { emailVerifiedAt: new Date() },
    create: {
      email: "admin@example.com",
      emailVerifiedAt: new Date(),
      name: "Ada Admin",
      role: "ADMIN",
      passwordHash,
    },
  });

  const coachUser = await prisma.user.upsert({
    where: { email: "coach@example.com" },
    update: { emailVerifiedAt: new Date() },
    create: {
      email: "coach@example.com",
      emailVerifiedAt: new Date(),
      name: "Casey Coach",
      role: "COACH",
      passwordHash,
      coachProfile: { create: { phone: "555-0100" } },
    },
    include: { coachProfile: true },
  });

  let club = await prisma.club.findFirst({ where: { name: "DYNI Blazers" } });
  if (!club) {
    club = await prisma.club.create({
      data: { name: "DYNI Blazers", description: "Seeded club for local development.", minorAgeThreshold: 18 },
    });
  }

  const now = new Date();
  let season = await prisma.season.findFirst({ where: { clubId: club.id, isActive: true } });
  if (!season) {
    season = await prisma.season.create({
      data: {
        clubId: club.id,
        name: `${now.getFullYear()}–${now.getFullYear() + 1}`,
        startDate: now,
        endDate: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
        isActive: true,
      },
    });
  }

  let team = await prisma.team.findFirst({ where: { name: "Thunder U16" } });
  if (!team) {
    team = await prisma.team.create({
      data: {
        clubId: club.id,
        name: "Thunder U16",
        ageGroup: "U16",
        description: "Seeded sample team for local development.",
      },
    });
  }

  const player1 = await prisma.user.upsert({
    where: { email: "player1@example.com" },
    update: { emailVerifiedAt: new Date() },
    create: {
      email: "player1@example.com",
      emailVerifiedAt: new Date(),
      name: "Priya Player",
      role: "PLAYER",
      passwordHash,
      playerProfile: {
        create: { registrationTeamId: team.id, registrationPosition: "PG", registrationStatus: "APPROVED" },
      },
    },
    include: { playerProfile: true },
  });

  const player2 = await prisma.user.upsert({
    where: { email: "player2@example.com" },
    update: { emailVerifiedAt: new Date() },
    create: {
      email: "player2@example.com",
      emailVerifiedAt: new Date(),
      name: "Jordan Junior",
      role: "PLAYER",
      passwordHash,
      playerProfile: {
        create: { registrationTeamId: team.id, registrationPosition: "C", registrationStatus: "APPROVED" },
      },
    },
    include: { playerProfile: true },
  });

  // Season-scoped roster (W4 organisation model).
  for (const [p, jersey, pos] of [
    [player1.playerProfile!.id, 7, "PG"],
    [player2.playerProfile!.id, 21, "C"],
  ] as const) {
    await prisma.teamMembership.upsert({
      where: { playerProfileId_teamId_seasonId: { playerProfileId: p, teamId: team.id, seasonId: season.id } },
      update: { jerseyNumber: jersey, position: pos, status: "ACTIVE" },
      create: { playerProfileId: p, teamId: team.id, seasonId: season.id, jerseyNumber: jersey, position: pos, status: "ACTIVE" },
    });
  }
  await prisma.staffAssignment.upsert({
    where: { userId_teamId_role_seasonId: { userId: coachUser.id, teamId: team.id, role: "HEAD_COACH", seasonId: season.id } },
    update: {},
    create: { userId: coachUser.id, teamId: team.id, role: "HEAD_COACH", seasonId: season.id },
  });

  let venue = await prisma.venue.findFirst({ where: { clubId: club.id, name: "Community Sports Centre" } });
  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        clubId: club.id,
        name: "Community Sports Centre",
        address: "12 Riverside Way",
        checkInPin: "4827",
      },
    });
  }

  const day = 24 * 60 * 60 * 1000;
  const at = (offsetDays: number, hour: number, minute = 0) => {
    const d = new Date(Date.now() + offsetDays * day);
    d.setHours(hour, minute, 0, 0);
    return d;
  };

  // A weekly recurring training series — 8 occurrences materialised.
  const recurrence = await prisma.eventRecurrence.create({
    data: { frequency: "WEEKLY", interval: 1, byWeekday: [at(3, 18).getDay()], count: 8 },
  });
  const firstStart = at(3, 18);
  const trainingRows = Array.from({ length: 8 }, (_, i) => ({
    teamId: team.id,
    type: "TRAINING" as const,
    title: "Tuesday Practice",
    venueId: venue.id,
    startAt: new Date(firstStart.getTime() + i * 7 * day),
    endAt: new Date(firstStart.getTime() + i * 7 * day + 2 * 60 * 60 * 1000),
    createdByUserId: coachUser.id,
    recurrenceId: recurrence.id,
  }));
  await prisma.event.createMany({ data: trainingRows });
  const trainingEvent = (await prisma.event.findFirst({
    where: { recurrenceId: recurrence.id },
    orderBy: { startAt: "asc" },
  }))!;

  const matchEvent = await prisma.event.create({
    data: {
      teamId: team.id,
      type: "MATCH",
      title: "Friendly vs Riverside Hoops",
      venueId: venue.id,
      startAt: at(7, 15),
      endAt: at(7, 17),
      arrivalTime: at(7, 14),
      rsvpDeadline: at(5, 18),
      capacity: 12,
      dressCode: "Home whites",
      createdByUserId: coachUser.id,
    },
  });

  await prisma.availabilityResponse.createMany({
    data: [
      { eventId: matchEvent.id, userId: player1.id, response: "ATTENDING" },
      { eventId: matchEvent.id, userId: player2.id, response: "UNSURE", note: "Might have a lift issue" },
    ],
    skipDuplicates: true,
  });

  await prisma.event.create({
    data: {
      type: "REGISTRATION_DEADLINE",
      title: "Season registration closes",
      startAt: at(14, 23, 59),
      endAt: at(14, 23, 59),
      visibility: "CLUB",
      createdByUserId: admin.id,
    },
  });

  await prisma.attendanceRecord.createMany({
    data: [
      { eventId: trainingEvent.id, playerId: player1.playerProfile!.id, status: "PRESENT", recordedByCoachId: coachUser.coachProfile!.id },
      { eventId: trainingEvent.id, playerId: player2.playerProfile!.id, status: "LATE", recordedByCoachId: coachUser.coachProfile!.id },
    ],
    skipDuplicates: true,
  });

  await prisma.performanceEvaluation.create({
    data: {
      playerId: player1.playerProfile!.id,
      coachId: coachUser.coachProfile!.id,
      periodType: "WEEKLY",
      periodStart: new Date(),
      periodEnd: new Date(),
      overallScore: 7.5,
      categoryScores: {
        create: [
          { category: "SHOOTING", score: 8 },
          { category: "DEFENSE", score: 7 },
          { category: "PASSING", score: 8 },
          { category: "BALL_HANDLING", score: 7 },
          { category: "FITNESS", score: 7 },
          { category: "TEAMWORK", score: 8 },
          { category: "EFFORT", score: 8 },
          { category: "DISCIPLINE", score: 7 },
        ],
      },
    },
  });

  await prisma.announcement.create({
    data: {
      authorUserId: admin.id,
      scope: "PLATFORM",
      title: "Welcome to the platform",
      body: "This is a seeded platform-wide announcement.",
    },
  });

  console.log("Seeded:");
  console.log("  Admin  → admin@example.com / password123");
  console.log("  Coach  → coach@example.com / password123");
  console.log("  Player → player1@example.com / password123");
  console.log("  Player → player2@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
