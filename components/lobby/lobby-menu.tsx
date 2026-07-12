'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { navigation } from '@/lib/data/navigation';
import { sfxMove, sfxSelect } from '@/lib/sfx';

/*
  The lobby main menu: numbered rows, BO2 selection language. The pointed row
  (mouse hover or arrow-key position) carries the hover strip; pressing Enter
  or clicking fills the row solid orange for one beat, then navigates — the
  game's select-then-commit feel, honest to the ↑↓/↵ hints.

  Rows are real links (keyboard focus and no-JS navigation both work); the
  arrow-key handler moves DOM focus so :focus-visible and the pointed state
  stay one thing.
*/

export function LobbyMenu() {
  const router = useRouter();
  const listRef = useRef<HTMLUListElement>(null);
  const [committed, setCommitted] = useState<string | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const rows = () =>
      Array.from(list.querySelectorAll<HTMLAnchorElement>('a[data-row]'));

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      if (document.querySelector('dialog[open]')) return;
      const items = rows();
      if (items.length === 0) return;
      e.preventDefault();
      const current = items.indexOf(
        document.activeElement as HTMLAnchorElement,
      );
      const next =
        e.key === 'ArrowDown'
          ? (current + 1 + items.length) % items.length
          : current <= 0
            ? items.length - 1
            : current - 1;
      items[next].focus();
      sfxMove();
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <nav aria-label="Main menu" className="w-full lg:max-w-[460px]">
      <ul ref={listRef} className="flex w-full flex-col gap-[3px]">
        {navigation.map((item, i) => {
          const isCommitted = committed === item.id;
          return (
            <li key={item.id} className="rise" style={{ '--i': i + 2 } as React.CSSProperties}>
              <a
                data-row
                href={item.href}
                data-current={isCommitted || undefined}
                className="menu-row tap-target flex items-center justify-between px-4 py-2 font-display text-[21px] font-bold uppercase leading-tight lg:text-[25px]"
                onClick={(e) => {
                  if (isCommitted) return;
                  e.preventDefault();
                  setCommitted(item.id);
                  sfxSelect();
                  // One beat of the filled state (the game's select thunk),
                  // then commit the navigation.
                  window.setTimeout(() => router.push(item.href), 140);
                }}
              >
                <span>{item.label}</span>
                <span
                  className={`font-mono text-[10px] ${
                    isCommitted ? '' : 'text-ink-3'
                  }`}
                >
                  {String(i + 1).padStart(2, '0')}
                  {isCommitted && <span aria-hidden="true"> ▸</span>}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
