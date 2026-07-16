'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/lib/site-config';
import { navigation } from '@/lib/data/navigation';
import { SfxToggle } from '@/components/chrome/sfx-toggle';
import { CAREER_CHANGE_EVENT, loadCareer, rankForXp } from '@/lib/career';
import type { CareerState } from '@/lib/types/career';

/*
  Persistent top chrome: status cluster left, playercard chip right. The chip
  is the operator's identity — emblem, callsign, prestige diamond, level —
  and links back to the lobby from any screen.

  The clock renders empty on the server and ticks after hydration (minute
  resolution), so there is no hydration mismatch and no per-second work.
  LVL 22 is the operator's age — the one numeral on the chip that is flavor
  by design, like a game level.
*/

function useClock() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    const fmt = new Intl.DateTimeFormat('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Edmonton',
    });
    const tick = () => setTime(fmt.format(new Date()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return time;
}

/*
  The visitor's field-sim career rank, worn next to the playercard once
  they have run at least one sim. Reads localStorage after mount (no
  hydration mismatch) and follows every round via the store's event.
  The gold diamond is the prestige glyph — permanent once earned.
*/
function CareerBadge() {
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

  if (!career || (career.plays === 0 && career.prestige === 0)) return null;
  const rank = rankForXp(career.xp);

  return (
    <span
      className="panel hidden items-center gap-2 px-2.5 py-1.5 sm:flex"
      title={`Field sim career: ${rank.name}${career.prestige > 0 ? `, prestige ${career.prestige}` : ''}`}
    >
      <img src={rank.emblem} alt="" className="h-5 w-5" />
      <span className="font-mono text-[10px] tracking-[0.08em] text-ink-2">
        <span className="sr-only">Field sim career rank: </span>
        {rank.name}
      </span>
      {career.prestige > 0 && (
        <span
          aria-label={`Prestige ${career.prestige}`}
          className="h-3 w-3 bg-gold"
          style={{
            clipPath:
              'polygon(50% 0, 100% 30%, 100% 70%, 50% 100%, 0 70%, 0 30%)',
          }}
        />
      )}
    </span>
  );
}

export function TopBar() {
  const pathname = usePathname();
  const time = useClock();

  const screen = navigation.find((n) => n.href === pathname);
  const status =
    pathname === '/resume'
      ? 'FIELD DOSSIER'
      : screen
        ? screen.label.toUpperCase()
        : 'LOBBY';

  return (
    <header
      data-print-hide
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-9 lg:py-4"
    >
      {/* Status cluster */}
      <div className="flex min-w-0 items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-ink-2 sm:gap-3 sm:text-[12px]">
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full bg-green"
          style={{ boxShadow: '0 0 8px rgba(123,194,79,0.8)' }}
        />
        <span className="truncate">
          <span className="sr-only">Current screen: </span>
          {`${status} // ONLINE`}
        </span>
        {time && <span className="hidden text-ink-3 sm:inline">{time} MST</span>}
        <span aria-hidden="true" className="hidden text-ink-3/60 sm:inline">|</span>
        <SfxToggle />
      </div>

      {/* Career badge + playercard chip */}
      <span className="pointer-events-auto flex items-center gap-2">
        <CareerBadge />
        <Link
          href="/"
          aria-label="Return to lobby"
          className="panel confirm-punch flex items-center gap-2 px-2.5 py-1.5 sm:gap-3 sm:px-3.5"
        >
          <img
            src="/art/playercard/emblem-personal.svg"
            alt=""
            className="h-6 w-6 border border-white/25 sm:h-8 sm:w-8"
          />
          <span className="hidden flex-col sm:flex">
            <span className="font-display text-[19px] font-bold leading-none text-ink">
              {siteConfig.callsign.toUpperCase()}
            </span>
            <span className="font-mono text-[10px] tracking-[0.06em] text-ink-2">
              {siteConfig.jobTitle.toUpperCase()}
            </span>
          </span>
          <span
            aria-hidden="true"
            className="hidden h-5 w-5 bg-gold sm:block"
            style={{
              clipPath:
                'polygon(50% 0, 100% 30%, 100% 70%, 50% 100%, 0 70%, 0 30%)',
            }}
          />
          <span className="font-display text-[15px] font-bold text-orange-core sm:text-[18px]">
            LVL 22
          </span>
        </Link>
      </span>
    </header>
  );
}
