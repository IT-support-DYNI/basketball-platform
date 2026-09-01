import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { consentStatusFor, resolveConsentSubject } from "@/lib/consent";
import { prisma } from "@/lib/prisma";
import Brandmark from "@/components/Brandmark";
import ConsentForm from "@/components/consent/ConsentForm";

/**
 * The consent checklist. Players land here (redirected by the player layout)
 * whenever a required document is unaccepted; a guardian reaches it from their
 * dashboard with `?child=<playerProfileId>`.
 */
export default async function ConsentPage({ searchParams }: { searchParams: { child?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const childParam = searchParams.child ? Number(searchParams.child) : undefined;
  let subject: { playerProfileId: number; byGuardian: boolean };
  try {
    subject = await resolveConsentSubject(session, childParam);
  } catch {
    redirect(session.user.role === "GUARDIAN" ? "/guardian" : "/");
  }

  const forChild =
    subject.byGuardian
      ? await prisma.playerProfile.findUnique({
          where: { id: subject.playerProfileId },
          select: { user: { select: { name: true } } },
        })
      : null;

  const items = (await consentStatusFor(subject.playerProfileId)).map((i) => ({
    ...i,
    acceptedAt: i.acceptedAt?.toISOString() ?? null,
    version: { ...i.version, publishedAt: i.version.publishedAt.toISOString() },
  }));
  const outstanding = items.filter((i) => i.required && i.acceptedAt == null).length;
  const redirectTo = subject.byGuardian ? "/guardian" : "/player/dashboard";

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <div>
        <Brandmark size="sm" />
        <h1 className="mt-4 font-display text-2xl font-extrabold uppercase tracking-tight text-ink">
          {outstanding > 0 ? "A few things to agree to" : "Club documents"}
        </h1>
        <p className="mt-1 text-ink-dim">
          {forChild ? `On behalf of ${forChild.user.name}. ` : ""}
          {outstanding > 0
            ? "The club needs agreement to these before full access. Read each one, tick “I accept”, then continue."
            : "Everything on file is up to date."}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-card border border-line bg-surface p-5 text-sm text-ink-dim">
          The club hasn&apos;t published any consent documents yet.
        </p>
      ) : (
        <ConsentForm
          items={items}
          playerProfileId={subject.byGuardian ? subject.playerProfileId : undefined}
          redirectTo={redirectTo}
        />
      )}

      {subject.byGuardian && (
        <Link href="/guardian" className="text-sm font-semibold text-flame-ink hover:underline">
          ← Back to my children
        </Link>
      )}
    </main>
  );
}
