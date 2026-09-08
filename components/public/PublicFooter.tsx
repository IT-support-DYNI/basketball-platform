import Link from "next/link";
import Brandmark from "@/components/Brandmark";

export default function PublicFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <Brandmark size="sm" />
        <p className="max-w-md text-sm text-ink-faint">
          Junior players&apos; profiles and photos are shown here only once a guardian and the club have both
          approved it — nothing about a young player appears on this page by default.
        </p>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/register" className="font-semibold text-flame-ink hover:underline">
            Register interest
          </Link>
          <Link href="/login" className="text-ink-dim hover:text-ink">
            Member sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
