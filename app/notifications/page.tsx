import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AppContainer from "@/components/app/AppContainer";
import PageHeader from "@/components/ui/PageHeader";
import PushNotificationToggle from "@/components/player/PushNotificationToggle";
import NotificationsFeed from "@/components/notifications/NotificationsFeed";

/** Shared notifications feed — every signed-in role. */
export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const notifications = await prisma.notification.findMany({
    where: { userId: Number(session.user.id) },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return (
    <AppContainer>
      <div className="flex flex-col gap-6">
        <PageHeader eyebrow="You" title="Notifications" lead="Everything the club and your coaches have flagged for you." />
        <PushNotificationToggle />
        <NotificationsFeed
          initial={notifications.map((n) => ({
            id: n.id,
            category: n.category,
            title: n.title,
            message: n.message,
            linkPath: n.linkPath,
            isRead: n.isRead,
            createdAt: n.createdAt.toISOString(),
          }))}
        />
      </div>
    </AppContainer>
  );
}
