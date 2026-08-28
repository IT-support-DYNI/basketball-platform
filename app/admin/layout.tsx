import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import AppContainer from "@/components/app/AppContainer";

/*
 * middleware.ts already redirects role mismatches away from /admin —
 * this is a second, defense-in-depth check (ARCHITECTURE.md §3.2's
 * two-layer RBAC applies to pages too, not just API routes).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/login");

  return <AppContainer>{children}</AppContainer>;
}
