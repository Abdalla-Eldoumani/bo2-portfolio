'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CAREER_CHANGE_EVENT,
  careerTotals,
  loadCareer,
  rankForXp,
} from '@/lib/career';
import { BAND_RANKS, MEDALS, RANKS, challengesForSim } from '@/lib/data/career';
import { SIM_META } from '@/components/missions/sim/games';
import { projects } from '@/lib/data/projects';
import type { CareerState } from '@/lib/types/career';

/*
  FIELD SIM CAREER — the visitor's side of the Combat Record. Everything
  here is this browser's own history (localStorage, zero accounts): rank
  and XP road, medals, challenge completion and per-sim bests. Renders
  after mount so the server markup never guesses at client state.
*/

export function CareerPanel() {
  const [career, setCareer] = useState<CareerState | null>(null);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setCareer(loadCareer()));
    const onChange = (e: Event) =>
      setCareer((e as CustomEvent<CareerState>).detail);
    window.addEventListener(CAREER_CHANGE_EVENT, onChange);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(CAREER_CHANGE_EVENT, onChange);
    };
  }, []);

  if (!career) return null;

  if (career.plays === 0 && career.prestige === 0) {
    return (
      <div className="panel panel-floating mt-6">
        <div className="panel-header">
          <span>FIELD SIM CAREER</span>
          <span>NO DATA</span>
        </div>
        <div className="p-4">
          <p className="font-mono text-[11px] leading-relaxed tracking-[0.06em] text-ink-3">
            NO SIM DATA ON RECORD. EVERY OP ON{' '}
            <Link
              href="/missions"
              className="text-orange-core underline decoration-orange-frame/50 underline-offset-2"
            >
              MISSION SELECT
            </Link>{' '}
            CARRIES A FIELD SIM — RUN ONE TO START A CAREER.
          </p>
        </div>
      </div>
    );
  }

  const rank = rankForXp(career.xp);
  const next = RANKS.find((r) => r.level === rank.level + 1);
  const totals = careerTotals(career);
  const xpPct = next
    ? Math.round(((career.xp - rank.xp) / (next.xp - rank.xp)) * 100)
    : 100;
  const earnedMedals = MEDALS.filter((m) => (career.medals[m.id] ?? 0) > 0);

  return (
    <div className="panel panel-floating mt-6">
      <div className="panel-header">
        <span>FIELD SIM CAREER</span>
        <span>
          {career.plays} {career.plays === 1 ? 'ROUND' : 'ROUNDS'}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-4">
          <img src={rank.emblem} alt="" className="h-14 w-14" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display text-[22px] font-bold uppercase leading-none text-ink">
                {rank.name}
              </span>
              {career.prestige > 0 && (
                <span
                  aria-label={`Prestige ${career.prestige}`}
                  title={`Prestige ${career.prestige}`}
                  className="h-3.5 w-3.5 bg-gold"
                  style={{
                    clipPath:
                      'polygon(50% 0, 100% 30%, 100% 70%, 50% 100%, 0 70%, 0 30%)',
                  }}
                />
              )}
            </div>
            <div className="mt-1 font-mono text-[10px] tracking-[0.08em] text-ink-2">
              {career.xp} XP{next ? ` · ${next.xp - career.xp} TO ${next.name}` : ' · LADDER CAPPED'}
              {career.prestige > 0 ? ` · PRESTIGE ${career.prestige}` : ''}
            </div>
          </div>
        </div>

        <div
          className="meter-track mt-3 h-2 w-full"
          role="img"
          aria-label={`Career progress: ${xpPct} percent toward the next rank`}
        >
          <div className="h-full bg-orange-fill" style={{ width: `${xpPct}%` }} />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { value: String(totals.medalCount), label: 'MEDALS EARNED' },
            {
              value: `${totals.challengeCount}/${totals.challengeTotal}`,
              label: 'CHALLENGES',
            },
            {
              value: `${totals.medalKinds}/${totals.medalTotal}`,
              label: 'MEDAL TYPES',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="border border-white/[0.08] bg-[rgba(10,15,19,0.5)] px-3 py-2"
            >
              <div className="font-display text-[20px] font-bold leading-none text-orange-core">
                {s.value}
              </div>
              <div className="mt-1 font-label text-[9.5px] font-semibold tracking-[0.1em] text-ink-3">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Per-sim record: best score, best band rank, challenge tiers */}
        <div className="mt-4 border-t border-white/[0.08] pt-3">
          {projects.map((p) => {
            const bestRank = career.bestRanks[p.slug] ?? 0;
            const done = challengesForSim(p.slug).filter(
              (c) => career.challenges[c.id],
            ).length;
            return (
              <div
                key={p.slug}
                className="flex items-baseline justify-between gap-2 py-1 font-mono text-[10px] tracking-[0.04em]"
              >
                <span className="truncate text-ink-2">
                  {SIM_META[p.slug]?.title ?? p.name.toUpperCase()}
                </span>
                <span className="shrink-0 text-ink-3">
                  BEST {career.bests[p.slug] ?? 0}
                  {' · '}
                  <span className={bestRank >= 2 ? 'text-orange-core' : ''}>
                    {BAND_RANKS[bestRank]}
                  </span>
                  {' · '}
                  <span className={done > 0 ? 'text-green' : ''}>
                    {done}/3
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        {earnedMedals.length > 0 && (
          <div className="mt-3 border-t border-white/[0.08] pt-3">
            <div className="flex flex-wrap gap-1.5">
              {earnedMedals.map((m) => (
                <span
                  key={m.id}
                  title={m.description}
                  className="border border-white/[0.14] px-2 py-0.5 font-label text-[10px] font-semibold tracking-[0.06em] text-ink-2"
                >
                  ◈ {m.name}
                  {(career.medals[m.id] ?? 0) > 1 ? ` ×${career.medals[m.id]}` : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
