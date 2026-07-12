'use client';

import { useEffect, useState } from 'react';
import { SFX_CHANGE_EVENT, sfxEnabled, sfxToggle } from '@/lib/sfx';

/*
  SFX switch in the top-bar status cluster. Interface sounds default ON
  (they only ever start after a user gesture); the choice persists in
  localStorage via lib/sfx. Renders ON during SSR and syncs to the stored
  state after mount, deferred a frame so hydration stays clean.
*/

export function SfxToggle() {
  const [on, setOn] = useState(true);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setOn(sfxEnabled()));
    const sync = () => setOn(sfxEnabled());
    window.addEventListener(SFX_CHANGE_EVENT, sync);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener(SFX_CHANGE_EVENT, sync);
    };
  }, []);

  return (
    <button
      type="button"
      onClick={() => setOn(sfxToggle())}
      aria-pressed={on}
      title={on ? 'Turn interface sounds off' : 'Turn interface sounds on'}
      className={`pointer-events-auto flex shrink-0 items-center gap-1 font-mono text-[10px] tracking-[0.1em] transition-colors ${
        on ? 'text-ink-2 hover:text-ink' : 'text-ink-3 hover:text-ink-2'
      }`}
    >
      <span aria-hidden="true">{on ? '◂))' : '◂ ×'}</span>
      <span>
        <span className="sr-only">Interface sounds </span>SFX{' '}
        {on ? 'ON' : 'OFF'}
      </span>
    </button>
  );
}
