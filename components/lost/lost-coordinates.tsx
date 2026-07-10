'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/*
  404 client leaf: echoes the requested path in the coordinates line and
  flags <html data-lost> while mounted so the persistent chrome degrades to
  the sepia OFFLINE register (globals.css html[data-lost] rules).
*/

export function LostCoordinates() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.setAttribute('data-lost', '');
    return () => document.documentElement.removeAttribute('data-lost');
  }, []);

  return (
    <p
      className="mt-6 max-w-full truncate font-mono text-[11px] tracking-[0.06em]"
      style={{ color: '#8a7f6b' }}
    >
      LAST KNOWN COORDINATES:{' '}
      <span style={{ color: '#c9bfa8' }}>{pathname ?? '/unknown'}</span> · NO
      SURVIVORS FOUND
    </p>
  );
}
