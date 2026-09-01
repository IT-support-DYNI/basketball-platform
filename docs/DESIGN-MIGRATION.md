# DYNI Blazers design migration

Tracks the move from the original light "Hoops Platform" styling to the
DYNI Blazers dark-first design system. Started W1 of the delivery plan.

## The system

- **Tokens** — `app/globals.css` (CSS custom properties, RGB channel triplets so
  Tailwind opacity modifiers work) mirrored in `lib/design/tokens.ts` for JS
  consumers. Dark is the default; light + explicit `[data-theme]` overrides.
- **Tailwind** — `tailwind.config.ts` maps every colour utility to a token, so
  utilities are theme-aware with no `dark:` variants.
- **Fonts** — Archivo (display), Inter (body), Barlow Condensed (data/numerals),
  IBM Plex Mono (labels), wired in `app/layout.tsx`.
- **Primitives** — `components/ui/` (Button, TextField, Select, Alert, Card,
  PageHeader) and `components/theme/` (ThemeScript, ThemeToggle).
- **Brand** — `components/Brandmark.tsx`, assets in `public/brand/` +
  `public/icons/`.

## Transitional shims (remove when migration completes)

- `tailwind.config.ts` remaps the `slate` and `court` colour scales onto DYNI
  tokens so un-migrated screens stay legible in both themes.
- A bulk edit replaced `bg-white` → `bg-surface` and `bg-slate-800/900` →
  `bg-flame` across the codebase.
- Pastel tint utilities (`bg-emerald-50`, `bg-rose-50`, `bg-amber-50`, …) are
  still literal light colours — visually loud on dark. ~14 usages, all in
  status chips inside forms. Fixed per-screen during each module's rebuild.

## Screen status

| Area | Status | Notes |
|---|---|---|
| App shell (`NavBar`, layout, theme) | ✅ done | `components/nav/PrimaryNav.tsx` — same destinations everywhere, placed per breakpoint. `lg+`: one sticky **top** bar (brand · ≤4 primary pills via `primaryNavFor` · "More" · player bell). `<lg`: slim top bar (brand + bell) + a fixed **bottom** bar with the same tabs + "More". "More" opens a shared bottom-anchored drawer (full menu + identity + theme + sign-out). `AppContainer` is the shared page frame (fluid gutters; extra bottom room on mobile for the bar). |
| Auth: login, register, set-password, registration-status | ✅ done | Register flow is restyled only — the multi-step resumable rebuild is W5 |
| Player dashboard | ✅ done | reference implementation |
| Coach dashboard | ✅ done | |
| Admin dashboard | ✅ done | |
| `StatTile`, `StatusBadge` | ✅ done | theme-aware; legacy `accent` names kept as aliases |
| All other player screens | ⏳ shimmed | legible via token remap; full pass during each module's rebuild week. Legacy `<table>`s wrapped in `overflow-x-auto` + `min-w-*` so they scroll rather than crush on mobile. |
| All other coach screens | ⏳ shimmed | as above |
| All other admin screens | ⏳ shimmed | as above |
| Form components (`components/admin/*`, `components/coach/*`, …) | ⏳ shimmed | replaced with `components/ui` primitives as their screens are rebuilt |
| Radix primitive layer | ✅ done | `components/ui`: Button, TextField, Select, Checkbox, RadioGroup, Field (FieldError/FieldHint/ErrorSummary), Card, Badge, Alert, PageHeader, Skeleton/LoadingState/EmptyState/ErrorState/PermissionDenied, Dialog, Tabs, DropdownMenu, Tooltip, Toast (+ `useToast`), DataTable |
| `axe-core` in CI | ✅ done | `components/ui/ui.a11y.test.tsx` (Vitest + jest-axe), run by `.github/workflows/ci.yml` alongside lint + typecheck + build |
| Per-permission declarative nav menu | ✅ done | `lib/navigation.ts` — capability-keyed, merges + de-dupes for multi-role users; `NavBar` + `NavLinks` (active-state highlighting) consume it |

## W1 complete

Foundation, brand, primitives, nav and CI are in place. Remaining migration is
per-screen and happens during each module's rebuild week (W3 onward).

## Responsive shell (W4 follow-up)

The app now adapts down to a 375px phone: shell height went from a 426px
wrapping link stack to a ~53px top bar + ~56px bottom bar, no page has
horizontal bleed, and every table either reflows (`DataTable`) or scrolls inside
its own container. The same 4-primary + "More" destinations are used at every
breakpoint (`components/nav/PrimaryNav.tsx`); below `lg` they sit in a fixed
bottom bar, at `lg`+ they move into a single sticky **top** bar as pills next to
the brand. **Still to do** as each module is rebuilt: migrate the remaining raw
`<table>` pages onto the `DataTable` primitive (which collapses to stacked
cards) instead of horizontal scroll, and give `TeamManager`'s inline roster
editor a card layout on mobile.
