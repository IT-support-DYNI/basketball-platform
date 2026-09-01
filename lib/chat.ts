import type { Prisma } from "@prisma/client";

import { prisma } from "./prisma";
import { BadRequestError, ForbiddenError, NotFoundError } from "./api/errors";
import { isMinor } from "./age";
import {
  directMessageAllowed,
  getSafeguardingPolicy,
  primaryClubId,
  type SafeguardingPolicy,
} from "./safeguarding";
import { notifyUsers } from "./notify";
import { sendPushToUsers } from "./push";

/**
 * Two-way chat. Transport is polling (the client re-fetches); a realtime
 * adapter can slot into `postMessage` later without touching call sites.
 *
 * Safeguarding (brief §13): a conversation is `safeguarded` when a minor is in
 * it; then guardians are auto-added and adult↔minor 1:1 DMs are blocked.
 */

const EDIT_WINDOW_MS = 15 * 60_000;

/** Which of `userIds` are minors, per the club's age threshold. */
async function minorUserIds(userIds: number[], threshold: number): Promise<Set<number>> {
  if (userIds.length === 0) return new Set();
  const profiles = await prisma.playerProfile.findMany({
    where: { userId: { in: userIds }, dateOfBirth: { not: null } },
    select: { userId: true, dateOfBirth: true },
  });
  return new Set(
    profiles.filter((p) => p.dateOfBirth && isMinor(p.dateOfBirth, threshold)).map((p) => p.userId),
  );
}

/** Guardian userIds for the given minor player-user ids. */
async function guardiansOf(minorUserIds: number[]): Promise<number[]> {
  if (minorUserIds.length === 0) return [];
  const links = await prisma.guardianRelationship.findMany({
    where: { player: { userId: { in: minorUserIds } } },
    select: { guardianUserId: true },
  });
  return [...new Set(links.map((l) => l.guardianUserId))];
}

/** Expand a participant list per policy: adds guardians of any minors, returns
 *  the final set + whether a minor is present. */
async function resolveParticipants(
  userIds: number[],
  policy: SafeguardingPolicy,
): Promise<{ direct: Set<number>; viaGuardian: Set<number>; hasMinor: boolean }> {
  const uniq = [...new Set(userIds)];
  const minors = await minorUserIds(uniq, policy.minorAgeThreshold);
  const viaGuardian = new Set<number>();
  if (minors.size > 0 && policy.guardianAutoIncludedWithMinor) {
    for (const g of await guardiansOf([...minors])) {
      if (!uniq.includes(g)) viaGuardian.add(g);
    }
  }
  return { direct: new Set(uniq), viaGuardian, hasMinor: minors.size > 0 };
}

/** A club-scoped policy, resolved once. */
export async function clubPolicy(): Promise<SafeguardingPolicy> {
  return getSafeguardingPolicy(await primaryClubId());
}

/** Find or create a team's channel and sync its participants to the current
 *  roster + staff (+ guardians of minors). */
export async function ensureTeamConversation(teamId: number): Promise<number> {
  const policy = await clubPolicy();

  const [players, staff, existing] = await Promise.all([
    prisma.teamMembership.findMany({
      where: { teamId, status: { notIn: ["FORMER", "INACTIVE"] } },
      select: { player: { select: { userId: true } } },
    }),
    prisma.staffAssignment.findMany({ where: { teamId }, select: { userId: true } }),
    prisma.conversation.findUnique({ where: { type_teamId: { type: "TEAM", teamId } } }),
  ]);

  const memberIds = [...new Set([...players.map((p) => p.player.userId), ...staff.map((s) => s.userId)])];
  const { viaGuardian, hasMinor } = await resolveParticipants(memberIds, policy);

  const conversation =
    existing ??
    (await prisma.conversation.create({
      data: {
        type: "TEAM",
        teamId,
        createdByUserId: staff[0]?.userId ?? memberIds[0] ?? 1,
        safeguarded: hasMinor,
      },
    }));

  // Sync participants (add missing; we don't auto-remove — leaving history intact).
  const current = new Set(
    (await prisma.conversationParticipant.findMany({
      where: { conversationId: conversation.id },
      select: { userId: true },
    })).map((p) => p.userId),
  );
  const toAdd: Prisma.ConversationParticipantCreateManyInput[] = [];
  for (const id of memberIds) if (!current.has(id)) toAdd.push({ conversationId: conversation.id, userId: id });
  for (const id of viaGuardian) if (!current.has(id)) toAdd.push({ conversationId: conversation.id, userId: id, viaGuardianship: true });
  if (toAdd.length) await prisma.conversationParticipant.createMany({ data: toAdd, skipDuplicates: true });

  if (hasMinor && !conversation.safeguarded) {
    await prisma.conversation.update({ where: { id: conversation.id }, data: { safeguarded: true } });
  }
  return conversation.id;
}

/** Create a GROUP or DIRECT conversation, enforcing the safeguarding rules. */
export async function createConversation(
  creatorUserId: number,
  input: { type: "GROUP" | "DIRECT"; name?: string; participantUserIds: number[] },
): Promise<number> {
  const policy = await clubPolicy();
  const everyone = [...new Set([creatorUserId, ...input.participantUserIds])];
  if (everyone.length < 2) throw new BadRequestError("Add someone to message.");

  if (input.type === "DIRECT") {
    if (everyone.length !== 2) throw new BadRequestError("A direct message is between exactly two people.");
    const minors = await minorUserIds(everyone, policy.minorAgeThreshold);
    if (!directMessageAllowed(everyone.map((id) => minors.has(id)), policy)) {
      throw new ForbiddenError(
        "Direct messages between an adult and a young person aren't allowed. Use a team or group channel instead.",
      );
    }
    // Reuse an existing 1:1 if there is one.
    const dup = await prisma.conversation.findFirst({
      where: {
        type: "DIRECT",
        participants: { every: { userId: { in: everyone } } },
        AND: everyone.map((id) => ({ participants: { some: { userId: id } } })),
      },
      select: { id: true },
    });
    if (dup) return dup.id;
  }

  const { direct, viaGuardian, hasMinor } = await resolveParticipants(everyone, policy);
  const conversation = await prisma.conversation.create({
    data: {
      type: input.type,
      name: input.type === "GROUP" ? input.name ?? "Group chat" : null,
      createdByUserId: creatorUserId,
      safeguarded: hasMinor,
      participants: {
        create: [
          ...[...direct].map((userId) => ({ userId, role: userId === creatorUserId ? "admin" : "member" })),
          ...[...viaGuardian].map((userId) => ({ userId, viaGuardianship: true })),
        ],
      },
    },
  });
  return conversation.id;
}

async function requireParticipant(conversationId: number, userId: number) {
  const p = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!p) throw new ForbiddenError("You're not in this conversation.");
  return p;
}

/** The caller's conversations, newest activity first, with an unread count. */
export async function conversationsFor(userId: number) {
  const parts = await prisma.conversationParticipant.findMany({
    where: { userId },
    include: {
      conversation: {
        include: {
          team: { select: { name: true } },
          event: { select: { title: true } },
          participants: { include: { user: { select: { id: true, name: true } } } },
          messages: { orderBy: { createdAt: "desc" }, take: 1, include: { author: { select: { name: true } } } },
        },
      },
    },
  });

  const rows = await Promise.all(
    parts.map(async (p) => {
      const c = p.conversation;
      const unread = await prisma.message.count({
        where: {
          conversationId: c.id,
          deletedAt: null,
          authorUserId: { not: userId },
          ...(p.lastReadAt ? { createdAt: { gt: p.lastReadAt } } : {}),
        },
      });
      const last = c.messages[0];
      return {
        id: c.id,
        type: c.type,
        title:
          c.type === "TEAM"
            ? `${c.team?.name ?? "Team"} channel`
            : c.type === "EVENT"
              ? c.event?.title ?? "Event chat"
              : c.name ??
                c.participants
                  .filter((x) => x.userId !== userId)
                  .map((x) => x.user.name)
                  .join(", "),
        safeguarded: c.safeguarded,
        lastMessage: last
          ? { body: last.deletedAt ? "Message removed" : last.body, author: last.author.name, at: last.createdAt.toISOString() }
          : null,
        lastMessageAt: c.lastMessageAt.toISOString(),
        unread,
        viaGuardianship: p.viaGuardianship,
      };
    }),
  );
  return rows.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

/** Messages + participants for one conversation. `after` returns only newer ids. */
export async function conversationView(conversationId: number, userId: number, after?: number) {
  await requireParticipant(conversationId, userId);
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      team: { select: { name: true } },
      event: { select: { title: true } },
      participants: { include: { user: { select: { id: true, name: true, role: true } } } },
    },
  });
  if (!conversation) throw new NotFoundError("That conversation wasn't found.");

  const messages = await prisma.message.findMany({
    where: { conversationId, ...(after ? { id: { gt: after } } : {}) },
    orderBy: { createdAt: "asc" },
    take: 200,
    include: { author: { select: { id: true, name: true } } },
  });

  return {
    id: conversation.id,
    type: conversation.type,
    title:
      conversation.type === "TEAM"
        ? `${conversation.team?.name ?? "Team"} channel`
        : conversation.type === "EVENT"
          ? conversation.event?.title ?? "Event chat"
          : conversation.name ??
            conversation.participants
              .filter((x) => x.userId !== userId)
              .map((x) => x.user.name)
              .join(", "),
    safeguarded: conversation.safeguarded,
    participants: conversation.participants.map((p) => ({
      userId: p.userId,
      name: p.user.name,
      role: p.role,
      viaGuardianship: p.viaGuardianship,
    })),
    messages: messages.map((m) => ({
      id: m.id,
      authorUserId: m.authorUserId,
      author: m.author.name,
      body: m.deletedAt ? null : m.body,
      deleted: m.deletedAt != null,
      edited: m.editedAt != null,
      createdAt: m.createdAt.toISOString(),
    })),
  };
}

export async function postMessage(conversationId: number, authorUserId: number, bodyText: string) {
  await requireParticipant(conversationId, authorUserId);
  const body = bodyText.trim();
  if (!body) throw new BadRequestError("Say something first.");
  if (body.length > 4000) throw new BadRequestError("That message is too long.");

  const { message, recipients } = await prisma.$transaction(async (tx) => {
    const msg = await tx.message.create({
      data: { conversationId, authorUserId, body },
      include: { author: { select: { name: true } } },
    });
    await tx.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: msg.createdAt } });
    await tx.conversationParticipant.update({
      where: { conversationId_userId: { conversationId, userId: authorUserId } },
      data: { lastReadAt: msg.createdAt },
    });
    const others = (
      await tx.conversationParticipant.findMany({
        where: { conversationId, userId: { not: authorUserId } },
        select: { userId: true },
      })
    ).map((p) => p.userId);
    await notifyUsers(tx, others, {
      type: "ANNOUNCEMENT", // no MESSAGE NotificationType; category override puts it in MESSAGES
      category: "MESSAGES",
      title: `New message from ${msg.author.name}`,
      message: body.length > 100 ? `${body.slice(0, 97)}…` : body,
      linkPath: `/messages?c=${conversationId}`,
      dedupeKey: `conversation:${conversationId}`,
    });
    return { message: msg, recipients: others };
  });

  await sendPushToUsers(
    recipients,
    { title: `New message from ${message.author.name}`, body: body.slice(0, 120), url: `/messages?c=${conversationId}` },
    "MESSAGES",
  );

  return { id: message.id, createdAt: message.createdAt.toISOString() };
}

export async function markConversationRead(conversationId: number, userId: number) {
  await requireParticipant(conversationId, userId);
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
}

export async function editMessage(messageId: number, userId: number, bodyText: string) {
  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  if (!msg || msg.deletedAt) throw new NotFoundError("That message wasn't found.");
  if (msg.authorUserId !== userId) throw new ForbiddenError("You can only edit your own messages.");
  if (Date.now() - msg.createdAt.getTime() > EDIT_WINDOW_MS) {
    throw new ForbiddenError("Messages can only be edited for 15 minutes.");
  }
  const body = bodyText.trim();
  if (!body) throw new BadRequestError("Message can't be empty — delete it instead.");
  await prisma.message.update({ where: { id: messageId }, data: { body, editedAt: new Date() } });
}

export async function deleteMessage(messageId: number, userId: number, userRole: string) {
  const msg = await prisma.message.findUnique({
    where: { id: messageId },
    include: { conversation: { select: { participants: { where: { userId }, select: { role: true } } } } },
  });
  if (!msg || msg.deletedAt) throw new NotFoundError("That message wasn't found.");
  const isConvoAdmin = msg.conversation.participants[0]?.role === "admin";
  if (msg.authorUserId !== userId && userRole !== "ADMIN" && !isConvoAdmin) {
    throw new ForbiddenError("You can't remove this message.");
  }
  await prisma.message.update({ where: { id: messageId }, data: { deletedAt: new Date() } });
}
