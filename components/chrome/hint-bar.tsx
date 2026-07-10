'use client';

import { usePathname } from 'next/navigation';

/*
  Bottom hint bar — the BO2 button-prompt strip. Every hint is HONEST: it
  appears only where the matching key handler is actually wired
  (components/chrome/keyboard.tsx and per-screen handlers).

  Desktop hints per screen; on mobile the bar collapses to SELECT + MENU
  (the ☰ MENU keycap opens the full-screen nav overlay).
*/

type Hint = { key: string; label: string };

const BASE_BACK: Hint = { key: 'ESC', label: 'BACK' };
const RESUME: Hint = { key: 'CTRL P', label: 'RESUME' };

const HINTS: Record<string, Hint[]> = {
  '/': [
    { key: '↵', label: 'SELECT' },
    { key: '↑↓', label: 'NAVIGATE' },
    RESUME,
  ],
  '/comms': [
    { key: '↵', label: 'TRANSMIT' },
    BASE_BACK,
    { key: 'C', label: 'COPY ADDRESS' },
  ],
  '/scoreboard': [
    BASE_BACK,
    { key: 'R', label: 'RESYNC' },
    RESUME,
  ],
  '/resume': [
    BASE_BACK,
    { key: 'CTRL P', label: 'PRINT' },
  ],
};

const DEFAULT_HINTS: Hint[] = [{ key: '↵', label: 'SELECT' }, BASE_BACK, RESUME];

/* Per-screen footprint line (right side). Falls back to the global one. */
const FOOTPRINTS: Record<string, string> = {
  '/loadout': '37 SKILLS COMMITTED · 2 WILDCARDS ACTIVE',
  '/missions': '10 OPS · 9 DEPLOYED · 1 IN PROGRESS',
  '/record': 'RANKS I–V · NEXT PROMOTION JUN 2027',
  '/scoreboard': 'DATA: LIVE GITHUB API · FALLBACK SNAPSHOT COMMITTED',
  '/comms': '3 CHANNELS · RESPONSE VIA EMAIL FASTEST',
  '/dossier': 'FILE SR-0427 · CLEARANCE GRANTED',
  '/resume': 'PRINT: LETTER · 0.6IN MARGINS · ONE PAGE',
};

const DEFAULT_FOOTPRINT =
  'GITHUB / ABDALLA-ELDOUMANI · CALGARY AB · 51.04°N';

export function HintBar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const hints = HINTS[pathname] ?? DEFAULT_HINTS;
  const footprint = FOOTPRINTS[pathname] ?? DEFAULT_FOOTPRINT;

  // The field dossier runs to the frame bottom like a real document under
  // review — no hint bar (the export rail carries the actions).
  if (pathname === '/resume') return null;

  return (
    <div
      data-print-hide
      className="chrome-bar fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 px-4 py-2 sm:px-6 lg:px-9 lg:py-2.5"
    >
      {/* Desktop hints */}
      <div className="hidden items-center gap-7 lg:flex">
        {hints.map((h) => (
          <span key={h.key + h.label} className="flex items-center gap-2">
            <kbd className="keycap text-ink">{h.key}</kbd>
            <span className="font-label text-[13px] font-semibold tracking-[0.05em] text-ink-2">
              {h.label}
            </span>
          </span>
        ))}
      </div>

      {/* Mobile hints: SELECT + MENU */}
      <div className="flex items-center gap-5 lg:hidden">
        <span className="flex items-center gap-2">
          <kbd className="keycap text-ink">↵</kbd>
          <span className="font-label text-[12px] font-semibold tracking-[0.05em] text-ink-2">
            SELECT
          </span>
        </span>
        <button
          type="button"
          onClick={onMenu}
          className="tap-target confirm-punch flex items-center gap-2"
          aria-label="Open menu"
          aria-haspopup="dialog"
        >
          <span className="keycap text-ink">☰</span>
          <span className="font-label text-[12px] font-semibold tracking-[0.05em] text-ink-2">
            MENU
          </span>
        </button>
      </div>

      <div className="hidden font-mono text-[10.5px] text-ink-3 sm:block">
        {footprint}
      </div>
    </div>
  );
}
