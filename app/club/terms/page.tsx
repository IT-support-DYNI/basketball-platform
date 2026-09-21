import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = { title: "Terms & Conditions" };

/** See app/club/privacy/page.tsx's file comment — same drafting approach
 *  and same "pending sign-off" caveat applies here. */
const SECTIONS: { n: string; title: string; body: ReactNode }[] = [
  {
    n: "1",
    title: "Who these terms are for",
    body: "These terms apply to anyone who registers as a member of DYNI Blazers (run by Diverse Youth Northern Ireland) or uses the club's platform at dyniblazers.co.uk. For a player under 18, a parent or guardian accepts these terms on the player's behalf when they complete registration, and is responsible for the player meeting them.",
  },
  {
    n: "2",
    title: "Membership and registration",
    body: "Registering doesn't guarantee a place on a team — an administrator reviews and approves every registration, and may decline one (for example if a team is full, or eligibility information is missing). We'll always tell you why if a registration isn't approved.\n\nYou agree to keep your registration information accurate and up to date, particularly emergency contact and medical details — a coach may need to act on them without warning.",
  },
  {
    n: "3",
    title: "Fees",
    body: "The club does not currently collect membership or match fees through this platform. If the club charges fees, they're handled separately for now; this section will be updated with the platform's own fee process once that's built and the club decides to switch to it. Nothing here should be read as describing a live, working payment system.",
  },
  {
    n: "4",
    title: "Code of conduct",
    body: "Every member agrees to the club's Code of Conduct as part of registration — see that document for the full detail. Breaching it (on or off the court, including online in team messages) may lead to a warning, suspension, or in serious cases removal from the club, at the club's discretion and following its own fair process.",
  },
  {
    n: "5",
    title: "Attendance, sessions and changes",
    body: "Training and match sessions are published on the club calendar; you're responsible for checking it and RSVPing where asked. The club may reschedule, relocate or cancel a session — we'll do our best to give reasonable notice, but circumstances (weather, venue availability, coach illness) aren't always predictable.\n\nCheck-in at a session (in person, by QR code or venue PIN) creates an attendance record used for safety accounting and, where relevant, development tracking.",
  },
  {
    n: "6",
    title: "Health, safety and medical information",
    body: "You (or, for a junior, your guardian) must tell the club about any medical condition, allergy or welfare need that could affect participation or that staff should know about in an emergency, and keep that information current. By registering, you also accept the club's Emergency Medical Treatment Consent, which authorises staff to arrange emergency care if you can't be reached — see that document for the specifics.\n\nBasketball carries an inherent risk of injury. The club takes reasonable care (qualified coaching, appropriate supervision, First Aid-trained staff at sessions) but can't eliminate that risk, and members and guardians take part on that understanding.",
  },
  {
    n: "7",
    title: "Photography, video and public profiles",
    body: "The club may take photos or video at sessions and matches for the team channel, the club website or social media, but only uses images of a specific member where separate media consent has been given for them — see the Photography & Media Consent document. This is opt-in and can be withdrawn at any time.",
  },
  {
    n: "8",
    title: "Safeguarding",
    body: "The club is committed to the welfare of every member, especially junior players. All coaches and volunteers working with juniors are vetted (AccessNI checks) and given safeguarding training. Anyone — a member, a guardian, or anyone else — can raise a safeguarding concern at dyniblazers.co.uk/club/safeguarding at any time; it goes straight to the club's admin team, and can be made anonymously if preferred.",
  },
  {
    n: "9",
    title: "Data protection",
    body: (
      <>
        The club collects and uses personal data as described in the{" "}
        <Link href="/club/privacy">Privacy Policy</Link>, which forms part of these terms.
      </>
    ),
  },
  {
    n: "10",
    title: "Messaging and platform use",
    body: "Team and direct messages within the platform are for club-related communication. They're moderated after the fact rather than in real time, so members and guardians are expected to use the same standard of conduct as anywhere else in the club. Staff messaging junior players is limited to what's needed for club business (session logistics, feedback, and similar) — never one-to-one outside a club context.",
  },
  {
    n: "11",
    title: "Suspension and termination",
    body: "The club may suspend or end a membership for a serious or repeated breach of these terms or the code of conduct, following its own fair process, or where continued membership would put someone's safety at risk. A member or guardian can end their own membership at any time by telling the club; existing data is handled as described in the Privacy Policy.",
  },
  {
    n: "12",
    title: "Complaints",
    body: "If something about the club, a coach, or how a situation was handled isn't right, tell the club directly, or use the safeguarding report form if it's a welfare or conduct concern. We'll acknowledge and look into it.",
  },
  {
    n: "13",
    title: "Changes to these terms",
    body: "We may update these terms from time to time — for example as the platform gains new features (fees, live scorekeeping) or the club's own policies change. Continuing to take part after a material change means you accept the update; for anything significant, we'll ask members and guardians to explicitly re-accept, the same way as for other consent documents.",
  },
  {
    n: "14",
    title: "Governing law",
    body: "These terms are governed by the law of Northern Ireland, and any dispute is subject to the exclusive jurisdiction of the courts of Northern Ireland.",
  },
];

export default function PublicTermsPage() {
  return (
    <main>
      <section className="page-head page-head-dark">
        <div className="wrap">
          <p className="eyebrow">Legal</p>
          <h1>Terms &amp; Conditions</h1>
          <p className="lead">What membership of DYNI Blazers involves, for members, guardians and the club alike.</p>
        </div>
      </section>

      <section style={{ padding: "0 0 var(--section-y)" }}>
        <div className="wrap">
          <div className="card" style={{ borderColor: "var(--accent)" }}>
            <p className="card-label">Draft — pending sign-off</p>
            <p>
              This is a working draft covering how the platform and club actually operate today. It hasn&apos;t yet
              been reviewed by a solicitor or formally adopted by the club — please don&apos;t treat it as the
              club&apos;s final terms until it has been.
            </p>
          </div>
        </div>
      </section>

      <section style={{ padding: "0 0 var(--section-y)" }}>
        <div className="wrap" style={{ maxWidth: "72ch" }}>
          {SECTIONS.map((s) => (
            <div key={s.n} style={{ marginTop: 40 }}>
              <p className="card-label">
                {s.n}. {s.title}
              </p>
              <p style={{ marginTop: 12, whiteSpace: "pre-wrap", lineHeight: 1.7, color: "var(--text-2)" }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
