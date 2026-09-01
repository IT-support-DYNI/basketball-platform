import { prisma } from "@/lib/prisma";
import PageHeader from "@/components/ui/PageHeader";
import ConsentManager from "@/components/admin/ConsentManager";

export default async function AdminConsentPage() {
  const docs = await prisma.consentDocument.findMany({
    orderBy: { createdAt: "asc" },
    include: { versions: { orderBy: { version: "desc" }, take: 1 } },
  });

  const rows = await Promise.all(
    docs.map(async (d) => {
      const current = d.versions[0] ?? null;
      const acceptedCount = current
        ? await prisma.consentRecord.count({ where: { documentVersionId: current.id } })
        : 0;
      return {
        id: d.id,
        type: d.type,
        title: d.title,
        requiredForPlayers: d.requiredForPlayers,
        active: d.active,
        currentVersion: current
          ? { version: current.version, publishedAt: current.publishedAt.toISOString() }
          : null,
        acceptedCount,
      };
    }),
  );

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Administrator"
        title="Consent documents"
        lead="Codes of conduct, media consent, privacy notices. Publishing a new version asks every player to re-accept."
      />
      <ConsentManager docs={rows} />
    </main>
  );
}
