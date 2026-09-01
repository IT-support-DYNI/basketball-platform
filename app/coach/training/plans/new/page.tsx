import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listPlans } from "@/lib/training-plans";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import NewPlanForm from "@/components/training/NewPlanForm";

export const metadata = { title: "New session plan" };

export default async function NewPlanPage() {
  const session = await getServerSession(authOptions);
  const teamIds = session!.user.teamIds ?? [];
  const [teams, templates] = await Promise.all([
    prisma.team.findMany({ where: { id: { in: teamIds } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    listPlans(teamIds, { templates: true }),
  ]);

  return (
    <main className="flex flex-col gap-8">
      <PageHeader eyebrow="Coach · Session plans" title="New plan" />
      <Card as="section">
        <NewPlanForm
          teams={teams}
          templates={templates.map((t) => ({ id: t.id, title: t.title, teamId: t.teamId }))}
        />
      </Card>
    </main>
  );
}
