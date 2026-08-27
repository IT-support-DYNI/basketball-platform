import { prisma } from "@/lib/prisma";
import CreateStaffUserForm from "@/components/admin/CreateStaffUserForm";
import ToggleActiveButton from "@/components/admin/ToggleActiveButton";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    where: { role: { in: ["ADMIN", "COACH"] } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Users</h1>
      <p className="mt-1 text-slate-600">Admin and Coach accounts. Player accounts are managed from each team's roster.</p>

      <div className="mt-6">
        <CreateStaffUserForm />
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                <td className="px-4 py-3 text-slate-600">{u.email}</td>
                <td className="px-4 py-3 text-slate-600">{u.role}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                    {u.isActive ? "Active" : "Deactivated"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <ToggleActiveButton userId={u.id} isActive={u.isActive} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
