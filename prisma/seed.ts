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

  await prisma.teamCoach.upsert({
    where: { teamId_coachProfileId: { teamId: team.id, coachProfileId: coachUser.coachProfile!.id } },
    update: {},
    create: { teamId: team.id, coachProfileId: coachUser.coachProfile!.id, isPrimary: true },
  });

  const player1 = await prisma.user.upsert({
    where: { email: "player1@example.com" },
    update: { emailVerifiedAt: new Date() },
    create: {
      email: "player1@example.com",
      emailVerifiedAt: new Date(),
      name: "Priya Player",
      role: "PLAYER",
      passwordHash,
      playerProfile: { create: { teamId: team.id, position: "PG", jerseyNumber: 7 } },
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
      playerProfile: { create: { teamId: team.id, position: "C", jerseyNumber: 21 } },
    },
    include: { playerProfile: true },
  });

  const session = await prisma.trainingSession.create({
    data: {
      teamId: team.id,
      title: "Tuesday Practice",
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      startTime: "18:00",
      endTime: "20:00",
      location: "Community Sports Centre",
      createdByCoachId: coachUser.coachProfile!.id,
    },
  });

  await prisma.attendanceRecord.createMany({
    data: [
      { sessionId: session.id, playerId: player1.playerProfile!.id, status: "PRESENT", recordedByCoachId: coachUser.coachProfile!.id },
      { sessionId: session.id, playerId: player2.playerProfile!.id, status: "LATE", recordedByCoachId: coachUser.coachProfile!.id },
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
