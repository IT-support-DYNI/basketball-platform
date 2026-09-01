import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { consentStatusFor } from "@/lib/consent";
import Brandmark from "@/components/Brandmark";
import ConsentForm from "@/components/consent/ConsentForm";

/**
 * The consent checklist. Players land here (redirected by the player layout)
 * whenever a required document is unaccepted at its current version.
 */
export default async function ConsentPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const playerId = session.user.playerId;
  if (!playerId) redirect("/");

  const items = (await consentStatusFor(playerId)).map((i) => ({
    ...i,
    acceptedAt: i.acceptedAt?.toISOString() ?? null,
    version: { ...i.version, publishedAt: i.version.publishedAt.toISOString() },
  }));

  const outstanding = items.filter((i) => i.required && i.acceptedAt == null).length;

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-10">
      <div>
        <Brandmark size="sm" />
        <h1 className="mt-4 font-display text-2xl font-extrabold uppercase tracking-tight text-ink">
          {outstanding > 0 ? "A few things to agree to" : "Club documents"}
        </h1>
        <p className="mt-1 text-ink-dim">
          {outstanding > 0
            ? "The club needs your agreement to these before you can use the rest of the app. Read each one, tick “I accept”, then continue."
            : "You're all set. These are the documents on file for you."}
        </p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-card border border-line bg-surface p-5 text-sm text-ink-dim">
          The club hasn&apos;t published any consent documents yet.
        </p>
      ) : (
        <ConsentForm items={items} redirectTo="/player/dashboard" />
      )}
    </main>
  );
}
