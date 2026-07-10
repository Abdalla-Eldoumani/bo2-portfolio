'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { resyncGitHub } from '@/app/scoreboard/actions';

/*
  R RESYNC control: the keyboard handler behind the hint-bar promise plus a
  visible button. Drops the tagged fetch cache (server action) and refreshes
  the route; while pending the label reads RESYNCING… and re-entry is locked.
*/

import { useEffect } from 'react';

export function Resync() {
  const [pending, startTransition] = useTransition();
  const [cooldown, setCooldown] = useState(false);
  const router = useRouter();

  const run = () => {
    if (pending || cooldown) return;
    setCooldown(true);
    startTransition(async () => {
      await resyncGitHub();
      router.refresh();
      window.setTimeout(() => setCooldown(false), 4000);
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'r' || e.ctrlKey || e.metaKey || e.altKey)
        return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      )
        return;
      run();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, cooldown]);

  return (
    <button
      type="button"
      onClick={run}
      disabled={pending || cooldown}
      className="tap-target confirm-punch border border-white/[0.32] px-3 py-1 font-label text-[12px] font-semibold tracking-[0.06em] text-ink-menu hover:border-orange-frame hover:text-orange-core disabled:opacity-50"
    >
      {pending ? 'RESYNCING…' : 'RESYNC'}
    </button>
  );
}
