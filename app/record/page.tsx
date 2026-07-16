import type { Metadata } from 'next';
import { ScreenShell } from '@/components/chrome/screen-shell';
import { RankEntry } from '@/components/record/rank-entry';
import { CareerPanel } from '@/components/record/career-panel';
import { experiences } from '@/lib/data/experience';

export const metadata: Metadata = {
  title: 'Combat Record',
  description:
    'Career rank progression — research, teaching, AI evaluation and mentorship roles, newest first.',
};

/*
  Combat Record — the rank ladder. Five roles as ranks V…I (newest on top)
  on a spine with enamel rank emblems; the PROGRESSION rail summarizes the
  current rank, the road to the next promotion, and honest career stats.
*/

const NUMERALS = ['V', 'IV', 'III', 'II', 'I'];

const EMBLEMS: Record<string, string> = {
  'rank-researcher': '/art/emblems/rank-5-researcher.svg',
  'rank-instructor': '/art/emblems/rank-4-instructor.svg',
  'rank-specialist': '/art/emblems/rank-3-specialist.svg',
  'rank-fellow': '/art/emblems/rank-2-fellow.svg',
  'rank-mentor': '/art/emblems/rank-1-mentor.svg',
};

// Presentational role qualifiers (ladder display only; data stays factual).
const QUALIFIERS: Record<string, string> = {
  'Undergraduate Researcher': 'TWO PURE AWARDS',
  'Teaching Assistant': 'HEAD TA, CPSC 355',
};

// Tour progress toward the next promotion (B.Sc. graduate, Jun 2027):
// Sep 2022 enlistment → Jul 2026 ≈ 46 of 57 months ≈ 80%.
const TOUR_PROGRESS = 80;

const STATS: { value: string; label: string }[] = [
  { value: '5', label: 'ROLES HELD' },
  { value: '5', label: 'YEARS ACTIVE' },
  { value: '500+', label: 'AI EVALS SHIPPED' },
  { value: '30+', label: 'STUDENTS MENTORED' },
];

export default function RecordPage() {
  const current = experiences[0];

  return (
    <ScreenShell
      title="Combat Record"
      headerRight={
        <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-green">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-green" />
          ACTIVE DUTY — UCALGARY
        </span>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_444px]">
        {/* Ladder */}
        <div className="rise relative" style={{ '--i': 1 } as React.CSSProperties}>
          {/* Spine: gold above the active node, steel below. */}
          <span
            aria-hidden="true"
            className="absolute bottom-6 left-[19px] top-2 w-[2px] bg-white/[0.12] sm:left-[21px]"
          />
          <span
            aria-hidden="true"
            className="absolute left-[19px] top-2 h-16 w-[2px] bg-gold sm:left-[21px]"
          />
          <ol className="relative">
            {experiences.map((exp, i) => (
              <RankEntry
                key={exp.role + exp.company}
                exp={exp}
                numeral={NUMERALS[i] ?? '—'}
                qualifier={QUALIFIERS[exp.role]}
                emblem={EMBLEMS[exp.insigniaId ?? ''] ?? EMBLEMS['rank-mentor']}
                active={i === 0}
              />
            ))}
          </ol>
        </div>

        {/* Progression rail */}
        <aside className="rise self-start" style={{ '--i': 2 } as React.CSSProperties}>
          <div className="panel panel-floating">
            <div className="panel-header">
              <span>PROGRESSION</span>
              <span>RANK V</span>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-4">
                <img
                  src="/art/emblems/rank-5-researcher.svg"
                  alt=""
                  className="h-16 w-16"
                />
                <div>
                  <div className="font-display text-[24px] font-bold uppercase leading-none text-ink">
                    {current.role.toUpperCase()}
                  </div>
                  <div className="mt-1 font-mono text-[10.5px] tracking-[0.1em] text-ink-2">
                    5 RANKS EARNED · 2021 → PRESENT
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-1.5 flex items-baseline justify-between">
                  <span className="font-label text-[11px] font-semibold tracking-[0.1em] text-ink-3">
                    NEXT RANK: B.SC. GRADUATE
                  </span>
                  <span className="font-mono text-[11px] text-orange-core">
                    JUN 2027
                  </span>
                </div>
                <div
                  className="meter-track h-2 w-full"
                  role="img"
                  aria-label={`Tour progress: about ${TOUR_PROGRESS} percent toward graduation in June 2027`}
                >
                  <div
                    className="h-full bg-orange-fill"
                    style={{ width: `${TOUR_PROGRESS}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2">
                {STATS.map((s) => (
                  <div
                    key={s.label}
                    className="border border-white/[0.08] bg-[rgba(10,15,19,0.5)] px-3 py-2.5"
                  >
                    <div className="font-display text-[24px] font-bold leading-none text-orange-core">
                      {s.value}
                    </div>
                    <div className="mt-1 font-label text-[10px] font-semibold tracking-[0.1em] text-ink-3">
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-5 border-t border-white/[0.08] pt-3 font-mono text-[9.5px] leading-relaxed tracking-[0.04em] text-ink-3">
                EMBLEM KEY: V GOLD = RESEARCHER · IV SILVER = INSTRUCTOR · III
                BLUE = SPECIALIST · II RED = FELLOW · I OLIVE = MENTOR
              </p>
            </div>
          </div>

          <CareerPanel />
        </aside>
      </div>
    </ScreenShell>
  );
}
