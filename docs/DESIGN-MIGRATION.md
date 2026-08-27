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
| App shell (`NavBar`, layout, theme) | ✅ done | |
| Auth: login, register, set-password, registration-status | ✅ done | Register flow is restyled only — the multi-step resumable rebuild is W5 |
| Player dashboard | ✅ done | reference implementation |
| Coach dashboard | ✅ done | |
| Admin dashboard | ✅ done | |
| `StatTile`, `StatusBadge` | ✅ done | theme-aware; legacy `accent` names kept as aliases |
| All other player screens | ⏳ shimmed | legible via token remap; full pass during each module's rebuild week |
| All other coach screens | ⏳ shimmed | |
| All other admin screens | ⏳ shimmed | |
| Form components (`components/admin/*`, `components/coach/*`, …) | ⏳ shimmed | replaced with `components/ui` primitives as their screens are rebuilt |
| Radix primitive layer (Dialog, DataTable, Tabs, Toast, EmptyState…) | ⬜ not started | rest of W1 |
| `axe-core` in CI | ⬜ not started | rest of W1 |
| Per-permission declarative nav menu | ⬜ not started | rest of W1 — `NavBar` still uses per-role link maps |
