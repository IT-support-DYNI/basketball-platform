import { Prisma } from "@prisma/client";

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
