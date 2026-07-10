import type { Metadata } from 'next';
import { ScreenShell } from '@/components/chrome/screen-shell';
import { loadout } from '@/lib/data/skills';

export const metadata: Metadata = {
  title: 'Create a Class',
  description:
    'Skill loadout — systems and low-level primaries, web and cloud secondaries, data/AI and tooling perks, plus two wildcards.',
};

/*
  Create a Class — the Pick 10 screen. Three columns at desktop:
  PRIMARY + WILDCARDS · SECONDARY · PERKS. The allocation meter reads 10/10
  (all picks committed); stat meters on the featured primary are qualitative
  flavor (DEPTH/FLUENCY/BREADTH/RECENCY), never invented numerals.
  Server component throughout — states are pure CSS hover/focus.
*/

// Presentation grouping of the perk list (data stays flat in lib/data).
const PERK_TIERS: { label: string; names: string[] }[] = [
  {
    label: 'PERK 1 — DATA & AI',
    names: ['Python', 'TensorFlow', 'PyTorch', 'Jupyter', 'OpenAI API'],
  },
  {
    label: 'PERK 2 — TOOLING & PROCESS',
    names: ['Git', 'JUnit', 'pytest', 'CI/CD', 'Postman', 'Jira'],
  },
  {
    label: 'PERK 3 — ALSO SPEAKS',
    names: ['Java', 'Kotlin'],
  },
];

// Flavor meters for the featured primary — labels only, widths qualitative.
const METERS: { label: string; pct: number }[] = [
  { label: 'DEPTH', pct: 88 },
  { label: 'FLUENCY', pct: 82 },
  { label: 'BREADTH', pct: 64 },
  { label: 'RECENCY', pct: 92 },
];

function AllocationMeter() {
  return (
    <div className="flex items-center gap-3">
      <span className="font-label text-[12px] font-semibold tracking-[0.08em] text-ink-2">
        ALLOCATION
      </span>
      <div className="flex gap-1" aria-hidden="true">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} data-filled className="pip" />
        ))}
      </div>
      <span className="font-display text-[26px] font-bold leading-none">
        <span className="text-orange-core">10</span>
        <span className="text-ink-3"> /10</span>
      </span>
    </div>
  );
}

function SkillTile({ name, i }: { name: string; i: number }) {
  return (
    <div
      tabIndex={0}
      className="tile rise tap-target flex items-center justify-center px-2 py-2.5 text-center font-display text-[15px] font-bold uppercase leading-tight text-ink-menu"
      style={{ '--i': Math.min(i, 8) } as React.CSSProperties}
    >
      {name}
    </div>
  );
}

function Monogram({ name }: { name: string }) {
  return (
    <span
      aria-hidden="true"
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-olive font-display text-[15px] font-bold text-ink"
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }}
    >
      {name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase()}
    </span>
  );
}

export default function LoadoutPage() {
  const primary = loadout.primary;
  const featured = primary[0];
  const restPrimary = primary.slice(1);

  return (
    <ScreenShell title="Create a Class" headerRight={<AllocationMeter />}>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr_0.95fr]">
        {/* Column 1: PRIMARY + WILDCARDS */}
        <div className="flex flex-col gap-6">
          <section aria-label="Primary — systems and low-level" className="panel rise" style={{ '--i': 1 } as React.CSSProperties}>
            <div className="panel-header">
              <span>PRIMARY — SYSTEMS &amp; LOW-LEVEL</span>
              <span>{String(primary.length).padStart(2, '0')}</span>
            </div>
            <div className="p-3.5">
              {/* Featured primary: equipped, render slot + flavor meters. */}
              <div className="tile corner-tick relative p-3.5" data-selected>
                <div className="hatch flex h-[96px] items-center justify-center border border-white/10">
                  <span className="px-3 text-center font-mono text-[10px] leading-relaxed tracking-[0.08em] text-ink-3">
                    [ WEAPON RENDER — {featured.toUpperCase()} DUOTONE ART ]
                  </span>
                </div>
                <div className="mt-3 font-display text-[28px] font-bold uppercase leading-none text-ink">
                  {featured}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2">
                  {METERS.map((m) => (
                    <div key={m.label}>
                      <div className="mb-1 flex justify-between font-label text-[11px] font-semibold tracking-[0.08em] text-ink-3">
                        <span>{m.label}</span>
                      </div>
                      <div className="meter-track h-[6px] w-full">
                        <div
                          className="meter-fill h-full"
                          style={{ width: `${m.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t border-white/[0.08] pt-2 font-mono text-[10px] tracking-[0.06em] text-orange-core">
                  EQUIPPED · CPSC 355 / FASTMATHEXT / AEOS
                </div>
              </div>

              {/* Remaining primaries + one locked slot. */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                {restPrimary.map((name, i) => (
                  <SkillTile key={name} name={name} i={i + 2} />
                ))}
                <div className="hatch flex items-center justify-center border border-white/[0.06] px-2 py-2.5">
                  <span className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.08em] text-ink-3">
                    <img src="/art/icons/lock.svg" alt="" className="h-3 w-3 opacity-50" />
                    SLOT LOCKED
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section aria-label="Wildcards" className="panel rise" style={{ '--i': 3 } as React.CSSProperties}>
            <div className="panel-header">
              <span>WILDCARDS</span>
              <span>{String(loadout.wildcards.length).padStart(2, '0')}</span>
            </div>
            <ul className="divide-y divide-white/[0.08]">
              {loadout.wildcards.map((w) => (
                <li key={w.name} className="flex gap-3 px-3.5 py-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-olive"
                    style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18)' }}
                  >
                    <img src="/art/icons/streak-star.svg" alt="" className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <div className="font-display text-[17px] font-bold uppercase leading-tight text-ink">
                      {w.name}
                    </div>
                    <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-2">
                      {w.note}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Column 2: SECONDARY */}
        <section aria-label="Secondary — web and cloud" className="panel rise self-start" style={{ '--i': 2 } as React.CSSProperties}>
          <div className="panel-header">
            <span>SECONDARY — WEB &amp; CLOUD</span>
            <span>{loadout.secondary.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 p-3.5 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            {loadout.secondary.map((name, i) => (
              <SkillTile key={name} name={name} i={Math.min(i, 8)} />
            ))}
          </div>
        </section>

        {/* Column 3: PERKS */}
        <section aria-label="Perks — data, AI and tooling" className="panel rise self-start" style={{ '--i': 3 } as React.CSSProperties}>
          <div className="panel-header">
            <span>PERKS — DATA / AI &amp; TOOLING</span>
            <span>{loadout.perks.length}</span>
          </div>
          <div className="flex flex-col gap-1 p-3.5">
            {PERK_TIERS.map((tier) => (
              <div key={tier.label} className="mb-2">
                <div className="mb-1.5 font-label text-[11px] font-semibold tracking-[0.1em] text-ink-3">
                  {tier.label}
                </div>
                <ul>
                  {tier.names.map((name) => (
                    <li
                      key={name}
                      tabIndex={0}
                      className="tap-target -mx-1.5 flex items-center gap-2.5 border-l-[3px] border-transparent px-1.5 py-1 transition-colors duration-[120ms] hover:border-orange-fill hover:bg-white/[0.04] focus-visible:border-orange-fill focus-visible:bg-white/[0.04]"
                    >
                      <Monogram name={name} />
                      <span className="font-display text-[16px] font-bold uppercase text-ink-menu">
                        {name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>
    </ScreenShell>
  );
}
