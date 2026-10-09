import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { PlaybookIndex } from "@/components/shared/playbook/PlaybookPages";

export const metadata = { title: "Playbook" };

export default async function PlayerPlaybookPage() {
  const session = await getServerSession(authOptions);
  return <PlaybookIndex session={session!} basePath="/player/playbook" />;
}
