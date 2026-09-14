import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms & Conditions" };

export default function PublicTermsPage() {
  return (
    <main>
      <section className="page-head page-head-dark">
        <div className="wrap">
          <p className="eyebrow">Legal</p>
          <h1>Terms &amp; Conditions</h1>
        </div>
      </section>

      <section style={{ padding: "var(--section-y) 0" }}>
        <div className="wrap">
          <div className="card">
            <p className="card-label">Not published yet</p>
            <p>
              This is where the club&apos;s real Terms &amp; Conditions go — ask the club to add its final wording
              here. Nothing on this page should be treated as the club&apos;s actual terms until it is.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
