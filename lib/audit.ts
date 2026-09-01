import { Prisma } from "@prisma/client";

import { prisma } from "./prisma";

/*
 * DYNI Blazers PRD §31 — append-only record of sensitive actions.
 * Starting with registration decisions; extend to other sensitive actions
 * (medical/welfare access, permission changes, etc.) incrementally as those
 * modules are built, rather than wiring every existing route at once.
 */

export interface AuditEntry {
  actorUserId: number | null;
  action: string;
  entityType: string;
  entityId?: number;
  metadata?: Record<string, unknown>;
}

export async function logAudit(tx: Prisma.TransactionClient, entry: AuditEntry): Promise<void> {
  await tx.auditLog.create({
    data: {
      actorUserId: entry.actorUserId,
      action: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
      metadata: entry.metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

/* ── Reading the log (admin audit viewer) ─────────────────────────────── */

/** Every `action` string that reaches the log today, for the viewer's filter. */
export const AUDIT_ACTIONS = [
  "REGISTRATION_SUBMITTED",
  "REGISTRATION_RESUBMITTED",
  "REGISTRATION_APPROVED",
  "REGISTRATION_REJECTED",
  "REGISTRATION_CHANGES_REQUESTED",
  "ROSTER_EXPORTED",
  "EMAIL_VERIFIED",
  "PASSWORD_RESET_COMPLETED",
  "MFA_ENABLED",
  "MFA_DISABLED",
] as const;

const AUDIT_ACTION_LABEL: Record<string, string> = {
  REGISTRATION_SUBMITTED: "submitted a registration",
  REGISTRATION_RESUBMITTED: "re-submitted a registration",
  REGISTRATION_APPROVED: "approved a registration",
  REGISTRATION_REJECTED: "rejected a registration",
  REGISTRATION_CHANGES_REQUESTED: "requested changes to a registration",
  ROSTER_EXPORTED: "exported a team roster",
  EMAIL_VERIFIED: "verified their email",
  PASSWORD_RESET_COMPLETED: "completed a password reset",
  MFA_ENABLED: "turned on two-factor auth",
  MFA_DISABLED: "turned off two-factor auth",
};

/** Human phrasing for an action, falling back to a humanised token. */
export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABEL[action] ?? action.toLowerCase().replace(/_/g, " ");
}

export type AuditRow = {
  id: number;
  createdAt: string;
  action: string;
  actionLabel: string;
  entityType: string;
  entityId: number | null;
  actorName: string | null;
  metadata: Record<string, unknown> | null;
};

function toRow(e: {
  id: number;
  createdAt: Date;
  action: string;
  entityType: string;
  entityId: number | null;
  actor: { name: string } | null;
  metadata: Prisma.JsonValue;
}): AuditRow {
  return {
    id: e.id,
    createdAt: e.createdAt.toISOString(),
    action: e.action,
    actionLabel: auditActionLabel(e.action),
    entityType: e.entityType,
    entityId: e.entityId,
    actorName: e.actor?.name ?? null,
    metadata: (e.metadata as Record<string, unknown> | null) ?? null,
  };
}

/** The most recent entries, for the admin dashboard's activity card. */
export async function recentAuditActivity(limit = 6): Promise<AuditRow[]> {
  const rows = await prisma.auditLog.findMany({
    orderBy: { id: "desc" },
    take: limit,
    include: { actor: { select: { name: true } } },
  });
  return rows.map(toRow);
}

/** Paginated, optionally filtered log for the admin viewer. */
export async function listAuditLog(opts: {
  page: number;
  pageSize: number;
  action?: string | null;
  entityType?: string | null;
  actorUserId?: number | null;
}): Promise<{ items: AuditRow[]; total: number }> {
  const where: Prisma.AuditLogWhereInput = {
    ...(opts.action ? { action: opts.action } : {}),
    ...(opts.entityType ? { entityType: opts.entityType } : {}),
    ...(opts.actorUserId ? { actorUserId: opts.actorUserId } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
      include: { actor: { select: { name: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return { items: rows.map(toRow), total };
}
