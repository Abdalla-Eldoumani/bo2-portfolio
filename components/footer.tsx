import Link from "next/link";
import { contact } from "@/lib/data/contact";
import { siteConfig } from "@/lib/site-config";

// Site colophon (CONTACT-02) — a real top-level <footer> contentinfo landmark,
// mounted in app/page.tsx AFTER </main> as a sibling (a <footer> nested inside
// <main> is a scoped footer, not the page colophon). Pure Server Component. It
// carries the same lg:pl-[280px] content-column offset as <main> so the colophon
// aligns under the content, never under the fixed 280px rail; below 1024px no
// offset applies. A 1px --color-line-faint top hairline separates it from the
// #comms section above.
//
// Subdued, quiet chrome: --color-steel ground, small type, ink-secondary /
// ink-muted, ZERO orange, ZERO status color, no chamfer drama. The identity line
// reads from siteConfig (never re-hardcoded); the original-work + built-with
// lines read from lib/data/contact. NO game wordmarks, no brand logo, no emoji
// — the original-work statement names the ABSENCE of game assets (the
// CONTACT-02 affirmation) and quotes no wordmark. ink-muted is confined here, to
// the non-essential fine print.

export function Footer() {
  return (
    <footer className="bg-steel lg:pl-[280px]">
      <div className="border-t border-line-faint px-5 py-10 sm:px-8">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
          <p className="font-mono text-data leading-[1.5] text-ink-secondary">
            {siteConfig.name} · {siteConfig.jobTitle}
          </p>
          {/* Discoverability anchor to the /resume dossier — quiet steel/ink,
              no orange, consistent with the footer's zero-accent register. */}
          <Link
            href="/resume"
            className="tap-target press-flash font-mono text-data uppercase tracking-[0.08em] text-ink-secondary"
          >
            Resume
          </Link>
          <div className="flex flex-col gap-1 sm:items-end">
            {/* Console discoverability hint (SYS-02): the footer is the quiet
                meta-chrome where the palette is most useful. Zero orange
                (the footer's locked zero-accent register); keys rendered as
                TEXT, never the glyph (scan.mjs flags non-ASCII symbols).
                Informational, not interactive — no .tap-target. Drops off paper
                (data-print-hide) — a keyboard shortcut is meaningless printed. */}
            <p
              data-print-hide
              className="flex items-center gap-2 font-mono text-stat-label uppercase tracking-[0.08em] text-ink-muted"
            >
              Console
              <kbd
                className="chamfer inline-flex"
                style={
                  {
                    "--_c": "var(--chamfer-sm)",
                    "--_edge": "var(--color-line-strong)",
                    "--_fill": "var(--color-steel)",
                  } as React.CSSProperties
                }
              >
                <span className="relative z-[1] px-2 py-1 font-mono text-stat-label normal-case tracking-normal text-ink-secondary">
                  CMD/CTRL + K
                </span>
              </kbd>
            </p>
            <p className="font-body text-stat-label leading-[1.4] text-ink-muted">
              {contact.colophon.originalWork}
            </p>
            <p className="font-body text-stat-label leading-[1.4] text-ink-muted">
              {contact.colophon.builtWith}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
