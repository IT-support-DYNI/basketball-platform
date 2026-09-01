/*
 * DYNI Blazers development seed — a full, realistic dataset for the Phase 1
 * checkpoint: two teams across an archived and an active season, staff in every
 * safeguarding role, ~16 players (adults + minors with guardians), a term of
 * training and matches with attendance history, RSVPs, evaluations, feedback,
 * videos, announcements, team chat, notifications and an audit trail.
 *
 * Deterministic and destructive: it clears the domain tables and rebuilds from
 * scratch, exactly like `prisma migrate reset` does. Run with
 * `npm run prisma:seed` (or automatically via `prisma migrate reset`).
 * Row ids change on every run, so sign out and back in afterwards — a stale
 * session's cached teamId/playerId will point at rows that no longer exist.
 *
 * The four canonical logins are stable — password "password123":
 *   admin@example.com · coach@example.com · player1@example.com · guardian@example.com
 */
import { PrismaClient, type PlayerPosition, type StaffRole, type PerformanceCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DAY = 24 * 60 * 60 * 1000;
/** A fixed "now" so re-seeding is stable within a day. */
const NOW = new Date();
const daysFromNow = (d: number, hour = 18, minute = 0) => {
  const date = new Date(NOW.getTime() + d * DAY);
  date.setHours(hour, minute, 0, 0);
  return date;
};
const yearsAgo = (y: number, month = 0, dayOfMonth = 1) =>
  new Date(NOW.getFullYear() - y, month, dayOfMonth);

async function wipe() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run the seed with NODE_ENV=production.");
  }
  // Child-to-parent order so foreign keys never block a delete.
  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.conversationParticipant.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.notificationPreference.deleteMany(),
    prisma.pushSubscription.deleteMany(),
    prisma.announcementAck.deleteMany(),
    prisma.announcement.deleteMany(),
    prisma.attendanceAudit.deleteMany(),
    prisma.attendanceRecord.deleteMany(),
    prisma.qrCheckInToken.deleteMany(),
    prisma.availabilityResponse.deleteMany(),
    prisma.feedback.deleteMany(),
    prisma.performanceCategoryScore.deleteMany(),
    prisma.performanceEvaluation.deleteMany(),
    prisma.videoAssignment.deleteMany(),
    prisma.video.deleteMany(),
    prisma.eventRecurrence.deleteMany(),
    prisma.trainingBlock.deleteMany(),
    prisma.trainingPlan.deleteMany(),
    prisma.drill.deleteMany(),
    prisma.consentRecord.deleteMany(),
    prisma.consentDocumentVersion.deleteMany(),
    prisma.consentDocument.deleteMany(),
    prisma.guardianRelationship.deleteMany(),
    prisma.registrationDraft.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.teamMembership.deleteMany(),
    prisma.squad.deleteMany(),
    prisma.staffAssignment.deleteMany(),
    prisma.authSession.deleteMany(),
    prisma.authToken.deleteMany(),
    prisma.loginAttempt.deleteMany(),
    prisma.userMfa.deleteMany(),
    prisma.venue.deleteMany(),
    prisma.event.deleteMany(),
    prisma.clubSafeguardingPolicy.deleteMany(),
    prisma.playerProfile.deleteMany(),
    prisma.coachProfile.deleteMany(),
    prisma.team.deleteMany(),
    prisma.season.deleteMany(),
    prisma.club.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

async function main() {
  await wipe();
  const passwordHash = await bcrypt.hash("password123", 12);
  const mkUser = (email: string, name: string, role: "ADMIN" | "COACH" | "PLAYER" | "GUARDIAN") =>
    prisma.user.create({ data: { email, name, role, passwordHash, emailVerifiedAt: NOW } });

  /* ── Club, seasons, venues ─────────────────────────────────────────── */
  const club = await prisma.club.create({
    data: { name: "DYNI Blazers", description: "Community basketball club.", minorAgeThreshold: 18 },
  });

  const lastSeason = await prisma.season.create({
    data: {
      clubId: club.id,
      name: `${NOW.getFullYear() - 1}–${NOW.getFullYear()}`,
      startDate: yearsAgo(1, 8, 1),
      endDate: daysFromNow(-30),
      isActive: false,
    },
  });
  const season = await prisma.season.create({
    data: {
      clubId: club.id,
      name: `${NOW.getFullYear()}–${NOW.getFullYear() + 1}`,
      startDate: daysFromNow(-28),
      endDate: daysFromNow(300),
      isActive: true,
    },
  });

  const homeCourt = await prisma.venue.create({
    data: {
      clubId: club.id,
      name: "Riverside Sports Centre",
      address: "12 Riverside Way, Riverside",
      mapLat: 51.4545,
      mapLng: -2.5879,
      checkInPin: "4827",
      notes: "Court 2. Park in the rear lot after 6pm.",
    },
  });
  const schoolGym = await prisma.venue.create({
    data: {
      clubId: club.id,
      name: "St. Mark's School Gym",
      address: "College Road, Northgate",
      checkInPin: "1590",
    },
  });

  /* ── People: staff ─────────────────────────────────────────────────── */
  const admin = await mkUser("admin@example.com", "Ada Adeyemi", "ADMIN");

  const headCoach = await prisma.user.create({
    data: {
      email: "coach@example.com",
      name: "Casey Coombs",
      role: "COACH",
      passwordHash,
      emailVerifiedAt: NOW,
      coachProfile: { create: { phone: "07700 900100", bio: "Head coach, 12 years courtside." } },
    },
    include: { coachProfile: true },
  });
  const assistantCoach = await prisma.user.create({
    data: {
      email: "assistant@example.com",
      name: "Dev Anand",
      role: "COACH",
      passwordHash,
      emailVerifiedAt: NOW,
      coachProfile: { create: { phone: "07700 900101" } },
    },
    include: { coachProfile: true },
  });
  const welfare = await prisma.user.create({
    data: {
      email: "welfare@example.com",
      name: "Wendy Whitlock",
      role: "COACH",
      passwordHash,
      emailVerifiedAt: NOW,
      coachProfile: { create: { bio: "Club welfare officer." } },
    },
    include: { coachProfile: true },
  });
  const medical = await prisma.user.create({
    data: {
      email: "medical@example.com",
      name: "Dr. Miriam Osei",
      role: "COACH",
      passwordHash,
      emailVerifiedAt: NOW,
      coachProfile: { create: { bio: "Team physio & medical officer." } },
    },
    include: { coachProfile: true },
  });

  /* ── Teams & squads ────────────────────────────────────────────────── */
  const u16 = await prisma.team.create({
    data: { clubId: club.id, name: "Blazers U16", ageGroup: "U16", description: "Junior development squad." },
  });
  const seniors = await prisma.team.create({
    data: { clubId: club.id, name: "Blazers Seniors", ageGroup: "Senior", description: "Senior competitive team." },
  });
  const u16Starters = await prisma.squad.create({
    data: { teamId: u16.id, seasonId: season.id, name: "Starting five", ageGroup: "U16" },
  });
  const u16Dev = await prisma.squad.create({
    data: { teamId: u16.id, seasonId: season.id, name: "Development", ageGroup: "U16" },
  });

  const staff: [number, number, StaffRole][] = [
    [headCoach.id, u16.id, "HEAD_COACH"],
    [headCoach.id, seniors.id, "HEAD_COACH"],
    [assistantCoach.id, u16.id, "ASSISTANT_COACH"],
    [welfare.id, u16.id, "WELFARE_OFFICER"],
    [welfare.id, seniors.id, "WELFARE_OFFICER"],
    [medical.id, u16.id, "MEDICAL_OFFICER"],
    [medical.id, seniors.id, "MEDICAL_OFFICER"],
  ];
  for (const [userId, teamId, role] of staff) {
    await prisma.staffAssignment.create({ data: { userId, teamId, role, seasonId: season.id } });
  }

  /* ── Players ───────────────────────────────────────────────────────── */
  type PlayerSpec = {
    email: string;
    name: string;
    team: number;
    squad?: number;
    pos: PlayerPosition;
    jersey: number;
    bornYearsAgo: number;
    status?: "ACTIVE" | "INJURED" | "TRIALIST";
    medicalNotes?: string;
    welfareNotes?: string;
    login?: boolean; // keep a stable password login for click-through
  };

  const u16Players: PlayerSpec[] = [
    { email: "player1@example.com", name: "Priya Patel", team: u16.id, squad: u16Starters.id, pos: "PG", jersey: 7, bornYearsAgo: 15, medicalNotes: "Mild asthma — blue inhaler in kit bag.", welfareNotes: "Not to be dropped off alone after evening sessions.", login: true },
    { email: "player2@example.com", name: "Jordan Junior", team: u16.id, squad: u16Starters.id, pos: "C", jersey: 21, bornYearsAgo: 15, login: true },
    { email: "amara.k@example.com", name: "Amara Kone", team: u16.id, squad: u16Starters.id, pos: "SG", jersey: 5, bornYearsAgo: 16 },
    { email: "tomas.r@example.com", name: "Tomás Rivera", team: u16.id, squad: u16Starters.id, pos: "SF", jersey: 11, bornYearsAgo: 16 },
    { email: "kai.n@example.com", name: "Kai Nakamura", team: u16.id, squad: u16Starters.id, pos: "PF", jersey: 33, bornYearsAgo: 15, status: "INJURED", medicalNotes: "Left ankle sprain — return-to-play mid-season." },
    { email: "leah.b@example.com", name: "Leah Brennan", team: u16.id, squad: u16Dev.id, pos: "PG", jersey: 3, bornYearsAgo: 14 },
    { email: "sam.o@example.com", name: "Sam Okafor", team: u16.id, squad: u16Dev.id, pos: "SG", jersey: 9, bornYearsAgo: 14 },
    { email: "noah.f@example.com", name: "Noah Fischer", team: u16.id, squad: u16Dev.id, pos: "C", jersey: 44, bornYearsAgo: 15, status: "TRIALIST" },
  ];
  const seniorPlayers: PlayerSpec[] = [
    { email: "marcus.t@example.com", name: "Marcus Thompson", team: seniors.id, pos: "PG", jersey: 4, bornYearsAgo: 24, login: true },
    { email: "elena.v@example.com", name: "Elena Volkov", team: seniors.id, pos: "SG", jersey: 8, bornYearsAgo: 22 },
    { email: "dwayne.h@example.com", name: "Dwayne Harris", team: seniors.id, pos: "SF", jersey: 23, bornYearsAgo: 27 },
    { email: "olu.a@example.com", name: "Olu Ademola", team: seniors.id, pos: "PF", jersey: 15, bornYearsAgo: 25 },
    { email: "ben.c@example.com", name: "Ben Carter", team: seniors.id, pos: "C", jersey: 50, bornYearsAgo: 29, welfareNotes: "Shift worker — availability varies week to week." },
    { email: "yuki.t@example.com", name: "Yuki Tanaka", team: seniors.id, pos: "SG", jersey: 12, bornYearsAgo: 23 },
  ];

  const players: Record<string, { userId: number; profileId: number; spec: PlayerSpec }> = {};
  for (const spec of [...u16Players, ...seniorPlayers]) {
    const user = await prisma.user.create({
      data: {
        email: spec.email,
        name: spec.name,
        role: "PLAYER",
        passwordHash,
        emailVerifiedAt: NOW,
        playerProfile: {
          create: {
            dateOfBirth: yearsAgo(spec.bornYearsAgo, 4, 12),
            nationality: "GB",
            heightCm: 160 + ((spec.jersey * 7) % 35),
            preferredHand: spec.jersey % 4 === 0 ? "LEFT" : "RIGHT",
            registrationTeamId: spec.team,
            registrationPosition: spec.pos,
            registrationStatus: "APPROVED",
            registrationSubmittedAt: daysFromNow(-40),
            registrationReviewedAt: daysFromNow(-38),
            registrationReviewedByUserId: admin.id,
            consentAcceptedAt: daysFromNow(-38),
            emergencyContactName: `${spec.name.split(" ")[1]} household`,
            emergencyContactPhone: "07700 900500",
            emergencyContactRelation: spec.bornYearsAgo < 18 ? "Parent" : "Partner",
            medicalNotes: spec.medicalNotes,
            welfareNotes: spec.welfareNotes,
          },
        },
      },
      include: { playerProfile: true },
    });
    players[spec.email] = { userId: user.id, profileId: user.playerProfile!.id, spec };

    await prisma.teamMembership.create({
      data: {
        playerProfileId: user.playerProfile!.id,
        teamId: spec.team,
        seasonId: season.id,
        squadId: spec.squad,
        jerseyNumber: spec.jersey,
        position: spec.pos,
        status: spec.status ?? "ACTIVE",
      },
    });
    // A prior-season membership for the returning seniors, for roster history.
    if (spec.team === seniors.id && spec.bornYearsAgo > 24) {
      await prisma.teamMembership.create({
        data: {
          playerProfileId: user.playerProfile!.id,
          teamId: seniors.id,
          seasonId: lastSeason.id,
          jerseyNumber: spec.jersey,
          position: spec.pos,
          status: "FORMER",
        },
      });
    }
  }

  /* ── Guardians of the minors ───────────────────────────────────────── */
  const guardianSpecs: { email: string; name: string; children: string[]; label: string }[] = [
    { email: "guardian@example.com", name: "Gina Guardian", children: ["player2@example.com", "amara.k@example.com"], label: "Parent" },
    { email: "raj.patel@example.com", name: "Raj Patel", children: ["player1@example.com"], label: "Parent" },
    { email: "m.rivera@example.com", name: "Maria Rivera", children: ["tomas.r@example.com"], label: "Parent" },
    { email: "h.nakamura@example.com", name: "Haruki Nakamura", children: ["kai.n@example.com"], label: "Parent" },
    { email: "c.brennan@example.com", name: "Ciara Brennan", children: ["leah.b@example.com", "sam.o@example.com"], label: "Guardian" },
  ];
  for (const g of guardianSpecs) {
    const gUser = await mkUser(g.email, g.name, "GUARDIAN");
    for (const childEmail of g.children) {
      await prisma.guardianRelationship.create({
        data: {
          guardianUserId: gUser.id,
          playerProfileId: players[childEmail].profileId,
          relationshipLabel: g.label,
        },
      });
    }
  }

  /* ── Registrations awaiting a decision (the admin approval queue) ───── */
  const pendingChild = await prisma.user.create({
    data: {
      email: "new.child@guardian.local",
      name: "Ellie Fournier",
      role: "PLAYER",
      passwordHash,
      mustChangePassword: true,
      playerProfile: {
        create: {
          dateOfBirth: yearsAgo(13, 6, 20),
          registrationTeamId: u16.id,
          registrationPosition: "SG",
          registrationStatus: "PENDING",
          registrationSubmittedAt: daysFromNow(-2),
          guardianName: "Paul Fournier",
        },
      },
    },
    include: { playerProfile: true },
  });
  const pendingGuardian = await mkUser("p.fournier@example.com", "Paul Fournier", "GUARDIAN");
  await prisma.guardianRelationship.create({
    data: { guardianUserId: pendingGuardian.id, playerProfileId: pendingChild.playerProfile!.id, relationshipLabel: "Parent" },
  });

  await prisma.user.create({
    data: {
      email: "adult.applicant@example.com",
      name: "Grace Mbeki",
      role: "PLAYER",
      passwordHash,
      emailVerifiedAt: NOW,
      playerProfile: {
        create: {
          dateOfBirth: yearsAgo(26, 2, 3),
          registrationTeamId: seniors.id,
          registrationPosition: "SF",
          registrationStatus: "PENDING",
          registrationSubmittedAt: daysFromNow(-1),
        },
      },
    },
  });
  await prisma.user.create({
    data: {
      email: "changes.requested@example.com",
      name: "Liam Doyle",
      role: "PLAYER",
      passwordHash,
      emailVerifiedAt: NOW,
      playerProfile: {
        create: {
          dateOfBirth: yearsAgo(22, 9, 9),
          registrationTeamId: seniors.id,
          registrationPosition: "PG",
          registrationStatus: "CHANGES_REQUESTED",
          registrationSubmittedAt: daysFromNow(-6),
          registrationReviewedAt: daysFromNow(-4),
          registrationReviewedByUserId: admin.id,
          registrationReviewNote: "Please add an emergency contact and confirm your date of birth.",
        },
      },
    },
  });

  /* ── Consent documents ─────────────────────────────────────────────── */
  const consentDocs = [
    { type: "CODE_OF_CONDUCT" as const, title: "Player code of conduct", body: "As a member of DYNI Blazers you agree to treat teammates, coaches, officials and opponents with respect; to arrive on time and ready; to represent the club positively; and to speak to a coach or the welfare officer straight away if something isn't right." },
    { type: "MEDIA_CONSENT" as const, title: "Photography & media consent", body: "The club sometimes takes photos and short videos at training and matches for the team channel, the club website and social media. By accepting you agree images of you (or your child) may be used for those purposes. You can withdraw this at any time by contacting the club administrator." },
    { type: "MEDICAL_CONSENT" as const, title: "Emergency treatment consent", body: "In the event of injury or illness where you (or your child's named contacts) cannot be reached, you authorise club staff to arrange emergency first aid or medical treatment as advised by a qualified professional." },
    { type: "PRIVACY_NOTICE" as const, title: "Privacy notice", body: "We hold the personal data you provide to run the club: contact details, dates of birth, emergency contacts and, where relevant, medical and welfare information. Access is limited by role. We keep it only as long as needed and never sell it. Full notice on the club website." },
  ];
  const consentVersionId: Record<string, number> = {};
  for (const d of consentDocs) {
    const doc = await prisma.consentDocument.create({
      data: {
        clubId: club.id,
        type: d.type,
        title: d.title,
        versions: { create: { version: 1, body: d.body, publishedAt: daysFromNow(-45) } },
      },
      include: { versions: true },
    });
    consentVersionId[d.type] = doc.versions[0].id;
  }
  // Everyone approved accepts everything, except two U16 players who still
  // owe the media consent (so the guardian dashboard has an outstanding item).
  // These two also have a seeded RSVP, so `leah.b` / `noah.f` stay fully
  // cleared for the schedule-RSVP E2E journey.
  const owesMedia = new Set(["amara.k@example.com", "tomas.r@example.com"]);
  for (const [email, p] of Object.entries(players)) {
    for (const type of Object.keys(consentVersionId)) {
      if (type === "MEDIA_CONSENT" && owesMedia.has(email)) continue;
      await prisma.consentRecord.create({
        data: {
          documentVersionId: consentVersionId[type],
          playerProfileId: p.profileId,
          acceptedByUserId: p.userId,
          byGuardian: p.spec.bornYearsAgo < 18,
          acceptedAt: daysFromNow(-37),
        },
      });
    }
  }

  /* ── Schedule: recurring training + matches ────────────────────────── */
  const coachId = headCoach.coachProfile!.id;
  const assistantId = assistantCoach.coachProfile!.id;

  async function weeklySeries(team: { id: number }, weekday: number, hour: number, title: string, venueId: number) {
    const rec = await prisma.eventRecurrence.create({
      data: { frequency: "WEEKLY", interval: 1, byWeekday: [weekday], count: 16 },
    });
    // 6 past occurrences + 10 future, one per week, anchored to `weekday`.
    const anchor = daysFromNow(-42, hour);
    anchor.setDate(anchor.getDate() + ((weekday - anchor.getDay() + 7) % 7));
    const rows = Array.from({ length: 16 }, (_, i) => {
      const start = new Date(anchor.getTime() + i * 7 * DAY);
      return {
        teamId: team.id,
        type: "TRAINING" as const,
        title,
        venueId,
        startAt: start,
        endAt: new Date(start.getTime() + 90 * 60_000),
        arrivalTime: new Date(start.getTime() - 15 * 60_000),
        createdByUserId: headCoach.id,
        recurrenceId: rec.id,
        status: start < NOW ? ("COMPLETED" as const) : ("SCHEDULED" as const),
      };
    });
    await prisma.event.createMany({ data: rows });
    return prisma.event.findMany({ where: { recurrenceId: rec.id }, orderBy: { startAt: "asc" } });
  }

  const u16Training = await weeklySeries(u16, 2 /* Tue */, 18, "U16 Practice", homeCourt.id);
  const seniorTraining = await weeklySeries(seniors, 4 /* Thu */, 20, "Seniors Practice", homeCourt.id);

  const u16Match = await prisma.event.create({
    data: {
      teamId: u16.id,
      type: "MATCH",
      title: "U16 League — vs Northgate Falcons",
      venueId: schoolGym.id,
      startAt: daysFromNow(6, 10),
      endAt: daysFromNow(6, 12),
      arrivalTime: daysFromNow(6, 9),
      rsvpDeadline: daysFromNow(4, 18),
      capacity: 12,
      dressCode: "Home whites",
      createdByUserId: headCoach.id,
    },
  });
  const seniorMatchPast = await prisma.event.create({
    data: {
      teamId: seniors.id,
      type: "MATCH",
      title: "Seniors League — vs Riverside Hoops",
      venueId: homeCourt.id,
      startAt: daysFromNow(-9, 19),
      endAt: daysFromNow(-9, 21),
      status: "COMPLETED",
      createdByUserId: headCoach.id,
    },
  });
  void seniorMatchPast;
  const seniorMatchFuture = await prisma.event.create({
    data: {
      teamId: seniors.id,
      type: "MATCH",
      title: "Seniors League — vs Eastside Kings",
      venueId: schoolGym.id,
      startAt: daysFromNow(11, 19),
      endAt: daysFromNow(11, 21),
      rsvpDeadline: daysFromNow(9, 18),
      capacity: 10,
      createdByUserId: headCoach.id,
    },
  });
  await prisma.event.create({
    data: {
      type: "REGISTRATION_DEADLINE",
      title: "Winter registration closes",
      startAt: daysFromNow(21, 23, 59),
      endAt: daysFromNow(21, 23, 59),
      visibility: "CLUB",
      createdByUserId: admin.id,
    },
  });
  await prisma.event.create({
    data: {
      teamId: u16.id,
      type: "SOCIAL",
      title: "End-of-term team pizza night",
      startAt: daysFromNow(18, 18),
      endAt: daysFromNow(18, 20),
      locationText: "Tony's Pizzeria, Riverside",
      createdByUserId: assistantCoach.id,
    },
  });

  /* ── RSVPs to the upcoming matches ─────────────────────────────────── */
  const u16Roster = u16Players.map((p) => players[p.email]);
  const seniorRoster = seniorPlayers.map((p) => players[p.email]);
  for (const [i, p] of u16Roster.entries()) {
    if (i >= 5) break; // leah.b / sam.o / noah.f haven't responded yet
    await prisma.availabilityResponse.create({
      data: {
        eventId: u16Match.id,
        userId: p.userId,
        response: i === 4 ? "NOT_ATTENDING" : i === 3 ? "UNSURE" : "ATTENDING",
        note: i === 4 ? "Away at a family event" : undefined,
      },
    });
  }
  for (const [i, p] of seniorRoster.entries()) {
    await prisma.availabilityResponse.create({
      data: { eventId: seniorMatchFuture.id, userId: p.userId, response: i % 4 === 0 ? "UNSURE" : "ATTENDING" },
    });
  }

  /* ── Attendance history over the past training sessions ────────────── */
  async function seedAttendance(events: { id: number; startAt: Date; status: string }[], roster: typeof u16Roster) {
    for (const ev of events.filter((e) => e.startAt < NOW)) {
      for (const [i, p] of roster.entries()) {
        // Deterministic spread: ~75% present, ~10% late, ~8% absent, ~7% excused.
        const r = (i * 3 + Math.round(ev.startAt.getTime() / DAY)) % 13;
        const status = r < 9 ? "PRESENT" : r < 10 ? "LATE" : r < 11 ? "EXCUSED" : "ABSENT";
        const self = status === "PRESENT" && r % 2 === 0;
        await prisma.attendanceRecord.create({
          data: {
            eventId: ev.id,
            playerId: p.profileId,
            status: status as "PRESENT" | "LATE" | "EXCUSED" | "ABSENT",
            method: status === "ABSENT" ? "COACH" : self ? (r % 4 === 0 ? "QR" : "PIN") : "COACH",
            checkInAt:
              status === "ABSENT"
                ? null
                : status === "LATE"
                  ? new Date(ev.startAt.getTime() + 12 * 60_000)
                  : new Date(ev.startAt.getTime() - 5 * 60_000),
            recordedByCoachId: self ? null : coachId,
            verifiedByCoachId: self && r % 3 === 0 ? coachId : null,
            verifiedAt: self && r % 3 === 0 ? new Date(ev.startAt.getTime() + 30 * 60_000) : null,
          },
        });
      }
    }
  }
  await seedAttendance(u16Training, u16Roster);
  await seedAttendance(seniorTraining, seniorRoster);

  // One corrected record with an audit trail, for the corrections view.
  const aRecord = await prisma.attendanceRecord.findFirst({
    where: { playerId: u16Roster[0].profileId, status: "PRESENT" },
    orderBy: { id: "asc" },
  });
  if (aRecord) {
    await prisma.attendanceRecord.update({ where: { id: aRecord.id }, data: { status: "LATE" } });
    await prisma.attendanceAudit.create({
      data: {
        recordId: aRecord.id,
        changedByUserId: headCoach.id,
        before: { status: "PRESENT" },
        after: { status: "LATE" },
        reason: "Arrived 15 minutes after warm-up start.",
      },
    });
  }

  /* ── Performance evaluations with a monthly trend ──────────────────── */
  const CATS: [PerformanceCategory, number][] = [
    ["SHOOTING", 7], ["DEFENSE", 6], ["PASSING", 8], ["BALL_HANDLING", 7],
    ["FITNESS", 7], ["TEAMWORK", 8], ["EFFORT", 9], ["DISCIPLINE", 7],
  ];
  async function evaluate(profileId: number, monthsBack: number, bump: number, period: "WEEKLY" | "MONTHLY") {
    const scores = CATS.map(([category, base]) => ({
      category,
      score: Math.max(1, Math.min(10, base + bump + ((profileId + category.length) % 2))),
    }));
    const overall = scores.reduce((s, c) => s + c.score, 0) / scores.length;
    await prisma.performanceEvaluation.create({
      data: {
        playerId: profileId,
        coachId,
        periodType: period,
        periodStart: daysFromNow(-monthsBack * 30),
        periodEnd: daysFromNow(-monthsBack * 30 + 6),
        overallScore: Math.round(overall * 10) / 10,
        strengths: period === "MONTHLY" ? "Reads the pick-and-roll well; vocal in transition defence." : undefined,
        developmentAreas: period === "MONTHLY" ? "Left-hand finishing under contact; free-throw routine consistency." : undefined,
        categoryScores: { create: scores },
      },
    });
  }
  for (const p of [u16Roster[0], u16Roster[1], u16Roster[2], seniorRoster[0]]) {
    await evaluate(p.profileId, 2, -1, "MONTHLY");
    await evaluate(p.profileId, 1, 0, "MONTHLY");
    await evaluate(p.profileId, 0, 1, "WEEKLY");
  }

  /* ── Coach feedback ────────────────────────────────────────────────── */
  await prisma.feedback.createMany({
    data: [
      { playerId: u16Roster[0].profileId, coachId, message: "Great tempo control in the last scrimmage — keep pushing the pace off makes." },
      { playerId: u16Roster[1].profileId, coachId, message: "Box out every possession. You're getting the rebounds you fight for." },
      { playerId: seniorRoster[0].profileId, coachId: assistantId, message: "Defensive communication was excellent tonight. Set the tone again Thursday." },
    ],
  });

  /* ── Videos ────────────────────────────────────────────────────────── */
  const videoSpecs = [
    { title: "Shooting form — guide-hand drill", category: "SHOOTING" as const, team: u16.id },
    { title: "Defensive slides & closeouts", category: "DEFENSE" as const, team: u16.id },
    { title: "2-ball handling warm-up", category: "BALL_HANDLING" as const, player: u16Roster[0].profileId },
    { title: "Seniors: half-court offence breakdown", category: "GAME_ANALYSIS" as const, team: seniors.id },
  ];
  for (const v of videoSpecs) {
    const video = await prisma.video.create({
      data: {
        title: v.title,
        category: v.category,
        key: `seed/${v.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.mp4`,
        uploadedByUserId: headCoach.id,
        assignments: { create: v.team ? { teamId: v.team } : { playerId: v.player! } },
      },
    });
    void video;
  }

  /* ── Announcements ─────────────────────────────────────────────────── */
  const annA = await prisma.announcement.create({
    data: { authorUserId: admin.id, scope: "PLATFORM", title: "Welcome to the DYNI Blazers platform", body: "This is where the club and your coaches post notices, share the schedule and message your team. Check in regularly." },
  });
  const annAck = await prisma.announcement.create({
    data: {
      authorUserId: admin.id,
      scope: "PLATFORM",
      title: "Updated safeguarding policy — please acknowledge",
      body: "We've refreshed the club safeguarding policy for the new season. Every member and guardian needs to confirm they've read it. Full document on the club website.",
      requiresAck: true,
      pinnedUntil: daysFromNow(21),
    },
  });
  await prisma.announcement.create({
    data: { authorUserId: headCoach.id, scope: "TEAM", teamId: u16.id, title: "Kit collection Saturday", body: "New home shirts are in. Collect yours from the coaches' table before Saturday's session." },
  });
  await prisma.announcement.create({
    data: { authorUserId: headCoach.id, scope: "TEAM", teamId: seniors.id, title: "Thursday session moved to 8:30pm", body: "Court clash this week only — we start at 20:30. Back to normal next week." },
  });
  await prisma.announcement.create({
    data: { authorUserId: welfare.id, scope: "PLATFORM", title: "Who to talk to", body: "Wendy is the club welfare officer. If anything doesn't feel right — for you or someone else — you can reach her directly through Messages." },
  });
  // Most members have acknowledged the safeguarding policy; a few haven't.
  const ackers = [...Object.values(players).slice(0, 10).map((p) => p.userId), headCoach.id, assistantCoach.id];
  await prisma.announcementAck.createMany({ data: ackers.map((userId) => ({ announcementId: annAck.id, userId })) });
  void annA;

  /* ── Safeguarding policy + team conversations ──────────────────────── */
  await prisma.clubSafeguardingPolicy.create({ data: { clubId: club.id } });

  async function teamChannel(team: { id: number; name: string }, roster: typeof u16Roster, staffUserIds: number[], opener: string) {
    const minors = roster.filter((p) => p.spec.bornYearsAgo < 18).map((p) => p.profileId);
    const guardianIds = minors.length
      ? (
          await prisma.guardianRelationship.findMany({
            where: { playerProfileId: { in: minors } },
            select: { guardianUserId: true },
          })
        ).map((g) => g.guardianUserId)
      : [];
    const participantIds = [...new Set([...staffUserIds, ...roster.map((p) => p.userId), ...guardianIds])];
    const convo = await prisma.conversation.create({
      data: {
        type: "TEAM",
        teamId: team.id,
        createdByUserId: staffUserIds[0],
        safeguarded: minors.length > 0,
        lastMessageAt: daysFromNow(-1, 17),
        participants: {
          create: participantIds.map((userId) => ({
            userId,
            role: userId === staffUserIds[0] ? "admin" : "member",
            viaGuardianship: guardianIds.includes(userId) && !staffUserIds.includes(userId) && !roster.some((p) => p.userId === userId),
          })),
        },
      },
    });
    await prisma.message.create({ data: { conversationId: convo.id, authorUserId: staffUserIds[0], body: opener, createdAt: daysFromNow(-2, 17) } });
    await prisma.message.create({ data: { conversationId: convo.id, authorUserId: roster[0].userId, body: "Thanks coach — see everyone there.", createdAt: daysFromNow(-1, 17) } });
    return convo;
  }
  await teamChannel(u16, u16Roster, [headCoach.id, assistantCoach.id], "Welcome to the U16 channel. Session times, kit and any last-minute changes go here.");
  await teamChannel(seniors, seniorRoster, [headCoach.id], "Seniors channel — match details and travel go here. Confirm availability via RSVP, not chat, so it's tracked.");

  /* ── Notifications ─────────────────────────────────────────────────── */
  for (const p of [...u16Roster, ...seniorRoster].slice(0, 8)) {
    await prisma.notification.createMany({
      data: [
        { userId: p.userId, type: "ANNOUNCEMENT", category: "ANNOUNCEMENTS", title: "Updated safeguarding policy — please acknowledge", message: "Every member and guardian needs to confirm they've read it.", linkPath: "/announcements", dedupeKey: `announcement:${annAck.id}`, isRead: false },
        { userId: p.userId, type: "TRAINING_CHANGE", category: "SCHEDULE", title: "New event: End-of-term team pizza night", message: "Tony's Pizzeria, Riverside", linkPath: "/player/training", isRead: true, createdAt: daysFromNow(-3) },
      ],
    });
  }
  await prisma.notification.create({
    data: { userId: admin.id, type: "REGISTRATION_UPDATE", category: "REGISTRATION", title: "3 registrations awaiting review", message: "Ellie Fournier, Grace Mbeki and one other.", linkPath: "/admin/registrations", isRead: false },
  });

  /* ── Drill library (W9 part 1) ─────────────────────────────────────── */
  await prisma.drill.createMany({
    data: [
      {
        clubId: club.id, createdByUserId: headCoach.id, category: "WARMUP", difficulty: "BEGINNER",
        name: "Dynamic warm-up circuit", summary: "Full-body activation before any session.",
        instructions: "Two lengths of the court each: high knees, butt kicks, lateral shuffle, carioca, walking lunges, open/close the gate. Finish with 10 bodyweight squats and arm circles.",
        coachingPoints: ["Controlled, not rushed", "Full range of motion on the lunges"],
        durationMinutes: 8, minPlayers: 1, maxPlayers: 20, equipment: [], tags: ["warmup", "no-ball"],
      },
      {
        clubId: club.id, createdByUserId: headCoach.id, category: "BALL_HANDLING", difficulty: "INTERMEDIATE",
        name: "Two-ball stationary series", summary: "Simultaneous and alternating dribbles, low and controlled.",
        instructions: "30s each: simultaneous pound, alternating pound, high-low, front-V, crossover. Keep eyes up the whole time — call out a colour the coach holds up.",
        coachingPoints: ["Fingertips, not palms", "Stay in an athletic stance", "Eyes up"],
        commonMistakes: ["Standing straight up", "Watching the ball"],
        durationMinutes: 6, minPlayers: 2, maxPlayers: 16, equipment: ["2 balls per player"], tags: ["ball-handling"],
      },
      {
        clubId: club.id, createdByUserId: assistantCoach.id, category: "SHOOTING", difficulty: "INTERMEDIATE",
        name: "5-spot form shooting", summary: "Make 3 from each spot before moving on.",
        instructions: "Start close, one dribble into the shot. Five spots around the arc. Make 3 in a row at each spot to advance; miss two and reset that spot. Track total makes.",
        coachingPoints: ["Same routine every rep", "Hold the follow-through until it drops", "Land where you took off"],
        commonMistakes: ["Rushing to the next spot", "Fading away"],
        durationMinutes: 12, minPlayers: 1, maxPlayers: 12, equipment: ["1 ball per pair", "rebounder"], tags: ["shooting", "form"],
      },
      {
        clubId: club.id, createdByUserId: headCoach.id, category: "DEFENSE", difficulty: "INTERMEDIATE",
        name: "Closeout & mirror", summary: "Sprint the closeout, break down, mirror the offensive player.",
        instructions: "Offense on the wing, defense under the rim with a ball. Defense passes out and closes out under control (chop steps, high hand). Live 1v1 to a stop or a score. Rotate.",
        coachingPoints: ["Short choppy steps on the closeout", "Contest without fouling", "Nose on the ball"],
        commonMistakes: ["Flying at the shooter", "Standing straight up in the stance"],
        durationMinutes: 10, minPlayers: 4, maxPlayers: 16, equipment: ["1 ball"], tags: ["defense", "1v1"],
      },
      {
        clubId: club.id, createdByUserId: assistantCoach.id, category: "TRANSITION", difficulty: "ADVANCED",
        name: "3-on-2 continuous", summary: "Fast-break decision-making, both ends.",
        instructions: "Three attackers vs two defenders. Score or turn it over, then the two defenders + the first player back go the other way 3-on-2. Continuous for 4 minutes, then swap groups.",
        coachingPoints: ["Wings run wide and deep", "Attack the front foot of the top defender", "Second pass beats one defender"],
        durationMinutes: 8, minPlayers: 9, maxPlayers: 15, equipment: ["1 ball"], tags: ["transition", "conditioning"],
      },
      {
        clubId: club.id, createdByUserId: headCoach.id, category: "SCRIMMAGE", difficulty: "INTERMEDIATE",
        name: "Constraint scrimmage — 3 passes", summary: "5-on-5, must complete 3 passes before a shot.",
        instructions: "Normal 5-on-5 rules but every possession needs 3 completed passes before a shot counts. Encourages ball movement and off-ball cutting. Drop the constraint for the last 4 minutes.",
        coachingPoints: ["Cut hard after you pass", "Space the floor", "Talk on defense"],
        durationMinutes: 15, minPlayers: 10, maxPlayers: 12, equipment: ["1 ball", "pinnies"], tags: ["scrimmage", "team"],
      },
      {
        clubId: club.id, createdByUserId: assistantCoach.id, category: "COOLDOWN", difficulty: "BEGINNER",
        name: "Static stretch & session review", summary: "Wind down and set the next focus.",
        instructions: "Hold each stretch 30s: calves, quads, hamstrings, hip flexors, glutes, shoulders, triceps. While stretching, each player names one thing they did well and one thing to work on.",
        durationMinutes: 6, minPlayers: 1, maxPlayers: 20, equipment: [], tags: ["cooldown", "reflection"],
      },
    ],
  });

  /* ── Audit trail ───────────────────────────────────────────────────── */
  await prisma.auditLog.createMany({
    data: [
      { actorUserId: players["player1@example.com"].userId, action: "REGISTRATION_SUBMITTED", entityType: "PlayerProfile", entityId: players["player1@example.com"].profileId, createdAt: daysFromNow(-40) },
      { actorUserId: admin.id, action: "REGISTRATION_APPROVED", entityType: "PlayerProfile", entityId: players["player1@example.com"].profileId, metadata: { note: "Welcome to the club.", teamId: u16.id }, createdAt: daysFromNow(-38) },
      { actorUserId: admin.id, action: "REGISTRATION_CHANGES_REQUESTED", entityType: "PlayerProfile", entityId: 0, metadata: { note: "Please add an emergency contact and confirm your date of birth." }, createdAt: daysFromNow(-4) },
      { actorUserId: headCoach.id, action: "ROSTER_EXPORTED", entityType: "Team", entityId: u16.id, createdAt: daysFromNow(-7) },
      { actorUserId: headCoach.id, action: "MFA_ENABLED", entityType: "User", entityId: headCoach.id, createdAt: daysFromNow(-30) },
      { actorUserId: welfare.id, action: "EMAIL_VERIFIED", entityType: "User", entityId: welfare.id, createdAt: daysFromNow(-44) },
    ],
  });

  /* ── Training session plans (W9 part 2) ────────────────────────────── */
  const drillId = Object.fromEntries(
    (await prisma.drill.findMany({ select: { id: true, name: true } })).map((d) => [d.name, d.id]),
  );
  // A published plan for the U16 team's next practice.
  await prisma.trainingPlan.create({
    data: {
      teamId: u16.id, seasonId: season.id, createdByUserId: headCoach.id,
      title: "U16 practice — spacing & closeouts", status: "PUBLISHED", date: daysFromNow(1, 18),
      objectives: "Cleaner spacing in half-court offence; contest without fouling.",
      coachingNotes: "Split into two groups for the skill block — Dev takes the guards.",
      blocks: {
        create: [
          { order: 0, category: "WARMUP", durationMinutes: 8, drillId: drillId["Dynamic warm-up circuit"] },
          { order: 1, category: "SKILL", title: "Ball handling", durationMinutes: 6, drillId: drillId["Two-ball stationary series"] },
          { order: 2, category: "SKILL", title: "Shooting", durationMinutes: 12, drillId: drillId["5-spot form shooting"] },
          { order: 3, category: "TACTICAL", title: "Closeouts", durationMinutes: 10, notes: "Whole group. Emphasise chop steps.", drillId: drillId["Closeout & mirror"] },
          { order: 4, category: "SCRIMMAGE", durationMinutes: 15, drillId: drillId["Constraint scrimmage — 3 passes"] },
          { order: 5, category: "COOLDOWN", durationMinutes: 6, drillId: drillId["Static stretch & session review"] },
        ],
      },
    },
  });
  // A reusable template.
  await prisma.trainingPlan.create({
    data: {
      teamId: seniors.id, seasonId: season.id, createdByUserId: headCoach.id,
      title: "Standard 90-minute template", isTemplate: true, status: "DRAFT",
      objectives: "The default shape for a mid-week senior session.",
      blocks: {
        create: [
          { order: 0, category: "WARMUP", durationMinutes: 10, drillId: drillId["Dynamic warm-up circuit"] },
          { order: 1, category: "SKILL", durationMinutes: 20, notes: "Rotate two stations." },
          { order: 2, category: "TACTICAL", durationMinutes: 20 },
          { order: 3, category: "CONDITIONING", durationMinutes: 8, drillId: drillId["3-on-2 continuous"] },
          { order: 4, category: "SCRIMMAGE", durationMinutes: 25 },
          { order: 5, category: "COOLDOWN", durationMinutes: 7, drillId: drillId["Static stretch & session review"] },
        ],
      },
    },
  });

  const counts = {
    users: await prisma.user.count(),
    players: await prisma.playerProfile.count(),
    events: await prisma.event.count(),
    attendance: await prisma.attendanceRecord.count(),
  };
  console.log("Seeded DYNI Blazers:", counts);
  console.log("Logins (password123): admin@example.com · coach@example.com · player1@example.com · marcus.t@example.com · guardian@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
