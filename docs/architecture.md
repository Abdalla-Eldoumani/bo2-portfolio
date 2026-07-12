# Architecture

## Screens, not pages

The site is a set of full-viewport screens, one route each:

| Route | Screen |
| --- | --- |
| `/` | Lobby - main menu, featured-op carousel, INTEL ticker |
| `/dossier` | Operator dossier (about the person) |
| `/loadout` | Skills as a create-a-class loadout |
| `/missions` | Mission select - projects as ops, each with a field sim |
| `/record` | Combat record - experience and education |
| `/scoreboard` | Live GitHub stats |
| `/comms` | Contact channels |
| `/about` | Why this site looks the way it does |
| `/resume` | The field dossier: printable one-page resume |
| anything else | The 404 - a "signal lost" screen in a sepia register |

Nothing scrolls except inside a screen's own panels. The app router owns
transitions; each screen mounts with a short `screen-enter` rise.

## The chrome

`components/chrome/` is the persistent machine around every screen:

- `scene.tsx` - the environment. Three variants (hero, interior, lost)
  stack SVG backdrop layers over a CSS gradient ground, plus grain,
  scanlines and vignette: hero and interior draw floodlights, silhouettes
  and bokeh; lost draws sepia silhouettes alone. The scene is why screens
  feel like one place instead of ten pages.
- `top-bar.tsx` - status cluster (screen name, clock, SFX switch) and the
  playercard chip that links home.
- `hint-bar.tsx` - the BO2 button-prompt strip. Every chip is honest: the
  advertised key has a real handler, and every chip with an action is also
  a clickable button, so mouse-first visitors never need the keyboard.
- `chrome.tsx` - global keys: ESC backs out to the lobby, ← / → cycle the
  interior screens, CTRL+P routes to the resume.
- `nav-overlay.tsx` - the mobile ☰ full-screen menu (a native `<dialog>`).
- `boot-in.tsx` - the once-per-session "ESTABLISHING UPLINK" boot.

## The keyboard contract

One rule keeps the whole input system sane: **an open `<dialog>` owns the
keyboard.** Every global or screen-level key handler early-returns when
`document.querySelector('dialog[open]')` is truthy. The field-sim dialog
additionally intercepts its game keys on `window` in the capture phase,
so arrows and Enter can never leak out of a running game, and one ESC
closes only the dialog (native behavior, deliberately untouched).

## The event bus

Hint-bar chips that trigger screen-local behavior (COPY, RESYNC, FIELD
SIM) dispatch a `bo2-action` CustomEvent on `window`; the owning screen
listens. This keeps the chrome generic and the screens self-contained.

## Sound

`lib/sfx.ts` synthesizes every interface cue with WebAudio - menu ticks,
selection punches, back-outs, the sim deploy sting. No audio assets, no
music. The AudioContext is created lazily inside the first user gesture,
and the top-bar SFX switch persists an off state in localStorage.

## Directory map

```
app/                one folder per route + globals.css (all tokens/systems)
components/
  chrome/           the persistent shell (above)
  <screen>/         one folder per screen
  ui/               shared atoms (event glyphs)
lib/
  data/             ALL site content (single source of truth, tested)
  api/              GitHub fetch with committed fallback
  types/            content types
  utils/            small tested helpers (relative time, sync stamps)
  sfx.ts            the WebAudio cue synth
  site-config.ts    identity + canonical URL resolution
public/art/         original SVG production art
docs/               you are here
```
