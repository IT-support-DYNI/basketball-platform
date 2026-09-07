import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listPlans } from "@/lib/training-plans";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import NewPlanForm from "@/components/training/NewPlanForm";

export const metadata = { title: "New session plan" };

export default async function NewPlanPage({ searchParams }: { searchParams: { eventId?: string } }) {
  const session = await getServerSession(authOptions);
  const teamIds = session!.user.teamIds ?? [];

  const eventId = searchParams.eventId ? Number(searchParams.eventId) : null;
  const forEvent = eventId
    ? await prisma.event.findFirst({
        where: { id: eventId, teamId: { in: teamIds }, trainingPlan: { is: null } },
        select: { id: true, title: true, startAt: true, teamId: true, team: { select: { name: true } } },
      })
    : null;

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
          forEvent={
            forEvent && forEvent.teamId != null
              ? { id: forEvent.id, title: forEvent.title, startAt: forEvent.startAt.toISOString(), teamId: forEvent.teamId, teamName: forEvent.team?.name ?? "" }
              : null
          }
        />
      </Card>
    </main>
  );
}
