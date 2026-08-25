export default function AdminSettingsPage() {
  return (
    <main>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Settings</h1>
      <p className="mt-1 text-slate-600">Platform-wide settings.</p>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <p className="text-lg font-semibold text-slate-800">Nothing configurable yet</p>
        <p className="mt-1 text-slate-500">
          This is a placeholder for platform-wide settings post-MVP (multi-club config, notification
          channels, performance category management). See ARCHITECTURE.md for what's planned.
        </p>
      </div>
    </main>
  );
}
