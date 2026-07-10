'use client';

import { useState } from 'react';
import type { Experience } from '@/lib/types/experience';

/*
  One rank-ladder entry. Shows two achievement bullets and the first four
  skill chips at rest; "+n MORE" expands the full record in place (↵ EXPAND
  hint). The active-duty entry carries the hover-strip background, 4px orange
  bar and the green ACTIVE DUTY chip.
*/

export function RankEntry({
  exp,
  numeral,
  qualifier,
  emblem,
  active,
}: {
  exp: Experience;
  numeral: string;
  qualifier?: string;
  emblem: string;
  active: boolean;
}) {
  const [open, setOpen] = useState(false);
  const bullets = open ? exp.achievements : exp.achievements.slice(0, 2);
  const chips = open ? exp.skills : exp.skills.slice(0, 4);
  const moreBullets = exp.achievements.length - 2;
  const moreChips = exp.skills.length - 4;

  return (
    <li className="relative pl-14 sm:pl-16">
      {/* Spine node: enamel emblem. */}
      <span
        aria-hidden="true"
        className="absolute left-0 top-4 flex h-10 w-10 items-center justify-center sm:h-11 sm:w-11"
      >
        <img src={emblem} alt="" className="h-full w-full" />
      </span>

      <article
        className={`mb-3 border border-transparent px-4 py-3.5 transition-colors ${
          active
            ? 'border-l-4 border-l-orange-fill'
            : 'hover:border-[rgba(255,156,30,0.5)]'
        }`}
        style={
          active
            ? {
                background:
                  'linear-gradient(90deg, rgba(255,150,0,0.16), rgba(10,15,19,0.62) 85%)',
              }
            : { background: 'rgba(10,15,19,0.5)' }
        }
      >
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-[22px] font-bold text-orange-core">
            {numeral}
          </span>
          <h2 className="font-display text-[19px] font-bold uppercase leading-tight text-ink sm:text-[21px]">
            {exp.role.toUpperCase()}
            {qualifier && (
              <span className="text-ink-2"> — {qualifier}</span>
            )}
          </h2>
          {active && (
            <span className="flex items-center gap-1.5 border border-green/50 px-2 py-0.5 font-mono text-[9.5px] tracking-[0.1em] text-green">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-green" />
              ACTIVE DUTY
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10.5px] tracking-[0.08em] text-ink-3">
          <span>{exp.company.toUpperCase()}</span>
          <span aria-hidden="true">·</span>
          <span>{exp.location.toUpperCase()}</span>
          <span aria-hidden="true">·</span>
          <span className={active ? 'text-orange-core' : ''}>
            {exp.duration.toUpperCase()}
          </span>
        </div>

        <ul className="mt-2.5 flex flex-col gap-1.5">
          {bullets.map((a) => (
            <li key={a} className="flex gap-2 text-[13.5px] leading-relaxed text-ink-2">
              <span aria-hidden="true" className="mt-[3px] shrink-0 text-orange-core">
                ▸
              </span>
              {a}
            </li>
          ))}
        </ul>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {chips.map((s) => (
            <span
              key={s}
              className="border border-white/[0.14] px-2 py-0.5 font-label text-[10.5px] font-semibold tracking-[0.06em] text-ink-2"
            >
              {s.toUpperCase()}
            </span>
          ))}
          {(moreBullets > 0 || moreChips > 0) && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              className="tap-target px-2 py-0.5 font-mono text-[10.5px] tracking-[0.06em] text-orange-core hover:text-orange-hot"
            >
              {open ? '− COLLAPSE' : `+${Math.max(moreBullets, 0) + Math.max(moreChips, 0)} MORE`}
            </button>
          )}
        </div>
      </article>
    </li>
  );
}
