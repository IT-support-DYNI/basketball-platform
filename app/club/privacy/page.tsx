import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

/**
 * Drafted to cover what UK GDPR (Art. 13/14) requires a privacy notice to
 * say, based on what this platform actually collects and does (see
 * lib/consent.ts, prisma/schema.prisma, docs/SECURITY.md) — not generic
 * boilerplate. Three facts only the club can supply are left as clearly
 * marked placeholders: the named Data Controller/contact, the Welfare and
 * Medical Officers' names, and final retention periods (a suggested
 * approach is given, not asserted as settled). This is a working draft,
 * not a substitute for a solicitor or the club's own sign-off — see the
 * notice banner below before publishing it as final.
 */

const SECTIONS: { n: string; title: string; body: string }[] = [
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
    body: "Access inside the club is limited by role — a coach only sees the players on their own team; a welfare officer sees welfare-relevant information across the club; an admin has the broadest access, for running the club as a whole. This is enforced technically, not just by policy (see docs/FIELD-VISIBILITY.md if you'd like the technical detail).\n\nWe don't sell your data, and we don't share it with third parties for their own marketing. We do use a small number of service providers to run the platform, each of them only processing data on our instructions:\n\n• Hosting and application infrastructure (Vercel)\n• Database hosting (Neon, PostgreSQL)\n• Photo and video storage (Cloudflare R2 or Backblaze B2 — a private, access-controlled bucket, never public)\n• Transactional email, e.g. password resets and safeguarding notifications (Resend)\n\nSome of these providers may process data outside the UK/EEA, including in the United States. Where that happens, we rely on the UK's approved transfer safeguards (such as the UK-US Data Bridge or Standard Contractual Clauses) to keep your data protected to UK standards.\n\nWe may also share information with statutory bodies — for example the police, social services, or Sport NI's safeguarding structures — where we're legally required to, or where doing so is necessary to protect a child or adult from harm.",
  },
  {
    n: "6",
    title: "How long we keep it",
    body: "[ The club has not yet finalised its retention schedule — this section describes a commonly used starting point for youth sports clubs, not a final policy. It should be reviewed and confirmed by the club, ideally with input from its insurer and a data protection adviser, before this notice is treated as final. ]\n\nAs a general approach: we keep active membership and participation records for as long as you're a member, and after you leave we keep a minimal record for a limited period to meet insurance, legal and safeguarding obligations rather than deleting everything immediately. Safeguarding records in particular are typically kept for longer than ordinary membership records, in line with sector guidance, because concerns can resurface or need to be referenced years later.\n\nWhen you delete your account through the platform, most personal data is deleted outright; a small set of records that other people's history depends on (like attendance or messages) is anonymised rather than deleted, so the record stays accurate for everyone else without identifying you. See section 7 for how to do this.",
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
              confirmed by the club or reviewed by a solicitor, and it still has a few placeholders (marked in
              brackets) for facts only the club can supply — who the named Data Controller is, and the club&apos;s
              final data-retention periods. Please don&apos;t treat it as final until those are filled in and the
              club has signed off on it.
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
