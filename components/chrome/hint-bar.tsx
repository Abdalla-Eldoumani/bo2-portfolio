'use client';

import { usePathname, useRouter } from 'next/navigation';
import { navigation } from '@/lib/data/navigation';
import { projects } from '@/lib/data/projects';
import { sfxBack, sfxMove, sfxOpen, sfxSelect } from '@/lib/sfx';

/*
  Bottom hint bar — the BO2 button-prompt strip, and a real control surface:
  every chip with an action is a working button (click = the same handler
  the key drives), so mouse-first visitors can navigate without knowing the
  keyboard map. Honest-hints contract: a chip appears only where its key
  handler is actually wired.

  Screen-local actions (COPY, RESYNC) are dispatched as `bo2-action` events
  the owning screens listen for; navigation actions route directly.
*/

type Hint = {
  key: string;
  label: string;
  action?:
    | 'back'
    | 'resume'
    | 'cycle'
    | 'copy'
    | 'resync'
    | 'print'
    | 'select'
    | 'fieldsim';
};

const BACK: Hint = { key: 'ESC', label: 'BACK', action: 'back' };
const CYCLE: Hint = { key: '◄ ►', label: 'SCREENS', action: 'cycle' };
const RESUME: Hint = { key: 'CTRL P', label: 'RESUME', action: 'resume' };

const HINTS: Record<string, Hint[]> = {
  '/': [
    { key: '↵', label: 'SELECT', action: 'select' },
    { key: '↑↓', label: 'NAVIGATE' },
    RESUME,
  ],
  '/missions': [
    { key: '↑↓', label: 'SELECT OP' },
    { key: '↵', label: 'FIELD SIM', action: 'fieldsim' },
    BACK,
    CYCLE,
  ],
  '/comms': [
    { key: '↑↓', label: 'CHANNEL' },
    { key: '↵', label: 'TRANSMIT' },
    BACK,
    { key: 'C', label: 'COPY ADDRESS', action: 'copy' },
  ],
  '/scoreboard': [BACK, CYCLE, { key: 'R', label: 'RESYNC', action: 'resync' }],
  '/resume': [BACK, { key: 'CTRL P', label: 'PRINT', action: 'print' }],
};

const DEFAULT_HINTS: Hint[] = [
  { key: '↵', label: 'SELECT' },
  BACK,
  CYCLE,
  RESUME,
];

const LIVE_OPS = projects.filter((p) => p.live && p.live !== '#').length;

/* Per-screen footprint line (right side). */
const FOOTPRINTS: Record<string, string> = {
  '/loadout': '37 SKILLS COMMITTED · 2 WILDCARDS ACTIVE',
  '/missions': `${projects.length} OPS ON ROTATION · ${LIVE_OPS} LIVE DEPLOYMENTS`,
  '/record': 'RANKS I–V · NEXT PROMOTION JUN 2027',
  '/scoreboard': 'DATA: LIVE GITHUB API · FALLBACK SNAPSHOT COMMITTED',
  '/comms': '3 CHANNELS · RESPONSE VIA EMAIL FASTEST',
  '/dossier': 'FILE SR-0427 · CLEARANCE GRANTED',
  '/about': 'EVERY PIXEL ORIGINAL · ZERO GAME ASSETS',
  '/resume': 'PRINT: LETTER · 0.6IN MARGINS · ONE PAGE',
};

const DEFAULT_FOOTPRINT = 'GITHUB / ABDALLA-ELDOUMANI · CALGARY AB · 51.04°N';

export function HintBar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const hints = HINTS[pathname] ?? DEFAULT_HINTS;
  const footprint = FOOTPRINTS[pathname] ?? DEFAULT_FOOTPRINT;

  // The field dossier runs to the frame bottom like a real document under
  // review — no hint bar (the export rail carries the actions).
  if (pathname === '/resume') return null;

  const act = (action?: Hint['action']) => {
    switch (action) {
      case 'back':
        if (pathname !== '/') {
          sfxBack();
          router.push('/');
        }
        return;
      case 'resume':
        sfxSelect();
        router.push('/resume');
        return;
      case 'cycle': {
        const i = navigation.findIndex((n) => n.href === pathname);
        const next = navigation[(i + 1) % navigation.length];
        sfxMove();
        router.push(next.href);
        return;
      }
      case 'select': {
        // Lobby: hand focus to the menu so ↑↓/↵ take over.
        sfxMove();
        document
          .querySelector<HTMLAnchorElement>('a[data-row]')
          ?.focus();
        return;
      }
      case 'copy':
      case 'resync':
      case 'fieldsim':
        window.dispatchEvent(
          new CustomEvent('bo2-action', { detail: action }),
        );
        return;
      case 'print':
        sfxSelect();
        window.print();
        return;
    }
  };

  const renderChip = (hint: Hint, compact = false) => {
    const inner = (
      <>
        <kbd className="keycap text-ink">{hint.key}</kbd>
        <span
          className={`font-label font-semibold tracking-[0.05em] text-ink-2 ${
            compact ? 'text-[12px]' : 'text-[13px]'
          }`}
        >
          {hint.label}
        </span>
      </>
    );
    if (!hint.action) {
      return (
        <span key={hint.key + hint.label} className="flex items-center gap-2">
          {inner}
        </span>
      );
    }
    return (
      <button
        key={hint.key + hint.label}
        type="button"
        onClick={() => act(hint.action)}
        className="tap-target confirm-punch group flex items-center gap-2 hover:[&_.keycap]:border-orange-frame hover:[&_.keycap]:text-orange-core hover:[&_span]:text-orange-core"
      >
        {inner}
      </button>
    );
  };

  return (
    <div
      data-print-hide
      className="chrome-bar fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-4 px-4 py-1.5 sm:px-6 lg:px-9 lg:py-2"
    >
      {/* Desktop hints */}
      <div className="hidden items-center gap-7 lg:flex">
        {hints.map((h) => renderChip(h))}
      </div>

      {/* Mobile hints: BACK (off-lobby) + MENU */}
      <div className="flex items-center gap-5 lg:hidden">
        {pathname !== '/' && renderChip(BACK, true)}
        <button
          type="button"
          onClick={() => {
            sfxOpen();
            onMenu();
          }}
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
