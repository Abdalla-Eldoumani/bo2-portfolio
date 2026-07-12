'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createGame,
  SIM_META,
  SIM_W,
  SIM_H,
  type Game,
  type SimInput,
} from '@/components/missions/sim/games';

/*
  FIELD SIM harness — the combat-training modal. Owns the 20-second clock,
  the ready/running/debrief lifecycle, input collection (keys + pointer)
  and the HUD chrome; the games only update and draw. Native <dialog>, so
  ESC closes and focus is trapped for free. Session best per sim is kept in
  sessionStorage. The sim only ever runs after an explicit user start
  (user-initiated motion, so reduced-motion visitors opt in by playing).
*/

const ROUND_S = 20;

type Phase = 'ready' | 'running' | 'debrief';

function rank(slug: string, score: number): string {
  const bands: Record<string, [number, number]> = {
    peregrine: [8, 14],
    aeos: [8, 14],
    'aarch64-playground': [10, 18],
    qala: [10, 16],
    'rust-http-server': [30, 55],
    dossier: [8, 14],
    dust: [3, 6],
    'budget-buddy': [10, 30],
  };
  const [good, elite] = bands[slug] ?? [10, 20];
  if (score >= elite) return 'RANK: PRESTIGE';
  if (score >= good) return 'RANK: VETERAN';
  if (score > 0) return 'RANK: RECRUIT';
  return 'RANK: FNG';
}

export function FieldSim({
  slug,
  name,
  open,
  onClose,
}: {
  slug: string;
  name: string;
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const phaseRef = useRef<Phase>('ready');
  const [phase, setPhaseState] = useState<Phase>('ready');
  const [finalScore, setFinalScore] = useState(0);
  const [best, setBest] = useState(0);
  const timeRef = useRef(0);
  const keysRef = useRef<string[]>([]);
  const heldRef = useRef(false);
  const tapRef = useRef<{ x: number; y: number } | null>(null);

  const meta = SIM_META[slug];

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  // dialog open/close sync
  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    let raf = 0;
    if (open && !d.open) {
      d.showModal();
      d.focus();
      timeRef.current = 0;
      gameRef.current = null;
      // Deferred: state writes happen outside the effect body proper.
      raf = requestAnimationFrame(() => {
        setPhase('ready');
        try {
          setBest(Number(sessionStorage.getItem(`sim-${slug}`) ?? 0));
        } catch {
          setBest(0);
        }
      });
    }
    if (!open && d.open) d.close();
    return () => cancelAnimationFrame(raf);
  }, [open, slug, setPhase]);

  const start = useCallback(() => {
    gameRef.current = createGame(slug);
    timeRef.current = 0;
    setPhase('running');
  }, [slug, setPhase]);

  // Input listeners live on WINDOW while the sim is open: showModal() can
  // leave focus on <body>, so dialog-scoped listeners would miss keys. The
  // global chrome and screen handlers already stand down when any dialog is
  // open, so there is no double-handling.
  useEffect(() => {
    if (!open) return;
    const d = dialogRef.current;
    if (!d) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return; // native close
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === ' ') {
        heldRef.current = true;
        return;
      }
      if (phaseRef.current !== 'running') {
        if (e.key === 'Enter') {
          if (phaseRef.current === 'ready') start();
          else if (phaseRef.current === 'debrief') start();
        }
        return;
      }
      if (!e.repeat) keysRef.current.push(e.key);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') heldRef.current = false;
    };
    const onPointerDown = (e: PointerEvent) => {
      heldRef.current = true;
      const canvas = canvasRef.current;
      if (canvas && phaseRef.current === 'running') {
        const r = canvas.getBoundingClientRect();
        if (
          e.clientX >= r.left && e.clientX <= r.right &&
          e.clientY >= r.top && e.clientY <= r.bottom
        ) {
          tapRef.current = {
            x: ((e.clientX - r.left) / r.width) * SIM_W,
            y: ((e.clientY - r.top) / r.height) * SIM_H,
          };
        }
      }
    };
    const onPointerUp = () => {
      heldRef.current = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    d.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      d.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [open, start]);

  // game loop
  useEffect(() => {
    if (!open) return;
    let raf = 0;
    let last = performance.now();

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      if (phaseRef.current === 'running' && gameRef.current) {
        timeRef.current += dt;
        const input: SimInput = {
          held: heldRef.current,
          pressed: keysRef.current,
          tap: tapRef.current,
        };
        gameRef.current.update(dt, input);
        keysRef.current = [];
        tapRef.current = null;

        if (timeRef.current >= ROUND_S) {
          const score = gameRef.current.score();
          setFinalScore(score);
          try {
            const prev = Number(sessionStorage.getItem(`sim-${slug}`) ?? 0);
            if (score > prev) {
              sessionStorage.setItem(`sim-${slug}`, String(score));
              setBest(score);
            } else {
              setBest(prev);
            }
          } catch {
            setBest((b) => Math.max(b, score));
          }
          setPhase('debrief');
        }
      }

      // draw
      if (gameRef.current && phaseRef.current !== 'ready') {
        gameRef.current.draw(ctx);
      } else {
        ctx.fillStyle = '#0a0f13';
        ctx.fillRect(0, 0, SIM_W, SIM_H);
      }

      // HUD overlay on canvas (timer)
      if (phaseRef.current === 'running' && gameRef.current) {
        const remain = Math.max(0, ROUND_S - timeRef.current);
        ctx.font = 'bold 22px Agdasima, sans-serif';
        ctx.fillStyle = remain < 5 ? '#b03a30' : '#eef3f5';
        ctx.fillText(`0:${String(Math.ceil(remain)).padStart(2, '0')}`, SIM_W - 64, 30);
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#9db0ba';
        ctx.fillText(gameRef.current.hud(), 16, 24);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [open, slug, setPhase]);

  if (!meta) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={`Field sim: ${meta.title}`}
      className="panel panel-floating m-auto w-[min(94vw,780px)] bg-transparent p-0 backdrop:bg-scene-shadow/85"
    >
      <div className="panel-header">
        <span>FIELD SIM — {meta.title}</span>
        <span>{name.toUpperCase()}</span>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          width={SIM_W}
          height={SIM_H}
          className="block w-full touch-none select-none"
          style={{ aspectRatio: `${SIM_W} / ${SIM_H}` }}
        />

        {phase !== 'running' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-scene-shadow/80 px-8 text-center">
            {phase === 'ready' ? (
              <>
                <p className="max-w-[46ch] text-[14px] leading-relaxed text-ink-2">
                  {meta.brief}
                </p>
                <p className="font-mono text-[11px] tracking-[0.08em] text-ink-3">
                  {meta.controls}
                </p>
                <button
                  type="button"
                  onClick={start}
                  className="confirm-punch mt-2 bg-orange-fill px-6 py-2 font-display text-[19px] font-bold uppercase text-on-orange"
                  style={{ boxShadow: '0 0 24px rgba(255,150,0,0.35)' }}
                >
                  Start Sim ▸
                </button>
                <p className="font-mono text-[10px] text-ink-3">20 SECONDS ON THE CLOCK</p>
              </>
            ) : (
              <>
                <p className="font-mono text-[11px] tracking-[0.16em] text-ink-3">
                  SIM COMPLETE
                </p>
                <p className="font-display text-[44px] font-bold leading-none text-orange-core">
                  {finalScore}
                </p>
                <p className="font-mono text-[11px] tracking-[0.1em] text-ink-2">
                  {rank(slug, finalScore)} · SESSION BEST {best}
                </p>
                <div className="mt-2 flex gap-2.5">
                  <button
                    type="button"
                    onClick={start}
                    className="confirm-punch bg-orange-fill px-5 py-1.5 font-display text-[17px] font-bold uppercase text-on-orange"
                  >
                    Run It Back
                  </button>
                  <button
                    type="button"
                    onClick={() => dialogRef.current?.close()}
                    className="confirm-punch border border-white/[0.32] px-5 py-1.5 font-display text-[17px] font-bold uppercase text-ink-menu hover:border-orange-frame hover:text-orange-core"
                  >
                    Exit
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-white/[0.08] px-3.5 py-1.5 font-mono text-[10px] text-ink-3">
        <span>{meta.controls}</span>
        <span>ESC EXIT</span>
      </div>
    </dialog>
  );
}
