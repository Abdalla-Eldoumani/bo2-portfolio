'use client';

import { useEffect, useState } from 'react';
import { siteConfig } from '@/lib/site-config';

/*
  SECURE CHANNELS — options-style rows. Email is the pre-selected filled-bar
  row (↵ TRANSMIT opens mailto); GitHub/LinkedIn are rest rows with
  line-art glyph boxes. C copies the address and raises the ADDRESS COPIED
  toast (2.5s hold, polite live region). All hints honest.
*/

const CHANNELS = [
  {
    id: 'email',
    glyph: '@',
    name: 'EMAIL — PRIMARY UPLINK',
    value: siteConfig.email.toUpperCase(),
    href: `mailto:${siteConfig.email}`,
    action: '↵ TRANSMIT',
    primary: true,
  },
  {
    id: 'github',
    glyph: 'GH',
    name: 'GITHUB',
    value: 'GITHUB.COM/ABDALLA-ELDOUMANI',
    href: siteConfig.github,
    action: '↵ OPEN',
    primary: false,
  },
  {
    id: 'linkedin',
    glyph: 'IN',
    name: 'LINKEDIN',
    value: 'LINKEDIN.COM/IN/ABDALLAELDOUMANI',
    href: siteConfig.linkedin,
    action: '↵ OPEN',
    primary: false,
  },
];

export function Channels() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(siteConfig.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard unavailable (permissions/http): fall back to mailto.
      window.location.href = `mailto:${siteConfig.email}`;
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'c' || e.ctrlKey || e.metaKey || e.altKey)
        return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      )
        return;
      if (window.getSelection()?.toString()) return; // don't hijack copy
      void copy();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <ul className="flex flex-col gap-[3px]">
        {CHANNELS.map((ch, i) => (
          <li key={ch.id} className="rise" style={{ '--i': i + 1 } as React.CSSProperties}>
            <a
              href={ch.href}
              target={ch.id === 'email' ? undefined : '_blank'}
              rel={ch.id === 'email' ? undefined : 'noreferrer'}
              data-current={ch.primary || undefined}
              className="menu-row tap-target flex min-h-[56px] items-center gap-3.5 px-4 py-2.5"
            >
              <span
                aria-hidden="true"
                className={`flex h-9 w-9 shrink-0 items-center justify-center border-2 font-display text-[15px] font-bold ${
                  ch.primary
                    ? 'border-on-orange/60 text-on-orange'
                    : 'border-current text-inherit'
                }`}
              >
                {ch.glyph}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[19px] font-bold uppercase leading-tight">
                  {ch.name}
                </span>
                <span
                  className={`block truncate font-mono text-[11px] tracking-[0.04em] ${
                    ch.primary ? 'text-on-orange/80' : 'text-ink-3'
                  }`}
                >
                  {ch.value}
                </span>
              </span>
              <span
                className={`shrink-0 font-mono text-[10px] tracking-[0.08em] ${
                  ch.primary ? 'text-on-orange/80' : 'text-ink-3'
                }`}
              >
                {ch.action}
              </span>
            </a>
          </li>
        ))}
      </ul>

      {/* ADDRESS COPIED toast */}
      <div role="status" aria-live="polite">
        {copied && (
          <div className="panel panel-floating fixed left-1/2 top-16 z-50 -translate-x-1/2 border-l-4 border-l-orange-fill px-5 py-2.5">
            <span className="font-display text-[17px] font-bold uppercase text-ink">
              Address copied
            </span>
            <span className="ml-3 font-mono text-[11px] text-orange-core">
              {siteConfig.email}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
