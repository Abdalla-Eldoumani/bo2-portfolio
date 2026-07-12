'use client';

import { useEffect, useRef, useState } from 'react';
import { siteConfig } from '@/lib/site-config';
import { sfxMove, sfxSelect, sfxTick } from '@/lib/sfx';

/*
  SECURE CHANNELS — options-style rows with a LIVE selection: ↑↓ moves the
  filled bar (the game's options-row select), ↵ activates the selected
  channel, C copies the address (with the ADDRESS COPIED toast). Mouse and
  touch keep working: rows are real anchors, hover shows the strip. All
  hints honest.
*/

const CHANNELS = [
  {
    id: 'email',
    glyph: '@',
    name: 'EMAIL — PRIMARY UPLINK',
    value: siteConfig.email.toUpperCase(),
    href: `mailto:${siteConfig.email}`,
    action: '↵ TRANSMIT',
    external: false,
  },
  {
    id: 'github',
    glyph: 'GH',
    name: 'GITHUB',
    value: 'GITHUB.COM/ABDALLA-ELDOUMANI',
    href: siteConfig.github,
    action: '↵ OPEN',
    external: true,
  },
  {
    id: 'linkedin',
    glyph: 'IN',
    name: 'LINKEDIN',
    value: 'LINKEDIN.COM/IN/ABDALLAELDOUMANI',
    href: siteConfig.linkedin,
    action: '↵ OPEN',
    external: true,
  },
];

export function Channels() {
  const [copied, setCopied] = useState(false);
  const [sel, setSel] = useState(0);
  const refs = useRef<(HTMLAnchorElement | null)[]>([]);
  // Enter reads the live selection without re-binding the listener.
  const selRef = useRef(0);
  useEffect(() => {
    selRef.current = sel;
  }, [sel]);

  const copy = async () => {
    sfxTick();
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
    const typing = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      return (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.isContentEditable)
      );
    };

    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target)) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        sfxMove();
        setSel((i) => {
          const next =
            e.key === 'ArrowDown'
              ? (i + 1) % CHANNELS.length
              : (i - 1 + CHANNELS.length) % CHANNELS.length;
          return next;
        });
        return;
      }

      if (e.key === 'Enter') {
        // Only when focus is not already on a link/button (native wins).
        const el = document.activeElement as HTMLElement | null;
        if (el && (el.tagName === 'A' || el.tagName === 'BUTTON')) return;
        sfxSelect();
        refs.current[selRef.current]?.click();
        return;
      }

      if (e.key.toLowerCase() === 'c' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (window.getSelection()?.toString()) return; // don't hijack copy
        void copy();
      }
    };

    const onAction = (e: Event) => {
      if ((e as CustomEvent).detail === 'copy') void copy();
    };

    window.addEventListener('keydown', onKey);
    window.addEventListener('bo2-action', onAction);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('bo2-action', onAction);
    };
  }, []);

  return (
    <>
      <ul className="flex flex-col gap-[3px]">
        {CHANNELS.map((ch, i) => (
          <li key={ch.id} className="rise" style={{ '--i': i + 1 } as React.CSSProperties}>
            <a
              ref={(el) => {
                refs.current[i] = el;
              }}
              href={ch.href}
              target={ch.external ? '_blank' : undefined}
              rel={ch.external ? 'noreferrer' : undefined}
              data-current={sel === i || undefined}
              onMouseEnter={() => {
                if (sel !== i) sfxMove();
                setSel(i);
              }}
              onFocus={() => {
                if (sel !== i) sfxMove();
                setSel(i);
              }}
              className="menu-row tap-target flex min-h-[56px] items-center gap-3.5 px-4 py-2.5"
            >
              <span
                aria-hidden="true"
                className={`flex h-9 w-9 shrink-0 items-center justify-center border-2 font-display text-[15px] font-bold ${
                  sel === i
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
                    sel === i ? 'text-on-orange/80' : 'text-ink-3'
                  }`}
                >
                  {ch.value}
                </span>
              </span>
              <span
                className={`shrink-0 font-mono text-[10px] tracking-[0.08em] ${
                  sel === i ? 'text-on-orange/80' : 'text-ink-3'
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
