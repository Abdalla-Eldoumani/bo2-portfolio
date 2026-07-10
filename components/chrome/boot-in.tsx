'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/*
  Boot-in: the one-shot "ESTABLISHING UPLINK" sequence, played over the lobby
  once per session (sessionStorage gate), skippable on any key or click,
  total ≤ 1.8s. Under prefers-reduced-motion the sequence is skipped in favor
  of a single short fade (the overlay simply exits early).

  Beats: UPLINK ▸ AUTH ▸ LOBBY FOUND. Rendered above everything (z-50); the
  page is fully server-rendered beneath it, so no-JS visitors and crawlers
  never see or wait for it.
*/

const KEY = 'bo2-boot-done';

const BEATS = [
  'ESTABLISHING UPLINK…',
  'AUTHENTICATING OPERATOR… OK',
  'LOBBY FOUND — CONNECTING',
];

export function BootIn() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<'idle' | 'playing' | 'exiting' | 'done'>(
    'idle',
  );
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    if (pathname !== '/') return;
    let played = true;
    try {
      played = sessionStorage.getItem(KEY) === '1';
    } catch {
      played = true;
    }
    if (played) return;

    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* storage unavailable — play once anyway */
    }

    if (reduce) return; // reduced motion: no sequence at all

    const raf = requestAnimationFrame(() => setPhase('playing'));
    return () => cancelAnimationFrame(raf);
  }, [pathname]);

  useEffect(() => {
    if (phase !== 'playing') return;

    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setBeat(1), 450),
      setTimeout(() => setBeat(2), 950),
      setTimeout(() => setPhase('exiting'), 1500),
      setTimeout(() => setPhase('done'), 1700),
    ];

    const skip = () => setPhase('exiting');
    window.addEventListener('keydown', skip, { once: true });
    window.addEventListener('pointerdown', skip, { once: true });

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'exiting') return;
    const t = setTimeout(() => setPhase('done'), 220);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'idle' || phase === 'done') return null;

  return (
    <div
      aria-hidden="true"
      className={`scene-interior fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 ${
        phase === 'exiting' ? 'boot-exit' : ''
      }`}
    >
      <div className="scanlines absolute inset-0" />
      <span
        aria-hidden="true"
        className="mb-2 h-2 w-2 rounded-full bg-green"
        style={{ boxShadow: '0 0 10px rgba(123,194,79,0.9)' }}
      />
      {BEATS.slice(0, beat + 1).map((line) => (
        <p
          key={line}
          className="boot-line font-mono text-[12px] tracking-[0.2em] text-ink-2"
        >
          {line}
        </p>
      ))}
      <p className="absolute bottom-10 font-mono text-[10px] tracking-[0.14em] text-ink-3">
        PRESS ANY KEY TO SKIP
      </p>
    </div>
  );
}
