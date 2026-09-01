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

  // A guardian account managing a minor child (registration still PENDING).
  const guardianUser = await prisma.user.upsert({
    where: { email: "guardian@example.com" },
    update: { emailVerifiedAt: new Date() },
    create: {
      email: "guardian@example.com",
      emailVerifiedAt: new Date(),
      name: "Gina Guardian",
      role: "GUARDIAN",
      passwordHash,
    },
  });
  const childUser = await prisma.user.upsert({
    where: { email: "child@example.com" },
    update: {},
    create: {
      email: "child@example.com",
      emailVerifiedAt: new Date(),
      name: "Kit Guardian",
      role: "PLAYER",
      passwordHash,
      mustChangePassword: true,
      playerProfile: {
        create: {
          registrationTeamId: team.id,
          registrationPosition: "SG",
          dateOfBirth: new Date("2013-06-20"),
          guardianName: "Gina Guardian",
          registrationStatus: "PENDING",
          registrationSubmittedAt: new Date(),
        },
      },
    },
    include: { playerProfile: true },
  });
  // Jordan Junior is a minor on the senior roster; Gina Guardian is their
  // parent, so messaging safeguarding (W7) auto-includes her in any conversation
  // Jordan is in.
  await prisma.playerProfile.update({
    where: { id: player2.playerProfile!.id },
    data: { dateOfBirth: new Date("2010-11-02") },
  });
  await prisma.guardianRelationship.upsert({
    where: { guardianUserId_playerProfileId: { guardianUserId: guardianUser.id, playerProfileId: player2.playerProfile!.id } },
    update: {},
    create: {
      guardianUserId: guardianUser.id,
      playerProfileId: player2.playerProfile!.id,
      relationshipLabel: "Parent",
    },
  });
  await prisma.guardianRelationship.upsert({
    where: { guardianUserId_playerProfileId: { guardianUserId: guardianUser.id, playerProfileId: childUser.playerProfile!.id } },
    update: {},
    create: {
      guardianUserId: guardianUser.id,
      playerProfileId: childUser.playerProfile!.id,
      relationshipLabel: "Parent",
    },
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

  // A welfare officer for the team (a COACH-role account assigned WELFARE_OFFICER),
  // so the field-visibility engine has someone to test against.
  const welfareUser = await prisma.user.upsert({
    where: { email: "welfare@example.com" },
    update: { emailVerifiedAt: new Date() },
    create: {
      email: "welfare@example.com",
      emailVerifiedAt: new Date(),
      name: "Wendy Welfare",
      role: "COACH",
      passwordHash,
      coachProfile: { create: {} },
    },
  });
  await prisma.staffAssignment.upsert({
    where: { userId_teamId_role_seasonId: { userId: welfareUser.id, teamId: team.id, role: "WELFARE_OFFICER", seasonId: season.id } },
    update: {},
    create: { userId: welfareUser.id, teamId: team.id, role: "WELFARE_OFFICER", seasonId: season.id },
  });

  // Fill in a few field-visibility-sensitive details on player 1.
  await prisma.playerProfile.update({
    where: { id: player1.playerProfile!.id },
    data: {
      dateOfBirth: new Date("2011-03-14"),
      contactPhone: "07700 900123",
      address: "8 Baseline Avenue, Riverside",
      nationality: "GB",
      heightCm: 172,
      preferredHand: "RIGHT",
      bio: "Point guard. Lives for the fast break.",
      emergencyContactName: "Anita Player",
      emergencyContactPhone: "07700 900999",
      emergencyContactRelation: "Mother",
      guardianName: "Anita Player",
      guardianContact: "07700 900999",
      medicalNotes: "Mild asthma — blue inhaler in kit bag.",
      welfareNotes: "Prefers not to be dropped off alone after evening sessions.",
    },
  });

  // Consent documents. player1 accepts both; player2 accepts only the code of
  // conduct, so signing in as player2 shows the blocking consent gate.
  const consentSeed = [
    {
      type: "CODE_OF_CONDUCT" as const,
      title: "Player code of conduct",
      body:
        "As a member of DYNI Blazers you agree to:\n\n" +
        "• Treat teammates, coaches, officials and opponents with respect.\n" +
        "• Arrive on time and ready for training and matches.\n" +
        "• Represent the club positively on and off the court.\n" +
        "• Tell a coach or the welfare officer straight away if something isn't right.",
    },
    {
      type: "MEDIA_CONSENT" as const,
      title: "Photography & media consent",
      body:
        "The club sometimes takes photos and short videos at training and matches for the " +
        "team channel, the club website and social media.\n\n" +
        "By accepting you agree that images of you (or your child) may be used for those purposes. " +
        "You can withdraw this at any time by contacting the club administrator.",
    },
  ];
  const consentVersionByType: Record<string, number> = {};
  for (const c of consentSeed) {
    const existing = await prisma.consentDocument.findFirst({ where: { clubId: club.id, type: c.type } });
    const doc =
      existing ??
      (await prisma.consentDocument.create({
        data: {
          clubId: club.id,
          type: c.type,
          title: c.title,
          versions: { create: { version: 1, body: c.body } },
        },
      }));
    const v = await prisma.consentDocumentVersion.findFirst({
      where: { documentId: doc.id },
      orderBy: { version: "desc" },
    });
    consentVersionByType[c.type] = v!.id;
  }
  await prisma.consentRecord.createMany({
    data: [
      { documentVersionId: consentVersionByType.CODE_OF_CONDUCT, playerProfileId: player1.playerProfile!.id, acceptedByUserId: player1.id },
      { documentVersionId: consentVersionByType.MEDIA_CONSENT, playerProfileId: player1.playerProfile!.id, acceptedByUserId: player1.id },
      { documentVersionId: consentVersionByType.CODE_OF_CONDUCT, playerProfileId: player2.playerProfile!.id, acceptedByUserId: player2.id },
    ],
    skipDuplicates: true,
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
      {
        eventId: trainingEvent.id,
        playerId: player1.playerProfile!.id,
        status: "PRESENT",
        method: "PIN",
        checkInAt: new Date(trainingEvent.startAt.getTime() - 4 * 60_000),
      },
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

  if ((await prisma.announcement.count()) === 0) {
    await prisma.announcement.createMany({
      data: [
        {
          authorUserId: admin.id,
          scope: "PLATFORM",
          title: "Welcome to the DYNI Blazers platform",
          body: "This is where the club and your coaches post notices. Check back regularly.",
        },
        {
          authorUserId: admin.id,
          scope: "PLATFORM",
          title: "Updated safeguarding policy — please confirm you've read it",
          body:
            "We've refreshed the club's safeguarding policy for the new season. Every member and guardian " +
            "needs to confirm they've read it. Full document on the club noticeboard and website.",
          requiresAck: true,
          pinnedUntil: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
        },
        {
          authorUserId: coachUser.id,
          scope: "TEAM",
          teamId: team.id,
          title: "Kit collection this Saturday",
          body: "New home shirts are in. Pick yours up from the coaches' table before Saturday's session.",
        },
      ],
    });
  }

  if ((await prisma.conversation.count()) === 0) {
    const channel = await prisma.conversation.create({
      data: {
        type: "TEAM",
        teamId: team.id,
        createdByUserId: coachUser.id,
        safeguarded: true,
        participants: {
          create: [
            { userId: coachUser.id, role: "admin" },
            { userId: player1.id },
            { userId: player2.id },
          ],
        },
      },
    });
    await prisma.message.createMany({
      data: [
        { conversationId: channel.id, authorUserId: coachUser.id, body: "Welcome to the team channel. Session times and any last-minute changes go here." },
        { conversationId: channel.id, authorUserId: player1.id, body: "Thanks coach — see everyone Saturday." },
      ],
    });
    await prisma.conversation.update({
      where: { id: channel.id },
      data: { lastMessageAt: new Date() },
    });
  }

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
