import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NotificationsList from "@/components/player/NotificationsList";
import PushNotificationToggle from "@/components/player/PushNotificationToggle";

export default async function PlayerNotificationsPage() {
  const session = await getServerSession(authOptions);

  const notifications = await prisma.notification.findMany({
    where: { userId: Number(session!.user.id) },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Notifications</h1>
      <p className="mt-1 text-slate-600">Training changes, new videos, new evaluations, new feedback, and announcements.</p>

      <div className="mt-6">
        <PushNotificationToggle />
        <NotificationsList
          initial={notifications.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            isRead: n.isRead,
            createdAt: n.createdAt.toISOString(),
            linkPath: n.linkPath,
          }))}
        />
      </div>
    </main>
  );
}
