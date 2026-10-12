import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { PlaybookPlay } from "@/components/shared/playbook/PlaybookPages";

export const metadata = { title: "Play" };

export default async function PlayerPlaybookPlayPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  return <PlaybookPlay session={session!} id={params.id} basePath="/player/playbook" />;
}
