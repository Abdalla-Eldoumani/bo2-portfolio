# Documentation

Everything you need to understand this codebase and build your own version
of it. This is not a component library or a template with a config file:
it is a complete, opinionated site. The docs explain how it works so you
can take the ideas and make something that is yours.

| Doc | What it covers |
| --- | --- |
| [architecture.md](architecture.md) | Screens-as-routes, the chrome shell, the keyboard contract, the event bus |
| [design-system.md](design-system.md) | Tokens, the panel and selection language, motion, print, the color rules |
| [field-sims.md](field-sims.md) | The mini-game harness, the `Game` contract, how to add a game |
| [data.md](data.md) | The content layer, its types and tests, the GitHub API with fallback |
| [art.md](art.md) | The original SVG art system: backdrops, maps, emblems, the portrait |
| [make-it-yours.md](make-it-yours.md) | Fork it and reskin it as your own portfolio, step by step |

## The idea in one paragraph

A personal portfolio themed as the Call of Duty: Black Ops 2 menu system.
Not a scrolling page with game-flavored CSS: a scene-first, screen-based
UI. Every route is a full-viewport "screen" floating over one continuous
lit environment, navigated the way the game's menus are navigated — arrow
keys, Enter, ESC, and honest on-screen hints that double as buttons. All
art is original SVG produced for this project; there are no Activision or
Treyarch assets anywhere in the repo.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run test       # vitest (content contract + unit tests)
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

Set `NEXT_PUBLIC_SITE_URL` when deploying behind a custom domain so
canonical URLs and share cards point at the right origin (see
[make-it-yours.md](make-it-yours.md)).
