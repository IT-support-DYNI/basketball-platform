import type { Metadata } from "next";

export const metadata: Metadata = { title: "News" };

/**
 * The mockup this page is built from had six invented stories with specific
 * fake dates — fine on a design mockup, not fine on a real public page: a
 * visitor reading "Autumn trials open 4 Sep" has no way to know it isn't
 * real. There's no news/CMS model in this app yet, so rather than publish
 * fabricated announcements, this is an honest empty state until one exists.
 */
export default function PublicNewsPage() {
  return (
    <section className="px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <p className="animate-hero-rise font-mono text-xs uppercase tracking-[0.3em] text-flame-ink">News &amp; stories</p>
        <h1 className="animate-hero-rise mt-3 font-display text-4xl font-extrabold uppercase leading-[0.95] tracking-tight text-ink sm:text-6xl" style={{ animationDelay: "60ms" }}>
          Nothing posted yet.
        </h1>
        <p className="animate-hero-rise mx-auto mt-5 max-w-md text-base leading-relaxed text-ink-dim" style={{ animationDelay: "140ms" }}>
          The club hasn&apos;t shared any news or stories here yet. Check back soon, or follow the club&apos;s other
          channels for updates in the meantime.
        </p>
      </div>
    </section>
  );
}
