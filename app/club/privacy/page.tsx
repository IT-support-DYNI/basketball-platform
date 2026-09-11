import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PublicPrivacyPage() {
  return (
    <main>
      <section className="page-head page-head-dark">
        <div className="wrap">
          <p className="eyebrow">Legal</p>
          <h1>Privacy Policy</h1>
        </div>
      </section>

      <section style={{ padding: "var(--section-y) 0" }}>
        <div className="wrap">
          <div className="card">
            <p className="card-label">Not published yet</p>
            <p>
              This is where the club&apos;s real Privacy Policy goes — ask the club to add its final wording here,
              covering what&apos;s collected at registration (including for junior players) and how it&apos;s used.
              Nothing on this page should be treated as the club&apos;s actual policy until it is.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
