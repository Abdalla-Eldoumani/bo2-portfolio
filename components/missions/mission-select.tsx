'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { projects } from '@/lib/data/projects';
import { FieldSim } from '@/components/missions/sim/field-sim';
import { sfxClose, sfxMove, sfxOpen } from '@/lib/sfx';

/*
  Mission Select — pre-game lobby map-select. Map cards in a 3-col grid
  drive the MISSION BRIEF rail; on small screens the brief expands inline
  under the selected card. Teal is legal ONLY on this screen.

  Fully keyboard-driven: ↑↓ moves the op selection (wrapping), ↵ launches
  the selected op's FIELD SIM — a 20-second mini-game symbolizing the
  project. Deep links (/missions?op=slug) pre-select an op (the lobby
  carousel routes here). Mouse and touch keep full parity.
*/

// Flavor map-names, one per op (presentational only).
const MAP_NAMES: Record<string, string> = {
  Peregrine: 'FALCON RIDGE',
  AEOS: 'BARE METAL',
  'AArch64 Playground': 'PROVING GROUND',
  Qala: 'THE FORGE',
  'Rust HTTP Server': 'SERVER HALL',
  Dossier: 'ARCHIVE VAULT',
  DUST: 'RUINED NET',
  'Budget Buddy': 'TRADING FLOOR',
};

function MapArt({
  project,
  large = false,
}: {
  project: (typeof projects)[number];
  large?: boolean;
}) {
  const h = large ? 'h-[150px]' : 'h-[104px]';
  if (!project.image) {
    return (
      <div
        className={`hatch ${h} flex items-center justify-center border-b border-white/10`}
      >
        <span className="px-3 text-center font-mono text-[10px] tracking-[0.08em] text-ink-3">
          [ {MAP_NAMES[project.name] ?? 'OP'} — AWAITING VISUAL FEED ]
        </span>
      </div>
    );
  }
  return (
    <div className={`relative ${h} overflow-hidden border-b border-white/10`}>
      <Image
        src={project.image}
        alt=""
        fill
        sizes={large ? '440px' : '(max-width: 1024px) 50vw, 300px'}
        className="object-cover"
      />
      <span
        className="absolute bottom-0 left-0 px-2 py-0.5 font-mono text-[8.5px] tracking-[0.14em] text-ink-2"
        style={{ background: 'rgba(8,12,15,0.72)' }}
      >
        {MAP_NAMES[project.name] ?? 'OP'}
      </span>
    </div>
  );
}

function Brief({
  project,
  onSim,
}: {
  project: (typeof projects)[number];
  onSim: () => void;
}) {
  const live = project.live && project.live !== '#' ? project.live : null;
  const source = project.github && project.github !== '#' ? project.github : null;
  const chunks = (project.metrics ?? '')
    .split(/\s*·\s*|,\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div>
      <MapArt project={project} large />
      <div className="p-4">
        <div className="font-display text-[26px] font-bold uppercase leading-none text-ink">
          {project.name}
        </div>
        <div className="mt-1.5 font-mono text-[10px] tracking-[0.14em] text-teal">
          OP CLASSIFICATION: {(project.category ?? 'general').toUpperCase()}
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
          {project.description}
        </p>

        {chunks.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {chunks.map((c) => (
              <div key={c} className="max-w-[150px]">
                <div className="font-display text-[20px] font-bold uppercase leading-tight text-orange-core">
                  {c.split(' ')[0]}
                </div>
                <div className="font-label text-[10.5px] font-semibold tracking-[0.08em] text-ink-3">
                  {c.split(' ').slice(1).join(' ').toUpperCase() || 'VERIFIED'}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.tech.slice(0, 6).map((t) => (
            <span
              key={t}
              className="border border-white/[0.14] px-2 py-0.5 font-label text-[10.5px] font-semibold tracking-[0.06em] text-ink-2"
            >
              {t.toUpperCase()}
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={onSim}
            className="confirm-punch bg-orange-fill px-4 py-1.5 font-display text-[17px] font-bold uppercase text-on-orange"
            style={{ boxShadow: '0 0 24px rgba(255,150,0,0.38)' }}
          >
            Run Field Sim ▸
          </button>
          {live ? (
            <a
              href={live}
              target="_blank"
              rel="noreferrer"
              className="confirm-punch border border-orange-frame px-4 py-1.5 font-display text-[17px] font-bold uppercase text-orange-core hover:bg-orange-fill hover:text-on-orange"
            >
              Deploy
            </a>
          ) : (
            <span
              aria-disabled="true"
              className="border border-white/[0.14] px-4 py-1.5 font-display text-[17px] font-bold uppercase text-ink-3"
            >
              No Deployment
            </span>
          )}
          {source && (
            <a
              href={source}
              target="_blank"
              rel="noreferrer"
              className="confirm-punch border border-white/[0.32] px-4 py-1.5 font-display text-[17px] font-bold uppercase text-ink-menu hover:border-orange-frame hover:text-orange-core"
            >
              Source
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function MissionSelect() {
  const params = useSearchParams();
  const initial = Math.max(
    0,
    projects.findIndex((p) => p.slug === params.get('op')),
  );
  const [selected, setSelected] = useState(initial);
  const [simOpen, setSimOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const selRef = useRef(initial);
  const simRef = useRef(false);
  const current = projects[selected];

  useEffect(() => {
    selRef.current = selected;
  }, [selected]);
  const openSim = useCallback(() => {
    sfxOpen();
    setSimOpen(true);
  }, []);
  useEffect(() => {
    simRef.current = simOpen;
  }, [simOpen]);

  // ↑↓ move the op selection; ↵ runs the selected op's field sim. The open
  // sim dialog owns its own keys (its handler stops propagation).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (simRef.current) return;
      if (document.querySelector('dialog[open]')) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const delta = e.key === 'ArrowDown' ? 1 : -1;
        const next = (selRef.current + delta + projects.length) % projects.length;
        setSelected(next);
        sfxMove();
        gridRef.current
          ?.querySelectorAll('[role="option"]')
          [next]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        return;
      }
      if (e.key === 'Enter') {
        const el = document.activeElement as HTMLElement | null;
        if (el && (el.tagName === 'A' || el.tagName === 'BUTTON')) return;
        openSim();
      }
    };
    const onAction = (e: Event) => {
      if ((e as CustomEvent).detail === 'fieldsim') openSim();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('bo2-action', onAction);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('bo2-action', onAction);
    };
  }, [openSim]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_444px]">
      {/* Map grid */}
      <div
        ref={gridRef}
        role="listbox"
        aria-label="Deployed operations"
        className="grid grid-cols-1 content-start gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {projects.map((p, i) => {
          const isSel = i === selected;
          return (
            <div key={p.name} className="rise" style={{ '--i': Math.min(i, 8) } as React.CSSProperties}>
              <button
                type="button"
                role="option"
                aria-selected={isSel}
                data-selected={isSel || undefined}
                title={isSel ? 'Run field sim' : `Select ${p.name}`}
                onClick={() => {
                  // First click selects the op; clicking the selected card
                  // again launches its field sim (the game's double-tap).
                  if (isSel) {
                    openSim();
                  } else {
                    sfxMove();
                    setSelected(i);
                  }
                }}
                className={`tile confirm-punch block w-full text-left ${
                  isSel ? 'corner-tick' : ''
                }`}
              >
                <MapArt project={p} />
                <div className="px-3 py-2">
                  <div
                    className={`truncate font-display text-[16px] font-bold uppercase leading-tight ${
                      isSel ? 'glow-text text-orange-core' : 'text-ink-menu'
                    }`}
                  >
                    {p.name}
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="font-mono text-[9px] tracking-[0.12em] text-teal">
                      {(p.category ?? 'general').toUpperCase()}
                    </span>
                    <span className="truncate font-mono text-[9px] text-ink-3">
                      {p.metrics?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </button>

              {/* Inline brief on small screens */}
              {isSel && (
                <div className="panel panel-floating mt-3 lg:hidden">
                  <div className="panel-header">
                    <span>MISSION BRIEF</span>
                    <span>
                      {String(i + 1).padStart(2, '0')}/{projects.length}
                    </span>
                  </div>
                  <Brief project={current} onSim={openSim} />
                </div>
              )}
            </div>
          );
        })}

        {/* Empty slot */}
        <div
          aria-hidden="true"
          className="hidden min-h-[150px] items-center justify-center border border-dashed border-white/[0.14] sm:flex"
        >
          <span className="font-mono text-[10px] tracking-[0.1em] text-ink-3">
            NEXT OP IN DEVELOPMENT
          </span>
        </div>
      </div>

      {/* Brief rail (desktop) */}
      <aside className="rise hidden self-start lg:block" style={{ '--i': 2 } as React.CSSProperties}>
        <div className="panel panel-floating">
          <div className="panel-header">
            <span>MISSION BRIEF</span>
            <span>
              {String(selected + 1).padStart(2, '0')}/{projects.length}
            </span>
          </div>
          <Brief project={current} onSim={openSim} />
        </div>
      </aside>

      <FieldSim
        slug={current.slug}
        name={current.name}
        open={simOpen}
        onClose={() => {
          sfxClose();
          setSimOpen(false);
        }}
      />
    </div>
  );
}
