import { Panel } from "@/components/ui/panel";
import { siteConfig } from "@/lib/site-config";
import { bio } from "@/lib/data/bio";
import { education } from "@/lib/data/experience";

// Service-record dossier (#dossier) — the classified-file bio beneath the hero.
// Server Component: pure static markup, legible with JavaScript disabled
// (ABOUT-01). It deliberately avoids the scripting-gated reveal class: that
// class hides its content behind @media (scripting: enabled) until a client
// sets [data-revealed], and this Server-only phase has no client to set it — the
// dossier would vanish for JS-enabled visitors. Scroll-reveal is deferred to a
// client-boundary phase.
// Every essential field value uses --color-ink / ink-secondary (never ink-muted).
// Orange is spent on exactly one element here — the clearance tag.

const callsign = siteConfig.callsign;

// File field rows — labels are theme framing; values are verbatim data facts
// composed from site-config + experience.education + bio (no inline copy).
const fields = [
  { label: "Name", value: siteConfig.name },
  { label: "Callsign", value: callsign },
  { label: "MOS", value: siteConfig.jobTitle },
  { label: "Station", value: bio.station },
  { label: "Origin", value: bio.origin },
  {
    label: "Clearance",
    value: `${education.degree}, ${education.minor} — ${education.institution} (${education.duration})`,
  },
  { label: "Commendations", value: `${education.honors} · GPA ${education.gpa}` },
  { label: "Status", value: bio.status },
] as const;

export function ServiceRecord() {
  return (
    <section
      id="dossier"
      aria-labelledby="dossier-heading"
      className="bg-steel px-5 py-12 sm:px-8 sm:py-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Classified-file header strip: real <h2>, decorative file reference
            (ink-muted allowed — non-essential flavor), and the single orange
            clearance tag as a 1px accent-bordered chip. */}
        <Panel>
          <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <h2
              id="dossier-heading"
              tabIndex={-1}
              className="font-display text-h2 uppercase tracking-[0.04em] text-ink"
            >
              Service Record
            </h2>
            <div className="flex flex-col gap-2 sm:items-end">
              <span
                aria-hidden="true"
                className="font-mono text-stat-label tabular-nums text-ink-muted"
              >
                {bio.fileRef}
              </span>
              <span
                className="chamfer inline-block px-2 py-1"
                style={
                  {
                    "--_c": "var(--chamfer-sm)",
                    "--_edge": "var(--color-accent)",
                    "--_fill": "var(--color-panel)",
                  } as React.CSSProperties
                }
              >
                <span className="relative z-[1] font-label text-stat-label uppercase tracking-[0.08em] text-accent">
                  {bio.clearanceTag}
                </span>
              </span>
            </div>
          </div>
        </Panel>

        {/* Redaction-style divider: decorative flavor only, aria-hidden, placed
            outside every real value so no fact is ever obscured. */}
        <div aria-hidden="true" className="mt-8 h-px w-16 bg-line-strong" />

        {/* File field rows: <dl> grid inside a chamfered panel so the body
            carries the same classified register as the header strip. */}
        <Panel className="mt-8">
          <dl className="grid gap-6 p-5 sm:grid-cols-2 sm:p-8">
            {fields.map((field) => (
              <div key={field.label} className="flex flex-col gap-2">
                <dt className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
                  {field.label}
                </dt>
                <dd className="font-mono text-button leading-[1.4] tabular-nums text-ink">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        </Panel>

        {/* Bio prose: two paragraphs from bio.ts, sentence case, 68ch measure.
            {em} runs lift to --color-ink at weight 500; {text} runs stay
            --color-ink-secondary (inherited from the paragraph). */}
        <div className="mt-8 flex max-w-[68ch] flex-col gap-4 sm:mt-12">
          {bio.prose.map((paragraph, paragraphIndex) => (
            <p
              key={paragraphIndex}
              className="font-body text-body leading-[1.6] text-ink-secondary"
            >
              {paragraph.map((run, runIndex) =>
                "em" in run ? (
                  <span key={runIndex} className="font-medium text-ink">
                    {run.em}
                  </span>
                ) : (
                  run.text
                ),
              )}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
