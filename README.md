# Abdalla Eldoumani — Portfolio

A personal portfolio styled as the **Call of Duty: Black Ops 2 menu system**:
full-viewport screens navigated like the game's lobby, a lit scene behind
translucent panels, one hot orange selection language, and keycap hints that
never lie.

Every asset is original — the scene layers, rank emblems, map-preview art,
weapon render and operator portrait are all SVG drawn in-project. No game
assets, fonts, or screenshots are used anywhere. Inspired by the Black Ops 2
menu UI; not affiliated with Activision or Treyarch.

## Screens

`/` lobby · `/dossier` service record · `/loadout` create a class ·
`/missions` mission select · `/record` combat record · `/scoreboard` live
GitHub telemetry · `/comms` contact · `/about` why this exists ·
`/resume` printable field dossier (one Letter page).

## Navigation

Everything is reachable by mouse or touch (the bottom hint bar is a working
control surface, ☰ opens the screen menu on mobile), and everything has a
key: ↑↓ ↵ on the lobby menu, ← → to cycle screens, ESC back, CTRL+P for the
resume, C copies the email address on comms, R resyncs the scoreboard.

## Stack

Next.js (App Router) · React · Tailwind CSS · TypeScript. Fully static
output; GitHub data revalidates hourly with a committed fallback snapshot.
Fonts are self-hosted (OFL: Agdasima, Saira, Saira Condensed, JetBrains
Mono). No trackers, no analytics.

## Conventions

TypeScript strict; content lives in `lib/data` (never inline in components)
with tests encoding the content contract; design tokens live in
`app/globals.css` under `@theme`; decorative art ships from `public/art`.

```bash
npm run dev        # local dev
npm run build      # static production build
npm run test       # content-contract tests
npm run lint / typecheck
```
