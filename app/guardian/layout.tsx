import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import AppContainer from "@/components/app/AppContainer";

export default async function GuardianLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "GUARDIAN") redirect("/login");

  return <AppContainer>{children}</AppContainer>;
}
