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
          <div className="flex flex-col gap-1 sm:items-end">
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
