'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { navigation, lobbyItem } from '@/lib/data/navigation';
import { sfxBack, sfxSelect } from '@/lib/sfx';

/*
  Full-screen navigation overlay (the mobile ☰ MENU, per handoff: "☰ opens
  the section menu as a full-screen filled-bar list"). A native <dialog> so
  focus trapping, ESC-to-close and the top layer come free. Rows reuse the
  site-wide menu-row selection language; the current screen carries the
  filled bar.
*/

export function NavOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const items = [lobbyItem, ...navigation];

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={() => {
        sfxBack();
        onClose();
      }}
      aria-label="Screen menu"
      className="m-0 h-dvh max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-scene-shadow/80"
    >
      <div className="scene-interior flex h-full w-full flex-col justify-center gap-1 px-4 py-16">
        <div className="mb-4 flex items-center gap-3 px-1">
          <span aria-hidden="true" className="h-[3px] w-7 bg-orange-fill" />
          <span className="font-mono text-[11px] tracking-[0.18em] text-orange-core">
            SELECT DESTINATION
          </span>
        </div>
        {items.map((item, i) => {
          const current = pathname === item.href;
          return (
            <button
              key={item.id}
              type="button"
              data-current={current || undefined}
              className="menu-row tap-target flex items-center justify-between px-4 py-3 text-left font-display text-[21px] font-bold uppercase"
              onClick={() => {
                sfxSelect();
                onClose();
                if (!current) router.push(item.href);
              }}
            >
              <span>{item.label}</span>
              <span
                className={`font-mono text-[9px] ${current ? '' : 'text-ink-3'}`}
              >
                {String(i).padStart(2, '0')}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            sfxBack();
            onClose();
          }}
          className="mt-6 self-center font-label text-[13px] font-semibold tracking-[0.05em] text-ink-2"
        >
          <span className="keycap mr-2 text-ink">ESC</span>CLOSE
        </button>
      </div>
    </dialog>
  );
}
