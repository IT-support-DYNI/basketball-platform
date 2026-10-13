# Design principles

Ten rules every page of the club site and the app should pass, distilled from a review of 50 well-regarded websites (Eleken's "50 Best Website Design Examples"). Use this list when designing a new page, reviewing a change, or building a design system. Each rule ends with how it applies to DYNI Blazers today.

1. **Make one bold type move and keep the rest calm.** One word per headline gets singled out (HeyFriends circles "effortless", Umbrel puts a gradient on "home"). Pick the word that carries the meaning, not the last word by habit.
   *DYNI:* one Fraunces-italic word per headline, in `--accent-on-bg`. "Everyone *develops* here.", not "Everyone develops *here*."

2. **Use high contrast with a single accent.** One accent colour, used for the thing that matters most, on a quiet ground.
   *DYNI:* cream paper, warm ink, one orange. Small text must still reach 4.5:1: `--text-3` (`#8B857A`) is 3.3:1 on `--bg` and fails, so use `#665F55` (5.7:1) for labels.

3. **Show the product.** Lead with the real thing, not a description of it (Endless Tools shows its workspace, Tiny Wins shows case studies).
   *DYNI:* the product is sessions and people. Show this week's sessions, real (guardian-approved) photos, roster faces and coaches, not empty photo boxes.

4. **Make primary and secondary actions clearly different.** One solid button per view, every other action outlined.
   *DYNI:* the primary is "Register for trials" (orange fill, `--on-accent` text). Every hero or section has exactly one.

5. **Back claims with proof.** Live numbers with a source (UNITED24's donations, Appwrite's GitHub stars).
   *DYNI:* show squads, players, coaches and sessions this week as final numbers with "from the club's own records". Show vetting as a count ("N of N coaches AccessNI-checked"), not only a sentence.

6. **Make every animation do a job.** "Nothing moves just for decoration" (Pitch).
   *DYNI:* no auto-advancing carousel (it also needs a pause control under WCAG 2.2.2), no cursor glow, tilt cards or word-by-word reveals. Keep motion that orients: the scroll progress bar, a "live" dot, focus and hover states. Always honour `prefers-reduced-motion`.

7. **Give each item its own colour.** Stripe Press matches each book page to its cover.
   *DYNI:* each squad owns one colour, used on its chip, its schedule rows and its card edge, everywhere the squad appears. Check each colour reaches 4.5:1 when used as text.

8. **Design the edge cases too.** 404s, errors, empty states and confirmations get the same care as the homepage (Depo Studio, Flying Papers).
   *DYNI:* add `app/not-found.tsx` and `app/error.tsx` in the club's style. Hide sections with nothing in them (news) instead of showing "Nothing posted yet" as a headline. Form errors name the field and the fix, and keep what was typed.

9. **Add small useful actions.** Copy buttons, add-to-calendar, open-in-maps (prapor.ukr's copyable colour values, Fluent's Copy button).
   *DYNI:* Copy address and Open in Maps from `Venue.address`/`mapLat`/`mapLng`; Add to calendar for public fixtures (today's per-event `.ics` route needs sign-in, so public events need a public route); Copy safeguarding email; copy the registration reference.

10. **Carry the brand through everything.** Every page, state and email looks like the same club (Teenage Engineering, the Barbie site).
    *DYNI:* sign-in, registration, 404 and error pages use the club site's paper, ink, type and orange, not the app's rounded, shadowed card style (`components/shared/auth/AuthShell.tsx`).

## Review checklist

Before shipping a page, check:

- [ ] Exactly one accent word per headline, on the meaningful word
- [ ] All text at least 4.5:1 (3:1 for 24px+), including labels and captions
- [ ] Real content above the fold, not placeholders or empty boxes
- [ ] Exactly one primary button per view
- [ ] Every claim that can be a number is a number, with its source
- [ ] Every animation has a job, and stops under reduced motion
- [ ] Repeated items (squads, events) keep their colour everywhere
- [ ] Empty, error, 404 and success states designed
- [ ] Addresses, dates and contact details are copyable or actionable
- [ ] The page looks like the rest of the club site
