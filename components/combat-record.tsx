import type { CSSProperties } from "react";
import { Panel } from "@/components/ui/panel";
import { RankBadge, IntelMark } from "@/components/ui/rank-badge";
import { cn } from "@/lib/utils/cn";
import {
  experiences,
  education,
  getCurrentExperience,
} from "@/lib/data/experience";

// Combat-record (#record) — the career rank ladder + the education clearance
// record. Pure Server Component (no "use client", no client leaf, zero client
// JS): the section is a static reverse-chronological resume timeline, legible
// with JavaScript disabled (SYS-03). Like the siblings it does NOT use
// `.panel-reveal` (its scripting-gated hidden state would vanish for JS-enabled
// visitors on a Server-only surface). Mirrors the service-record / mission-select
// shell (bg-steel px-5 py-12 sm:px-8 sm:py-16 lg:py-24, 1200px measure).
//
// Order is `experiences` SOURCE ORDER — already newest-first (current -> earliest)
// — rendered as a real <ol> (rank progression is ordered). The current role is
// resolved via getCurrentExperience() (keys on the open-ended "Present" duration),
// never a hardcoded index; it carries the section's ONE orange, spent on the
// PRESENT operation-window token. All other content is steel/ink. Content is
// rendered VERBATIM from lib/data/experience.ts — only framing labels are added.

// The current role's active status is spatial/structural (48px badge, text-h3
// name, Panel active edge, spine node ring, "ACTIVE DUTY" text) — the badge stays
// steel; a second orange glyph would edge toward a disallowed ladder of orange.
const current = getCurrentExperience();

// Steel commendation chip (education) — a small chamfer with a 3px line-strong
// left tick (border-l-[3px]), ALL-CAPS ink. The thicker 4-step utility is the
// scan tell and is avoided.
const CHIP_CHAMFER: CSSProperties = { "--_c": "var(--chamfer-sm)" } as CSSProperties;

// Original steel achievement/highlight marker: a 12-deg-skewed line-strong dash,
// aria-hidden — never a disc, never orange, never emoji.
function BulletMarker() {
  return (
    <span
      aria-hidden="true"
      className="mt-[0.6em] h-0.5 w-3 shrink-0 -skew-x-12 bg-line-strong"
    />
  );
}

function BulletList({ items }: Readonly<{ items: readonly string[] }>) {
  return (
    <ul className="flex list-none flex-col gap-2">
      {items.map((item) => (
        <li key={item} className="flex gap-4">
          <BulletMarker />
          <span className="max-w-[68ch] font-body text-body leading-[1.6] text-ink-secondary">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

type Role = (typeof experiences)[number];

// One rank rung. `isCurrent` drives every active cue; `ordinal` is the position-
// derived RANK NN flavor (aria-hidden, never a stored value). `isLast` trims the
// decorative spine tail on the earliest rung.
function RankRung({
  role,
  isCurrent,
  ordinal,
  isLast,
}: Readonly<{ role: Role; isCurrent: boolean; ordinal: string; isLast: boolean }>) {
  const badgeSize = isCurrent
    ? "h-12 w-12 text-ink-secondary"
    : "h-8 w-8 text-ink-muted";
  // Current-rung operation window: split the duration at "Present" so the
  // trailing token renders as the section's one orange (uppercased in CSS).
  const presentPrefix = isCurrent
    ? role.duration.slice(0, role.duration.indexOf("Present"))
    : role.duration;

  return (
    <li className="grid gap-4 md:grid-cols-[56px_minmax(0,1fr)]">
      {/* Badge column (md+): the 1px line-faint spine with the rank badge as a
          node. Decorative, aria-hidden. The current node gets a line-strong ring
          and the badge steps up to 48px. */}
      <div aria-hidden="true" className="relative hidden md:block">
        <span
          className={cn(
            "absolute left-1/2 top-6 w-px -translate-x-1/2 bg-line-faint",
            isLast ? "h-6" : "bottom-[-16px]",
          )}
        />
        <span className="relative z-[1] flex justify-center pt-4">
          <span
            className={cn(
              "inline-flex bg-steel p-1",
              isCurrent && "ring-1 ring-line-strong",
            )}
          >
            <RankBadge id={role.insigniaId} active={isCurrent} className={badgeSize} />
          </span>
        </span>
      </div>

      <Panel active={isCurrent}>
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          {/* Eyebrow: deployment tag + (current) ACTIVE DUTY steel tag + the
              decorative rank ordinal. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
              {role.type}
            </span>
            {isCurrent ? (
              <span className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
                Active Duty
              </span>
            ) : null}
            <span
              aria-hidden="true"
              className="font-mono text-stat-label uppercase tabular-nums text-ink-muted"
            >
              Rank {ordinal}
            </span>
          </div>

          {/* Role name; the badge rides beside it only at mobile (md+ shows it as
              the spine node). */}
          <div className="flex items-center gap-3">
            <RankBadge
              id={role.insigniaId}
              active={isCurrent}
              className={cn("shrink-0 md:hidden", badgeSize)}
            />
            <h3
              className={cn(
                "font-display uppercase tracking-[0.04em] text-ink",
                isCurrent ? "text-h3" : "text-lead",
              )}
            >
              {role.role}
            </h3>
          </div>

          <p className="font-label text-data leading-[1.4] text-ink-secondary">
            {role.company} · {role.location}
          </p>

          <div className="flex flex-col gap-2">
            <p className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
              Operation Window
            </p>
            <p className="font-mono text-button leading-[1.4] tabular-nums text-ink">
              {presentPrefix}
              {isCurrent ? (
                <span className="font-bold uppercase text-accent">Present</span>
              ) : null}
            </p>
          </div>

          <p className="max-w-[68ch] font-body text-body leading-[1.6] text-ink-secondary">
            {role.description}
          </p>

          <BulletList items={role.achievements} />
        </div>
      </Panel>
    </li>
  );
}

// Education fields — labels are framing; values are verbatim data facts.
// minor/honors are OPTIONAL in the contract: guard them so a future one-file
// content edit that drops either never renders "undefined" or a blank chip.
const eduFields = [
  {
    label: "Program",
    value: education.minor
      ? `${education.degree} · ${education.minor}`
      : education.degree,
  },
  { label: "Institution", value: education.institution },
  { label: "Location", value: education.location },
  { label: "Operation Window", value: education.duration },
] as const;

// Commendation chips — verbatim honors (when present) + GPA, steel (zero orange).
const commendations = [education.honors, `GPA ${education.gpa}`].filter(
  (value): value is string => Boolean(value),
);

function ClearanceRecord() {
  return (
    <div className="mt-8">
      {/* Labelled divider band separating the clearance record from the ladder. */}
      <div className="flex items-center gap-4">
        <span className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
          Clearance Record
        </span>
        <span aria-hidden="true" className="h-px flex-1 bg-line-strong" />
      </div>

      <Panel className="mt-6">
        <div className="flex flex-col gap-6 p-5 sm:p-8">
          {/* Header: the intel mark (a document motif, NOT a rank badge) beside
              the degree. */}
          <div className="flex items-center gap-3">
            <IntelMark className="h-8 w-8 shrink-0 text-ink-secondary" />
            <h3 className="font-display text-lead uppercase tracking-[0.04em] text-ink">
              {education.degree}
            </h3>
          </div>

          {/* Field register — a <dl> grid, the structural distinction from a rank
              rung. The future "Jun 2027" end date is a plain mono date, no PRESENT
              token (the section's only PRESENT is the current role). */}
          <dl className="grid gap-6 sm:grid-cols-2">
            {eduFields.map((field) => (
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

          {/* Commendations — steel chips (zero orange), verbatim honors + GPA. */}
          <div className="flex flex-col gap-2">
            <p className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
              Commendations
            </p>
            <div className="flex flex-wrap gap-2">
              {commendations.map((label) => (
                <span key={label} className="chamfer inline-flex" style={CHIP_CHAMFER}>
                  <span className="relative z-[1] flex items-center border-l-[3px] border-line-strong px-4 py-2 font-label text-stat-label uppercase tracking-[0.08em] text-ink">
                    {label}
                  </span>
                </span>
              ))}
            </div>
          </div>

          <p className="max-w-[68ch] font-body text-body leading-[1.6] text-ink-secondary">
            {education.description}
          </p>

          <BulletList items={education.highlights} />
        </div>
      </Panel>
    </div>
  );
}

export function CombatRecord() {
  const total = experiences.length;
  return (
    <section
      id="record"
      aria-labelledby="record-heading"
      className="bg-steel px-5 py-12 sm:px-8 sm:py-16 lg:py-24"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        {/* Header strip: real <h2> + subtitle, no accent (the section's one orange
            is the PRESENT token on the top rung). */}
        <Panel>
          <div className="flex flex-col gap-2 p-5">
            <h2
              id="record-heading"
              tabIndex={-1}
              className="font-display text-h2 uppercase tracking-[0.04em] text-ink"
            >
              Combat Record
            </h2>
            <p className="font-label text-stat-label uppercase tracking-[0.08em] text-ink-secondary">
              Career Rank Progression
            </p>
          </div>
        </Panel>

        {/* Rank ladder: real <ol>, source order (newest-first), 24px between rungs. */}
        <ol className="mt-8 flex list-none flex-col gap-6">
          {experiences.map((role, index) => (
            <RankRung
              key={role.role}
              role={role}
              isCurrent={role === current}
              ordinal={String(total - index).padStart(2, "0")}
              isLast={index === total - 1}
            />
          ))}
        </ol>

        {/* Education clearance record — a distinct register, zero orange. */}
        <ClearanceRecord />
      </div>
    </section>
  );
}
