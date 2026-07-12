# Make it yours

The repo is meant to be forked and reskinned into *your* portfolio. There
is no config wizard; the site is small enough to edit directly, and all
content is concentrated in `lib/data/`. No contribution needed back —
take it and go build.

## 1. Identity

- `lib/site-config.ts` — name, email, GitHub handle, LinkedIn. This one
  file feeds metadata, JSON-LD, comms, the resume header.
- `app/layout.tsx` — review the metadata keywords and JSON-LD claims;
  they describe a specific person, so rewrite them for you.

## 2. Content

Work through `lib/data/` file by file (see [data.md](data.md)). The
vitest suite (`npm run test`) encodes counts and rules about *this*
site's content — update the tests alongside the data; they are meant to
be edited, not deleted.

## 3. Art

Replace everything under `public/art/` with your own set following the
grammar in [art.md](art.md). Project art is statically imported in
`lib/data/projects.ts`, so TypeScript tells you exactly what is missing.
Replace `public/resume.pdf` and the portrait, or remove their surfaces.

## 4. Games

Each project deserves a sim that symbolizes it — that mapping is the
charm. Write yours against the four-function contract in
[field-sims.md](field-sims.md); the harness gives you the clock, input,
HUD, grain and sound for free.

## 5. Deploy

Any Next.js host works. On Vercel:

- Share cards self-correct: `siteConfig.url` reads
  `VERCEL_PROJECT_PRODUCTION_URL` at build time, so og:url matches your
  deployment out of the box.
- Fronting it with a custom domain? Set `NEXT_PUBLIC_SITE_URL` to that
  origin (e.g. `https://yourname.dev`) so canonicals and cards point at
  the domain visitors actually share.
- The CSP in `next.config.ts` is strict in production (`unsafe-eval` is
  dev-only). If you add third-party scripts, extend it consciously.

## 6. Verify before you ship

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Then the manual pass: every hint-bar key does what it advertises, games
stay contained (arrows in a sim must never move the menus; one ESC exits
only the sim), the resume prints as one Letter page, and the 404 degrades
to sepia. If you keep the theme, keep the honesty — that is the part
people feel.

## Attribution

The BO2 acknowledgment line lives in `lib/data/contact.ts`
(`colophon.originalWork`) and renders in the comms footer. Keep the
"not affiliated" phrasing if you keep the theme; it is there for a
reason. All fonts are OFL (licenses vendored in `app/fonts`).
