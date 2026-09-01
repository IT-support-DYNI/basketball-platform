import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import AppContainer from "@/components/app/AppContainer";
import PageHeader from "@/components/ui/PageHeader";
import MessagesClient from "@/components/messages/MessagesClient";

/** Team / group / direct chat. Shared by every signed-in role. */
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { c?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const initialId = searchParams.c ? Number(searchParams.c) : null;

  return (
    <AppContainer>
      <div className="flex flex-col gap-6">
        <PageHeader
          eyebrow="Club"
          title="Messages"
          lead="Team channels, group chats and direct messages. Young people's conversations always include a guardian."
        />
        <MessagesClient
          meUserId={Number(session.user.id)}
          initialConversationId={Number.isFinite(initialId) ? initialId : null}
        />
      </div>
    </AppContainer>
  );
}
