import type { CSSProperties } from "react";
import { Panel } from "@/components/ui/panel";
import { navigation } from "@/lib/data/navigation";
import { contact } from "@/lib/data/contact";
import { siteConfig } from "@/lib/site-config";

// After-action / squad-invite contact surface (#comms) — CONTACT-01. A pure
// Server Component: three static <a> channels under a plain-English invitation
// line, legible and operable with JavaScript disabled (no form, no client
// island, no clipboard leaf). Mirrors the sibling shell (bg-steel, 1200px
// measure, Panel header strip with a real <h2 tabIndex={-1}>) and, like the
// siblings, does NOT use .panel-reveal (its scripting-gated hidden state needs a
// client [data-revealed] this Server surface cannot set).
//
// The section's ONE orange is the EMAIL chip — the primary comm channel and the
// recruiter's conversion point (DESIGN_SYSTEM reserves --accent for the primary
// CTA; the primary CTA of a contact section is the fastest contact path). It is
// accent-on-transparent at rest and fills --color-accent with --color-void text
// on hover via a hover:[--_fill:var(--color-accent)] arbitrary variant +
// group-hover:text-void (the mission-modal precedent — no new global CSS).
// EMAIL-is-primary is reinforced non-color by ORDER (always first) + the
// "PRIMARY CHANNEL" label, so it survives forced-colors. GITHUB and LINKEDIN are
// steel chips (line-strong edge, ink text) carrying zero orange, both external
// with target="_blank" rel="noopener noreferrer" (reverse-tabnabbing guard). The
// mailto anchor gets NEITHER target NOR rel — it is a same-nav protocol handoff.
// No brand logos (the GitHub octocat / LinkedIn "in" mark are third-party
// trademarks); text carries channel identity.

// Framing labels for the section header (theme copy, no source data file). The
// heading + subtitle come from navigation.ts so the id, label, and subtitle stay
// one source with the rail row this section unlocks.
const comms = navigation.find((item) => item.id === "comms")!;

// The email chip: accent-on-transparent, hover fills --color-accent / void text.
const ACCENT_CHIP: CSSProperties = {
  "--_c": "var(--chamfer-sm)",
  "--_edge": "var(--color-accent)",
  "--_fill": "var(--color-void)",
} as CSSProperties;

// The github/linkedin chips: steel edge, panel ground.
const STEEL_CHIP: CSSProperties = {
  "--_c": "var(--chamfer-sm)",
  "--_edge": "var(--color-line-strong)",
  "--_fill": "var(--color-panel)",
} as CSSProperties;

// Readable linkedin handle derived from the siteConfig URL (never the raw
// https:// string): "https://www.linkedin.com/in/abdallaeldoumani/" -> "in/abdallaeldoumani".
const linkedinHandle = siteConfig.linkedin
  .replace(/^https?:\/\/(www\.)?linkedin\.com\//, "")
  .replace(/\/$/, "");

export function AfterAction() {
  return (
    <section
      id="comms"
      aria-labelledby="comms-heading"
      className="bg-steel px-5 py-12 sm:px-8 sm:py-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Header strip: real <h2> + subtitle. No accent here (the one orange is
            the EMAIL chip). */}
        <Panel>
          <div className="flex flex-col gap-2 p-5">
            <h2
              id="comms-heading"
              tabIndex={-1}
              className="font-display text-h2 uppercase tracking-[0.04em] text-ink"
            >
              {comms.label}
            </h2>
            <p className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
              {comms.subtitle}
            </p>
          </div>
        </Panel>

        {/* Invitation block: the plain-English conversion line (Inter body, <=68ch).
            The "email" run lifts to --color-ink; the rest stays ink-secondary. */}
        <Panel className="mt-8">
          <div className="p-5 sm:p-6">
            <p className="max-w-[68ch] font-body text-body leading-[1.6] text-ink-secondary">
              {contact.invitation.map((run, index) =>
                "em" in run ? (
                  <span key={index} className="font-medium text-ink">
                    {run.em}
                  </span>
                ) : (
                  <span key={index}>{run.text}</span>
                ),
              )}
            </p>
          </div>
        </Panel>

        {/* Channel group: EMAIL first (the one orange), then GITHUB, then
            LINKEDIN. Stacked full-width at 375, a row of three at >=640; each chip
            is one anchor, opts into .tap-target, and preserves EMAIL-first order. */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* EMAIL — primary channel, mailto (NO target, NO rel). */}
          <a
            href={`mailto:${siteConfig.email}`}
            aria-label={`Email Abdalla at ${siteConfig.email}`}
            className="group tap-target chamfer press-flash flex flex-col justify-center gap-1 p-4 hover:[--_fill:var(--color-accent)]"
            style={ACCENT_CHIP}
          >
            <span className="relative z-[1] flex flex-col gap-1">
              <span className="font-display text-lead uppercase tracking-[0.04em] text-accent group-hover:text-void">
                Email
              </span>
              <span className="font-label text-stat-label uppercase tracking-[0.08em] text-accent group-hover:text-void">
                Primary Channel
              </span>
              <span className="break-all font-mono text-data leading-[1.4] text-accent group-hover:text-void">
                {siteConfig.email}
              </span>
            </span>
          </a>

          {/* GITHUB — secondary steel channel, external. */}
          <a
            href={siteConfig.github}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target chamfer press-flash flex flex-col justify-center gap-1 p-4"
            style={STEEL_CHIP}
          >
            <span className="relative z-[1] flex flex-col gap-1">
              <span className="font-display text-lead uppercase tracking-[0.04em] text-ink">
                GitHub
              </span>
              <span className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
                Source
              </span>
              <span className="break-all font-mono text-data leading-[1.4] text-ink-secondary">
                {siteConfig.callsign}
              </span>
            </span>
          </a>

          {/* LINKEDIN — secondary steel channel, external. */}
          <a
            href={siteConfig.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="tap-target chamfer press-flash flex flex-col justify-center gap-1 p-4"
            style={STEEL_CHIP}
          >
            <span className="relative z-[1] flex flex-col gap-1">
              <span className="font-display text-lead uppercase tracking-[0.04em] text-ink">
                LinkedIn
              </span>
              <span className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
                Network
              </span>
              <span className="break-all font-mono text-data leading-[1.4] text-ink-secondary">
                {linkedinHandle}
              </span>
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
