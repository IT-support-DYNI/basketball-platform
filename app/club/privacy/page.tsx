import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Privacy Policy" };

/** Simple bordered table for the two retention schedules below — matches
 *  the site's hairline-border aesthetic rather than introducing a new
 *  visual language just for these two tables. */
function RetentionTable({ rows }: { rows: [string, string][] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} style={{ borderBottom: "1px solid var(--border)" }}>
            <td style={{ padding: "10px 12px 10px 0", verticalAlign: "top", fontWeight: 600, color: "var(--text-1)", width: "42%" }}>
              {label}
            </td>
            <td style={{ padding: "10px 0", verticalAlign: "top", color: "var(--text-2)" }}>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Drafted to cover what UK GDPR (Art. 13/14) requires a privacy notice to
 * say, based on what this platform actually collects and does (see
 * lib/consent.ts, prisma/schema.prisma, docs/SECURITY.md) — not generic
 * boilerplate. The staff/volunteer employment-record retention table
 * (section 12) is sourced directly from the club's own Staff Policies
 * Handbook (2025–2027); the member/player retention table (section 6) is
 * a proposed schedule modelled on the same approach, since no equivalent
 * document exists yet for player data — it's the club's call, not settled
 * law. The named Data Controller and contact email are still bracketed
 * placeholders. This is a working draft, not a substitute for a
 * solicitor or the club's own sign-off — see the notice banner below
 * before publishing it as final.
 */

const SECTIONS: { n: string; title: string; body: ReactNode }[] = [
  {
    n: "1",
    title: "Who we are",
    body: "This site and the membership platform behind it (dyniblazers.co.uk) are run by DYNI Blazers, a basketball club operated by Diverse Youth Northern Ireland, based in Belfast, Northern Ireland.\n\nFor the purposes of UK data protection law, Diverse Youth Northern Ireland is the Data Controller for the personal data described in this notice: the organisation that decides why and how it's used, and who's accountable for it.\n\nData Controller contact: [ name of the person accountable for data protection at the club, and an email address for data requests — to be added by the club ].",
  },
  {
    n: "2",
    title: "What we collect, and why",
    body: "We only collect what's needed to run the club safely and fairly. What we hold depends on your role:\n\nEvery member — name, date of birth, email, phone number, home address, the team(s) and season(s) you're registered to, and your account login details.\n\nJunior players (under 18) — the same, plus a guardian's name and contact details, since a guardian registers on a junior's behalf and manages their consent.\n\nEmergency and medical information — an emergency contact, and any medical conditions, allergies or welfare needs relevant to keeping you safe during a session, match or trip. You choose what to share here; we ask because a coach or first-aider may need it in an emergency, not to build a health record.\n\nAttendance and participation — RSVPs, check-ins/check-outs, and attendance history for sessions and matches.\n\nDevelopment records — coach evaluations, written feedback, and training/match plans assigned to you or your team.\n\nMessages and notifications — messages sent within team or direct chats on the platform, and your notification preferences.\n\nPhotos and video — training and match footage or stills, only where separate media consent has been given (see the Photography & Media Consent document).\n\nSafeguarding reports — if a concern is raised about a player, coach or volunteer (by you or someone else), the report content, and who reviewed it and when.\n\nTechnical data — login activity, device/session information (for account security), and standard web server logs.\n\nWe don't collect payment or financial information through this platform at this time.",
  },
  {
    n: "3",
    title: "Our legal basis for using it",
    body: "Running the club (registration, team organisation, attendance, training plans, communicating with you) — necessary to perform our membership agreement with you, or to take steps you asked for before joining (Article 6(1)(b)).\n\nKeeping members safe (emergency contacts, safeguarding reports and review, vetting of staff) — our legitimate interest in running a safe club for children and adults, and in some cases a legal obligation connected to safeguarding law in Northern Ireland (Article 6(1)(c)/(f)).\n\nMedical and welfare information — this is \"special category data\" under Article 9 UK GDPR, so we only hold and use it with your explicit consent (see the Emergency Medical Treatment Consent and Data Processing Consent documents), except where we must act to protect someone's vital interests in an emergency.\n\nPhotography, video and public profiles — consent (Article 6(1)(a)), given separately and withdrawable at any time — see section 8.\n\nSecurity, audit logs and fraud prevention — our legitimate interest in keeping the platform and its data secure (Article 6(1)(f)).",
  },
  {
    n: "4",
    title: "Junior players and guardian consent",
    body: "For any player under 18, a parent or guardian creates the account, completes registration, and is the one who accepts consent documents (code of conduct, media consent, medical consent, this privacy notice) on the player's behalf. A guardian can review, update or withdraw that consent at any time by contacting the club.\n\nWe don't knowingly collect personal data directly from a child without a guardian's involvement in registration.",
  },
  {
    n: "5",
    title: "Who can see your data",
    body: "Access inside the club is limited by role — a coach only sees the players on their own team; a welfare officer sees welfare-relevant information across the club; an admin has the broadest access, for running the club as a whole. This is enforced by the platform itself, not just by policy.\n\nWe don't sell your data, and we don't share it with third parties for their own marketing. We do use a small number of service providers to run the platform, each of them only processing data on our instructions:\n\n• Hosting and application infrastructure (Vercel)\n• Database hosting (Neon, PostgreSQL)\n• Photo and video storage (Cloudflare R2 or Backblaze B2 — a private, access-controlled bucket, never public)\n• Transactional email, e.g. password resets and safeguarding notifications (Resend)\n\nSome of these providers may process data outside the UK/EEA, including in the United States. Where that happens, we rely on the UK's approved transfer safeguards (such as the UK-US Data Bridge or Standard Contractual Clauses) to keep your data protected to UK standards.\n\nWe may also share information with statutory bodies — for example the police, social services, or Sport NI's safeguarding structures — where we're legally required to, or where doing so is necessary to protect a child or adult from harm.",
  },
  {
    n: "6",
    title: "How long we keep player & member data",
    body: (
      <>
        <span>
          Proposed schedule — put together for the club to review and approve, not yet a final, adopted policy. When
          you delete your account through the platform, most personal data is deleted outright regardless of the
          table below; a small set of records that other people&apos;s history depends on (like attendance or
          messages) is anonymised rather than deleted, so the record stays accurate for everyone else without
          identifying you — see section 7.
        </span>
        <RetentionTable
          rows={[
            ["Active membership & registration records", "For as long as you're an active member"],
            ["Membership & registration records after leaving", "6 years after you leave"],
            ["Attendance & participation history", "6 years after you leave"],
            ["Coach evaluations & development feedback", "2 years after you leave"],
            ["Team & direct messages on the platform", "2 years, then anonymised"],
            [
              "Emergency contact & medical/welfare information",
              "Deleted when you leave, unless it's part of an open or resolved safeguarding record",
            ],
            [
              "Safeguarding reports and their review",
              "Until the player's 25th birthday (or, for a report about an adult, 25 years from the report)",
            ],
            ["Photos & video used under media consent", "Until consent is withdrawn, or 6 years after you leave if never withdrawn"],
            ["Login & account security records", "12 months, on a rolling basis"],
          ]}
        />
        <span style={{ display: "block", marginTop: 16 }}>
          The 6-year figure mirrors the retention period the club already applies to its own staff personnel files.
          The safeguarding period follows standard UK youth-sport safeguarding practice, since a concern can resurface
          or need to be referenced many years later — not a figure set by a specific statute, but a widely used and
          defensible approach.
        </span>
      </>
    ),
  },
  {
    n: "7",
    title: "Your rights",
    body: "Under UK GDPR you have the right to:\n\n• Access the personal data we hold about you\n• Have inaccurate data corrected\n• Ask us to delete your data (\"the right to be forgotten\"), subject to the retention needs described above\n• Restrict or object to certain uses of your data\n• Receive a copy of your data in a portable format\n• Withdraw consent at any time, where we rely on consent (this won't affect anything we did before you withdrew it)\n\nYou can exercise most of these yourself, any time, from Settings → Account on the platform: 'Export my data' gives you everything held about you as a file; 'Delete my account' removes or anonymises it as described above. For anything else, or if you're a guardian acting for a junior player, contact the club using the details in section 1.\n\nIf you're unhappy with how we've handled your data, you can complain to us directly, or to the UK's data protection regulator, the Information Commissioner's Office (ICO) — ico.org.uk.",
  },
  {
    n: "8",
    title: "Photos, video and your public profile",
    body: "We only take, use or publish photos and video of you (or your child) — on the club website, the public roster, the team channel, or social media — where separate photography & media consent has been given. It's opt-in, never assumed, and you can withdraw it at any time by contacting the club; we'll stop using new images of you going forward.\n\nA public player profile (visible to anyone on dyniblazers.co.uk/club/roster) is also opt-in and controlled per player: even with media consent given, an administrator must separately approve each part of a profile — photo, bio, season stats, highlight links — before it's shown publicly. A player who hasn't opted in simply doesn't appear on the public site at all.",
  },
  {
    n: "9",
    title: "Cookies and similar technology",
    body: "We only use cookies that are strictly necessary for the platform to work: keeping you signed in, and remembering an in-progress registration so you don't lose it if you close the tab. We don't use tracking or advertising cookies, and these necessary cookies don't require separate consent under UK law (PECR).",
  },
  {
    n: "10",
    title: "Security",
    body: "We take reasonable technical and organisational steps to protect your data: encrypted connections throughout, hashed passwords, role-based access control, audit logging of sensitive actions, and a private (non-public) storage bucket for any photos or videos. No system is completely risk-free, but we treat safeguarding and welfare data as the most sensitive category we hold and restrict it accordingly.",
  },
  {
    n: "11",
    title: "Changes to this notice",
    body: "If we materially change what we collect or why, we'll publish an updated version here and ask you to accept it again through the platform's consent system before it applies to you.",
  },
  {
    n: "12",
    title: "Staff & volunteer employment records",
    body: (
      <>
        <span>
          Coaches, welfare and medical officers and other club staff are also covered by this notice for anything
          collected to run the club (see sections 1–11) — but employment-related records are kept to the specific
          minimum periods below, set by UK employment law and the club&apos;s Staff Policies Handbook (2025–2027):
        </span>
        <RetentionTable
          rows={[
            ["PAYE & National Insurance tax code notices, taxable expenses/benefits", "3 years from the end of the relevant tax year"],
            ["National Minimum Wage records", "3 years after the pay reference period"],
            ["Working time records — holiday pay, opt-outs, night work, young workers' hours", "2 years from when the record was made"],
            ["Statutory Maternity/Adoption/Paternity/Shared Parental Pay records", "3 years after the end of the tax year the pay period ends"],
            ["Pension auto-enrolment records", "6 years (opt-out notices: 4 years)"],
            ["Immigration checks", "2 years from termination of employment"],
            ["Work-related injury records (3+ days' incapacity)", "At least 3 years"],
            ["Medical examinations related to hazardous substances", "40 years from the date of the last entry"],
            ["Whole personnel file", "Throughout employment, and up to 6 years after leaving"],
          ]}
        />
      </>
    ),
  },
  {
    n: "13",
    title: "Contact us",
    body: "Questions about this notice, or a request relating to your data: [ club contact email — to be added ].\n\nA safeguarding concern shouldn't wait for a data request — use the safeguarding report form at dyniblazers.co.uk/club/safeguarding instead, which goes straight to the club's admin team.",
  },
];

export default function PublicPrivacyPage() {
  return (
    <main>
      <section className="page-head page-head-dark">
        <div className="wrap">
          <p className="eyebrow">Legal</p>
          <h1>Privacy Policy</h1>
          <p className="lead">How DYNI Blazers collects, uses and protects your personal data — and your child&apos;s.</p>
        </div>
      </section>

      <section style={{ padding: "0 0 var(--section-y)" }}>
        <div className="wrap">
          <div className="card" style={{ borderColor: "var(--accent)" }}>
            <p className="card-label">Draft — pending sign-off</p>
            <p>
              This policy reflects what the platform actually collects and does today, but it hasn&apos;t yet been
              confirmed by the club or reviewed by a solicitor. Section 6&apos;s member/player retention schedule is
              a proposal for the club to approve, not an adopted policy; the named Data Controller (section 1) and
              contact email (section 13) are still placeholders. Please don&apos;t treat this as final until those
              are settled and the club has signed off on it.
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
