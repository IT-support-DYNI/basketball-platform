import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTenantContext } from "@/lib/tenant";
import PageHeader from "@/components/ui/PageHeader";
import SeasonManager from "@/components/admin/SeasonManager";

export const metadata = { title: "Seasons" };

export default async function AdminSeasonsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  const ctx = await getTenantContext(session);
  const seasons = await prisma.season.findMany({
    where: { clubId: ctx.clubId },
    orderBy: { startDate: "desc" },
    include: { _count: { select: { memberships: true, squads: true } } },
  });

  return (
    <main className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Administrator"
        title="Seasons"
        lead="Rosters, squads and staff assignments are all scoped to a season. Exactly one season is active at a time."
      />
      <SeasonManager
        initial={seasons.map((s) => ({
          id: s.id,
          name: s.name,
          startDate: s.startDate.toISOString().slice(0, 10),
          endDate: s.endDate.toISOString().slice(0, 10),
          isActive: s.isActive,
          members: s._count.memberships,
          squads: s._count.squads,
        }))}
      />
    </main>
  );
}
