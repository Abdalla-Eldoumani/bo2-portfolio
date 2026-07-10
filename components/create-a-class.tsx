import type { CSSProperties } from "react";
import { Panel } from "@/components/ui/panel";
import { loadout } from "@/lib/data/skills";

// Create-a-class loadout (#loadout) — the BO2 loadout surface beneath the
// dossier. Server Component: pure static markup, legible with JavaScript
// disabled (no `.panel-reveal`, whose scripting-gated hidden state would vanish
// for JS-enabled visitors on a Server-only surface). It renders lib/data/skills
// verbatim — the 37 skill names map over `loadout.primary/.secondary/.perks`
// (never re-typed) and the two wildcards over `loadout.wildcards`; only the
// group/meter framing labels are added strings.
//
// The section's ONE orange element is the Pick 10 meter (its filled pips + the
// counter current-value, --color-accent-bright). Everything else is steel/ink:
// skill chips and wildcard cards carry a steel --color-line-strong equipped-slot
// cue, never accent (per-region accent budget — one competing element).
//
// The meter is a `role="progressbar"` fixed at 10/10 (the BO2 "complete valid
// build" conceit — no client counter, so the section stays a Server Component).
// Its ten pips are aria-hidden; the value is carried by the progressbar
// semantics + aria-valuetext + the always-visible "10 / 10 ALLOCATED" text (the
// forced-colors-proof, never-color-only signal). The pips fill via the pip-fill
// one-shot (globals.css) whose no-animation resting frame IS the filled 10/10
// state, so reduced motion lands them there instantly.

// Slot groups — three full-width stacked regions mapping the matching `loadout`
// array in source order. Counts derive from array length so they cannot drift
// from the data (decorative, aria-hidden; ink-secondary — ink-muted fails AA
// at text-stat-label size on steel, the Lighthouse closeout catch).
const slotGroups = [
  { label: "Primary", skills: loadout.primary },
  { label: "Secondary", skills: loadout.secondary },
  { label: "Perks", skills: loadout.perks },
] as const;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

// Ten discrete integer pips — a fixed-size slanted cell each (component
// dimensions by breakpoint, not spacing rungs). Resting look = filled
// accent-bright with the inner top highlight; the pip-fill keyframe animates
// from the empty panel/line-faint frame en route to this resting state.
const pipStyle: CSSProperties = {
  transform: "skewX(var(--skew))",
  backgroundColor: "var(--color-accent-bright)",
  border: "1px solid var(--color-accent-bright)",
  boxShadow: "inset 0 1px 0 var(--edge-highlight)",
};

function Pick10Meter() {
  return (
    <div
      role="progressbar"
      aria-label="Pick 10 loadout allocation"
      aria-valuenow={10}
      aria-valuemin={0}
      aria-valuemax={10}
      aria-valuetext="10 of 10 loadout points allocated"
      className="flex flex-col gap-2 sm:items-end"
    >
      {/* Ten aria-hidden pip cells; the value is carried by the progressbar
          semantics + the visible text below. */}
      <div aria-hidden="true" className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
        {Array.from({ length: 10 }, (_, index) => (
          <span
            key={index}
            className="pip-fill block h-[9px] w-[18px] sm:h-[11px] sm:w-[22px] lg:h-[12px] lg:w-[26px]"
            style={pipStyle}
          />
        ))}
      </div>
      {/* Visible, forced-colors-proof text alternative. */}
      <p className="flex items-baseline gap-1.5">
        <span className="font-mono text-h3 font-bold tabular-nums text-accent-bright">
          10
        </span>
        <span className="font-mono text-h3 tabular-nums text-ink-muted">/ 10</span>
        <span className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
          Allocated
        </span>
      </p>
    </div>
  );
}

// Non-interactive skill chip: a compact chamfered tile with a 3px steel left
// tick (the equipped-slot cue, never orange — ink-muted as a border reads a
// full step brighter than line-strong over the panel fill, so the slot metaphor
// registers on screen, not just in the DOM; 3px stays under the scan's
// thick-left-accent threshold). Name renders verbatim in the DOM (uppercased in
// CSS only) so C/C++, Next.js, OpenAI API keep exact characters.
function SkillChip({ name }: { name: string }) {
  return (
    <span
      className="chamfer inline-flex"
      style={{ "--_c": "var(--chamfer-sm)" } as CSSProperties}
    >
      <span className="relative z-[1] flex items-center border-l-[3px] border-ink-muted px-4 py-2 font-display text-body uppercase tracking-[0.04em] text-ink">
        {name}
      </span>
    </span>
  );
}

export function CreateAClass() {
  return (
    <section
      id="loadout"
      aria-labelledby="loadout-heading"
      className="bg-steel px-5 py-12 sm:px-8 sm:py-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Header strip: real <h2> + subtitle on the left, the Pick 10 meter on
            the right (mirroring the dossier clearance-tag position), stacking
            under the heading on mobile. */}
        <Panel>
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex flex-col gap-2">
              <h2
                id="loadout-heading"
                tabIndex={-1}
                className="font-display text-h2 uppercase tracking-[0.04em] text-ink"
              >
                Create a Class
              </h2>
              <p className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
                Skill Loadout and Wildcards
              </p>
            </div>
            <Pick10Meter />
          </div>
        </Panel>

        {/* Slot groups: PRIMARY / SECONDARY / PERKS, each a labelled region with
            a flex-wrap chip grid over the matching data array. */}
        <div className="mt-8 flex flex-col gap-6 sm:mt-12 sm:gap-8">
          {slotGroups.map((group) => (
            <div key={group.label}>
              <div className="flex items-baseline gap-2 border-b border-line-faint pb-2">
                <h3 className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
                  {group.label}
                </h3>
                <span
                  aria-hidden="true"
                  className="font-mono text-stat-label tabular-nums text-ink-secondary"
                >
                  · {pad2(group.skills.length)}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <SkillChip key={skill} name={skill} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Wildcard region: two multi-line panels, visually distinct from the
            single-line chips by size + chamfer + prose body (hierarchy, not
            accent). Names + notes are verbatim from lib/data. */}
        <div className="mt-8 sm:mt-12">
          <div className="flex items-baseline gap-2 border-b border-line-faint pb-2">
            <h3 className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
              Wildcards
            </h3>
            <span
              aria-hidden="true"
              className="font-mono text-stat-label tabular-nums text-ink-secondary"
            >
              · {pad2(loadout.wildcards.length)}
            </span>
          </div>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            {loadout.wildcards.map((card) => (
              <Panel key={card.name}>
                <div className="border-l-[3px] border-line-strong p-5 sm:p-6">
                  <p className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
                    Wildcard
                  </p>
                  <h4 className="mt-3 font-display text-lead uppercase tracking-[0.04em] text-ink">
                    {card.name}
                  </h4>
                  <p className="mt-3 max-w-[68ch] font-body text-body leading-[1.6] text-ink-secondary">
                    {card.note}
                  </p>
                </div>
              </Panel>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
