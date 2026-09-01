import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppContainer from "@/components/app/AppContainer";
import PageHeader from "@/components/ui/PageHeader";
import AnnouncementsBoard from "@/components/announcements/AnnouncementsBoard";

/** The shared announcements surface — every signed-in role reads from here. */
export default async function AnnouncementsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const canPost = role === "ADMIN" || role === "COACH";

  const teams =
    role === "ADMIN"
      ? await prisma.team.findMany({ where: { status: "ACTIVE" }, select: { id: true, name: true }, orderBy: { name: "asc" } })
      : role === "COACH"
        ? await prisma.team.findMany({ where: { id: { in: session.user.teamIds ?? [] } }, select: { id: true, name: true } })
        : [];

  return (
    <AppContainer>
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="Club" title="Announcements" lead="Notices from the club and your coaches. Pinned items stay at the top." />
        <AnnouncementsBoard canPost={canPost} allowPlatform={role === "ADMIN"} teams={teams} />
      </div>
    </AppContainer>
  );
}
