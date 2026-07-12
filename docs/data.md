# Content and data

## One source of truth

Every word on the site lives in `lib/data/` — projects, experience,
skills, navigation, contact, the about copy. Components render data; they
never carry content inline. Change a fact in one file and every surface
that shows it (screen, resume sheet, ticker, OG description) updates.

| File | Owns |
| --- | --- |
| `projects.ts` | The 8 missions: slug, description, tech, metrics, links, art |
| `experience.ts` | Roles (newest first) + education |
| `skills.ts` | The loadout: primary/secondary/tactical/wildcards |
| `navigation.ts` | The 7 destinations + the lobby item |
| `contact.ts` | Channels, invitation line, footer colophon |
| `about.ts` | The why-BO2 story, operator bio, capability→proof table |

Types live in `lib/types/` and data conforms via `satisfies` — never a
cast — so a shape mistake is a compile error.

## The contract is tested

`lib/data/*.test.ts` encode editorial rules as vitest assertions: exactly
8 missions, unique slugs, retired projects stay absent, a project without
a deployment has no live link, every op ships art, navigation order ends
with About. Editing content and its test in the same change is the
convention; the suite is the reviewer that never sleeps.

## Live GitHub data

`lib/api/github.ts` feeds the scoreboard and the ticker:

- `fetch` with `next: { revalidate: 3600, tags: ['github'] }`,
- a committed JSON snapshot as fallback, so the site renders complete
  with the API rate-limited, blocked, or down — the fallback state is a
  designed state, not an error page,
- R / RESYNC on the scoreboard calls a server action that drops the
  tagged cache (`updateTag('github')`) and refreshes.

## Static-first images

Project art is imported as `StaticImageData`, never a string path: a
missing file is a build error instead of a silent 404 at runtime.
