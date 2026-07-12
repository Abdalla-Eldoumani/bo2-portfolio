'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import type { Project } from '@/lib/types/project';

/*
  FEATURED OP rotation — the lobby rail cycles through every op like the
  game's featured-playlist card. 6s per op with a progress-tick row; hover
  or focus pauses it; ‹ › step manually; clicking deploys straight into
  Mission Select with that op pre-selected (/missions?op=slug).

  The rotation always runs (a 6s content swap with a 200ms crossfade —
  pausing is one hover/focus away, and the ‹ › steppers give manual
  control); the interval stops while the tab is hidden.
*/

const DWELL_MS = 6000;

export function FeaturedCarousel({
  items,
  children,
}: {
  items: Project[];
  children: React.ReactNode; // the stats strip (server-rendered)
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      if (document.hidden) return;
      setIndex((i) => (i + 1) % items.length);
    }, DWELL_MS);
    return () => window.clearInterval(id);
  }, [paused, items.length]);

  const op = items[index];
  const live = op.live && op.live !== '#';

  const step = (delta: number) =>
    setIndex((i) => (i + delta + items.length) % items.length);

  return (
    <div
      className="panel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="panel-header">
        <span>FEATURED OP</span>
        <span className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous op"
            onClick={() => step(-1)}
            className="confirm-punch px-1 leading-none hover:opacity-70"
          >
            ‹
          </button>
          {String(index + 1).padStart(2, '0')}/
          {String(items.length).padStart(2, '0')}
          <button
            type="button"
            aria-label="Next op"
            onClick={() => step(1)}
            className="confirm-punch px-1 leading-none hover:opacity-70"
          >
            ›
          </button>
        </span>
      </div>

      <button
        type="button"
        aria-label={`Open ${op.name} in Mission Select`}
        onClick={() => router.push(`/missions?op=${op.slug}`)}
        className="confirm-punch block w-full text-left"
      >
        <div className="relative mx-3.5 mt-3 h-[110px] overflow-hidden border border-white/10 lg:h-[138px]">
          {items.map((p, i) =>
            p.image ? (
              <Image
                key={p.slug}
                src={p.image}
                alt=""
                fill
                sizes="392px"
                className="object-cover transition-opacity duration-200"
                style={{ opacity: i === index ? 1 : 0 }}
                priority={i === 0}
              />
            ) : null,
          )}
        </div>

        <div className="px-3.5 pb-2.5 pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate font-display text-[22px] font-bold uppercase leading-none text-ink lg:text-[24px]">
              {op.name}
            </span>
            <span className="shrink-0 font-mono text-[9.5px] tracking-[0.1em] text-orange-core">
              ↵ VIEW OP
            </span>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1 font-mono text-[11px] text-ink-2">
            <span className="text-orange-core">
              {op.tech.slice(0, 3).join(' / ').toUpperCase()}
            </span>
            <span className={live ? 'text-green' : 'text-ink-3'}>
              {live ? '● DEPLOYED' : '● STABLE'}
            </span>
          </div>
          {/* progress ticks */}
          <div className="mt-2.5 flex gap-1" aria-hidden="true">
            {items.map((p, i) => (
              <span
                key={p.slug}
                className="h-[3px] flex-1"
                style={{
                  background:
                    i === index
                      ? 'var(--color-orange-fill)'
                      : 'rgba(255,255,255,0.14)',
                }}
              />
            ))}
          </div>
        </div>
      </button>

      {children}
    </div>
  );
}
