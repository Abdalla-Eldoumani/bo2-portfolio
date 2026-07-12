# Design system

All tokens live in one place: the `@theme` block in `app/globals.css`
(Tailwind CSS 4, CSS-first — there is no tailwind.config). Components
never hardcode values the theme already names.

## The scene palette

The world is a cool blue-grey hangar lit by one warm key light:

| Token | Hex | Role |
| --- | --- | --- |
| `scene-shadow` | `#0a0f13` | Deepest ground, dialog backdrops |
| `scene-base` | `#16212a` | Base environment |
| `scene-mid` | `#2b3d4a` | Mid geometry |
| `scene-haze` | `#51697a` | Atmospheric haze |
| `scene-cool` | `#a9c1ce` | Cool bounce light |
| `scene-warm` | `#ffc98c` | The warm key light |
| `scene-bounce` | `#b96a1f` | Warm bounce on geometry |

## Orange is a live wire

| Token | Hex | Role |
| --- | --- | --- |
| `orange-core` | `#ff9c1e` | Selected text, glow cores |
| `orange-hot` | `#ffb340` | Hot accents |
| `orange-fill` | `#ff9600` | The filled selection bar |
| `orange-frame` | `#e07f19` | Selected frames/borders |
| `on-orange` | `#10161b` | Text on a filled orange bar |

Orange means "this is where you are / what you can act on". The selection
language is a 4px left bar plus an orange glow on the active row — that is
the signature BO2 move and it is used everywhere something is selectable.

## Inks and accents

Text runs `ink` `#eef3f5` → `ink-2` `#9db0ba` → `ink-3` `#5f7280`, with
`ink-menu` `#cfd9de` for resting menu rows. Status accents: `green`
`#7bc24f`, `red` `#b03a30`, `gold` `#d9a441`, `olive` `#7a7f56`.

Three colors are deliberately caged:

- **Teal** `#59a8c2` appears on Mission Select surfaces only.
- **Sepia** tones appear on the 404 only (the whole chrome degrades via
  `html[data-lost]`).
- **Gold** outside the rank emblems marks only Dean's List and prestige.

## Type

Four families, all vendored as woff2 in `app/fonts` (OFL licensed, loaded
with `next/font/local`, zero font CDN):

| Family | Use |
| --- | --- |
| Agdasima 400/700 | Display — the big condensed menu voice |
| Saira Condensed 600/700 | Labels, hints, small caps chrome |
| Saira 400/500 | Body copy |
| JetBrains Mono 400/500 | Data readouts, tickers, coordinates |

## Surfaces and motion

Panels are translucent windows over the scene (`.panel`, gradient fills at
low alpha + 1px hairlines), never opaque cards. Motion uses one easing,
`--ease-tac: cubic-bezier(0.3, 0, 0, 1)` — fast attack, long settle — with
short distances (`.rise`, `.screen-enter`, the 140ms commit beat on menu
selects). `prefers-reduced-motion` collapses entrances and grain flicker
to static states. Two things keep moving on purpose: the INTEL marquee,
because it is slow ambient chrome with a hover pause, and the field sims,
because a sim only ever runs after an explicit user start.

## Print

`/resume` is the one light surface: a paper sheet (`#f5f4f0`) floating
over the dimmed scene. The print block in globals.css strips the scene and
chrome entirely, sets Letter with 0.6in margins, keeps entries unsplit,
and zooms the sheet (`[data-resume-sheet] { zoom: 0.86 }`) so the whole
record prints as exactly one page.
