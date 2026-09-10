import type { Metadata } from "next";

export const metadata: Metadata = { title: "News" };

/**
 * There's no news/CMS model in this app yet, so rather than publish
 * fabricated announcements, this is an honest empty state until one exists
 * — see docs/DESIGN-MIGRATION.md.
 */
export default function PublicNewsPage() {
  return (
    <main>
      <section className="page-head">
        <div className="wrap">
          <p className="eyebrow">Club news</p>
          <h1>News &amp; stories.</h1>
        </div>
      </section>
      <section className="empty-state">
        <h2>Nothing posted yet.</h2>
        <p>
          The club hasn&apos;t shared any news or stories here yet. Check back soon, or follow the club&apos;s other
          channels for updates in the meantime.
        </p>
      </section>
    </main>
  );
}
