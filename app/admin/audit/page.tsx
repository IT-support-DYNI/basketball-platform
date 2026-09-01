import { prisma } from "@/lib/prisma";
import { AUDIT_ACTIONS, listAuditLog } from "@/lib/audit";
import PageHeader from "@/components/ui/PageHeader";
import AuditLogViewer from "@/components/admin/AuditLogViewer";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

export default async function AdminAuditPage() {
  const first = await listAuditLog({ page: 1, pageSize: PAGE_SIZE });

  // Distinct actors that appear in the log, for the filter dropdown.
  const actorIds = (
    await prisma.auditLog.findMany({
      where: { actorUserId: { not: null } },
      distinct: ["actorUserId"],
      select: { actorUserId: true },
    })
  )
    .map((r) => r.actorUserId!)
    .filter(Boolean);
  const actors = actorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: actorIds } },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const entityTypes = [
    ...new Set(
      (await prisma.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true } })).map(
        (r) => r.entityType,
      ),
    ),
  ].sort();

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Administrator"
        title="Audit log"
        lead="An append-only record of sensitive actions across the club — registration decisions, roster exports, account security changes."
      />
      <AuditLogViewer
        initial={first}
        pageSize={PAGE_SIZE}
        actions={[...AUDIT_ACTIONS]}
        actors={actors}
        entityTypes={entityTypes}
      />
    </main>
  );
}
