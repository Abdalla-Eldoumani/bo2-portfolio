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
import {
  createFx,
  INK2,
  OC,
  OH,
  RED,
  type Fx,
} from '@/components/missions/sim/fx';
import {
  sfxComboBreak,
  sfxEnd,
  sfxHazard,
  sfxMilestone,
  sfxNear,
  sfxPerfect,
  sfxScore,
  sfxSelect,
} from '@/lib/sfx';

/*
  FIELD SIM harness — the combat-training modal. Owns the 20-second clock,
  the ready/running/debrief lifecycle, input collection (keys + pointer)
  and the HUD chrome; the games only update and draw. Native <dialog>, so
  ESC closes and focus is trapped for free. Session best per sim is kept in
  sessionStorage. The sim only ever runs after an explicit user start
  (user-initiated motion, so reduced-motion visitors opt in by playing).
*/

type Phase = 'ready' | 'running' | 'debrief';

function rank(slug: string, score: number): string {
  const [good, elite] = SIM_META[slug]?.bands ?? [10, 20];
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
  const scoreRef = useRef(0);
  const noiseRef = useRef<HTMLCanvasElement | null>(null);
  const patternRef = useRef<CanvasPattern | null>(null);
  const stillRef = useRef(false);
  const fxRef = useRef<Fx | null>(null);
  // Per-round event tallies (kind and kind:label counts) for the meta-layer.
  const tallyRef = useRef<Record<string, number>>({});

  const meta = SIM_META[slug];

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  // CRT noise texture: one sparse speckle tile, generated once. The draw
  // loop tiles it at a random offset every frame for live film grain;
  // reduced motion pins the offset so the grain is a still texture.
  useEffect(() => {
    stillRef.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (noiseRef.current) return;
    const tile = document.createElement('canvas');
    tile.width = 160;
    tile.height = 90;
    const tctx = tile.getContext('2d');
    if (!tctx) return;
    const img = tctx.createImageData(160, 90);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = Math.random() < 0.45 ? 255 : 0;
    }
    tctx.putImageData(img, 0, 0);
    noiseRef.current = tile;
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
    const fx = createFx(() => stillRef.current);
    fxRef.current = fx;
    gameRef.current = createGame(slug, fx);
    timeRef.current = 0;
    scoreRef.current = 0;
    tallyRef.current = {};
    sfxSelect();
    setPhase('running');
  }, [slug, setPhase]);

  // Input listeners live on WINDOW in the CAPTURE phase while the sim is
  // open: showModal() can leave focus on <body>, and capture guarantees the
  // sim sees every key FIRST and stops game keys dead — nothing outside the
  // window (screen cycling, menu selection, lobby escape) ever reacts to
  // controls meant for the game. Escape is deliberately left untouched so
  // the native dialog close still works (one ESC = leave the sim, and only
  // the sim).
  useEffect(() => {
    if (!open) return;
    const d = dialogRef.current;
    if (!d) return;

    const GAME_KEYS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'Enter'];

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return; // native close, contained to the dialog
      if (GAME_KEYS.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
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

    window.addEventListener('keydown', onKeyDown, { capture: true });
    window.addEventListener('keyup', onKeyUp, { capture: true });
    d.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true });
      window.removeEventListener('keyup', onKeyUp, { capture: true });
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

      const fx = fxRef.current;
      if (phaseRef.current === 'running' && gameRef.current) {
        timeRef.current += dt;
        // Hit-stop gates the game world, never the round clock; a frozen
        // frame keeps its queued inputs so no press lands in the void.
        const gdt = fx ? fx.tick(dt) : dt;
        if (gdt > 0) {
          const input: SimInput = {
            held: heldRef.current,
            pressed: keysRef.current,
            tap: tapRef.current,
          };
          gameRef.current.update(gdt, input);
          keysRef.current = [];
          tapRef.current = null;

          // Medal-worthy moments: tally for the career meta, cue the sfx,
          // and float default combat text when the game supplies a spot.
          const evs = gameRef.current.events?.();
          if (evs) {
            for (const ev of evs) {
              const t = tallyRef.current;
              t[ev.kind] = (t[ev.kind] ?? 0) + 1;
              if (ev.label) {
                const k = `${ev.kind}:${ev.label}`;
                t[k] = (t[k] ?? 0) + 1;
              }
              switch (ev.kind) {
                case 'perfect': sfxPerfect(); break;
                case 'near-miss': sfxNear(); break;
                case 'hazard': sfxHazard(); break;
                case 'combo-break': sfxComboBreak(); break;
                case 'streak':
                case 'milestone': sfxMilestone(); break;
              }
              if (fx && ev.label && ev.x !== undefined && ev.y !== undefined) {
                const color =
                  ev.kind === 'perfect' ? OH
                  : ev.kind === 'hazard' || ev.kind === 'combo-break' ? RED
                  : ev.kind === 'near-miss' ? INK2
                  : OC;
                fx.text(ev.x, ev.y, ev.label, { color });
              }
            }
            evs.length = 0;
          }

          // Score feedback: one tiny blip per point gained.
          const sNow = gameRef.current.score();
          if (sNow > scoreRef.current) sfxScore();
          scoreRef.current = sNow;
        }

        if (timeRef.current >= (SIM_META[slug]?.roundS ?? 20)) {
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
          sfxEnd();
        }
      }

      // draw — camera shake wraps the game world and fx overlays; the HUD
      // and CRT pass stay pinned.
      ctx.save();
      fx?.applyShake(ctx);
      if (gameRef.current && phaseRef.current !== 'ready') {
        gameRef.current.draw(ctx);
        if (fx) {
          fx.update(dt);
          fx.draw(ctx);
        }
      } else {
        ctx.fillStyle = '#0a0f13';
        ctx.fillRect(0, 0, SIM_W, SIM_H);
      }
      ctx.restore();

      // HUD overlay on canvas (timer)
      if (phaseRef.current === 'running' && gameRef.current) {
        const remain = Math.max(0, (SIM_META[slug]?.roundS ?? 20) - timeRef.current);
        ctx.font = 'bold 22px Agdasima, sans-serif';
        ctx.fillStyle = remain < 5 ? '#b03a30' : '#eef3f5';
        ctx.fillText(`0:${String(Math.ceil(remain)).padStart(2, '0')}`, SIM_W - 64, 30);
        ctx.font = '11px "JetBrains Mono", monospace';
        ctx.fillStyle = '#9db0ba';
        ctx.fillText(gameRef.current.hud(), 16, 24);
      }

      // CRT pass: film grain over every frame plus a drifting scanline
      // band while animating; reduced motion keeps the grain still.
      const tile = noiseRef.current;
      if (tile) {
        if (!patternRef.current) {
          patternRef.current = ctx.createPattern(tile, 'repeat');
        }
        const pat = patternRef.current;
        if (pat) {
          const still = stillRef.current;
          ctx.save();
          ctx.globalAlpha = still ? 0.05 : 0.03 + Math.random() * 0.045;
          const ox = still ? 0 : (Math.random() * 160) | 0;
          const oy = still ? 0 : (Math.random() * 90) | 0;
          ctx.translate(-ox, -oy);
          ctx.fillStyle = pat;
          ctx.fillRect(0, 0, SIM_W + 160, SIM_H + 90);
          ctx.restore();
          if (!still) {
            const y = ((now / 24) % (SIM_H + 60)) - 30;
            const band = ctx.createLinearGradient(0, y, 0, y + 26);
            band.addColorStop(0, 'rgba(255,255,255,0)');
            band.addColorStop(0.5, 'rgba(255,255,255,0.05)');
            band.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = band;
            ctx.fillRect(0, y, SIM_W, 26);
          }
        }
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
                <p className="font-mono text-[10px] text-ink-3">
                  {meta.roundS} SECONDS ON THE CLOCK
                </p>
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
