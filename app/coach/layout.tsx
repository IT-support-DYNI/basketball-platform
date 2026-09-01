import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import AppContainer from "@/components/app/AppContainer";

export default async function CoachLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "COACH") redirect("/login");

  return <AppContainer>{children}</AppContainer>;
}
