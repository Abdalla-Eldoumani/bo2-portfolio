'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createGame,
  SIM_META,
  SIM_W,
  SIM_H,
  type Game,
  type RoundStats,
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
  sfxMedal,
  sfxMilestone,
  sfxMove,
  sfxNear,
  sfxPerfect,
  sfxRankUp,
  sfxScore,
  sfxSelect,
} from '@/lib/sfx';
import {
  canVeteran,
  canWager,
  contractDoneToday,
  dailyContract,
  enterPrestige,
  loadCareer,
  recordRound,
  wagerStake,
  RANK_CAP_XP,
} from '@/lib/career';
import { RANKS } from '@/lib/data/career';
import type { ContractDef, RoundReport } from '@/lib/types/career';

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
  onNext,
}: {
  slug: string;
  name: string;
  open: boolean;
  onClose: () => void;
  /** Cycle to the next op's sim without leaving the dialog. */
  onNext?: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const phaseRef = useRef<Phase>('ready');
  const [phase, setPhaseState] = useState<Phase>('ready');
  const [finalScore, setFinalScore] = useState(0);
  const [best, setBest] = useState(0);
  const [report, setReport] = useState<RoundReport | null>(null);
  const [roundStats, setRoundStats] = useState<RoundStats | null>(null);
  const [shownScore, setShownScore] = useState(0);
  const [xpAnim, setXpAnim] = useState(false);
  const [prestiged, setPrestiged] = useState(false);
  // Wager match: staked on the ready screen, settled at the debrief.
  const [wagerOn, setWagerOn] = useState(false);
  const [stake, setStake] = useState(0);
  const [contract, setContract] = useState<ContractDef | null>(null);
  const wagerRef = useRef(false);
  useEffect(() => {
    wagerRef.current = wagerOn;
  }, [wagerOn]);
  // Veteran mode: unlocked per sim at its VETERAN band, pays xp at 1.5x.
  const [vetUnlocked, setVetUnlocked] = useState(false);
  const [vetOn, setVetOn] = useState(false);
  const vetRef = useRef(false);
  useEffect(() => {
    vetRef.current = vetOn;
  }, [vetOn]);
  // Mid-round beats: all-time best crossing and the final-five call.
  const bestAllTimeRef = useRef(0);
  const bestCrossedRef = useRef(false);
  const finalFiveRef = useRef(false);
  const onNextRef = useRef(onNext);
  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);
  const timeRef = useRef(0);
  const keysRef = useRef<string[]>([]);
  const heldRef = useRef(false);
  const downRef = useRef<string[]>([]);
  const cursorRef = useRef<{ x: number; y: number } | null>(null);
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

  // Next Sim keeps the dialog open while the slug changes: reset to the
  // new op's ready screen. Deferred a frame (no sync setState in effects).
  useEffect(() => {
    const d = dialogRef.current;
    if (!d?.open) return;
    const raf = requestAnimationFrame(() => {
      gameRef.current = null;
      fxRef.current = null;
      timeRef.current = 0;
      setReport(null);
      setRoundStats(null);
      setPrestiged(false);
      setWagerOn(false);
      setStake(canWager() ? wagerStake() : 0);
      setContract(contractDoneToday() ? null : dailyContract());
      setVetOn(false);
      setVetUnlocked(canVeteran(slug));
      setPhase('ready');
      try {
        setBest(Number(sessionStorage.getItem(`sim-${slug}`) ?? 0));
      } catch {
        setBest(0);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [slug, setPhase]);

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
        setReport(null);
        setRoundStats(null);
        setPrestiged(false);
        setWagerOn(false);
        setStake(canWager() ? wagerStake() : 0);
        setContract(contractDoneToday() ? null : dailyContract());
        setVetOn(false);
        setVetUnlocked(canVeteran(slug));
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
    gameRef.current = createGame(slug, fx, vetRef.current);
    timeRef.current = 0;
    scoreRef.current = 0;
    tallyRef.current = {};
    bestAllTimeRef.current = loadCareer().bests[slug] ?? 0;
    bestCrossedRef.current = false;
    finalFiveRef.current = false;
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
        // W on the ready screen stakes / clears the wager.
        if (
          phaseRef.current === 'ready' &&
          (e.key === 'w' || e.key === 'W') &&
          canWager()
        ) {
          setWagerOn((v) => !v);
          sfxMove();
        }
        // V toggles veteran mode once the sim has been mastered.
        if (
          phaseRef.current === 'ready' &&
          (e.key === 'v' || e.key === 'V') &&
          canVeteran(slug)
        ) {
          setVetOn((v) => !v);
          sfxMove();
        }
        // N from the debrief chains into the next op's sim.
        if (
          phaseRef.current === 'debrief' &&
          (e.key === 'n' || e.key === 'N')
        ) {
          onNextRef.current?.();
        }
        return;
      }
      if (!e.repeat) {
        keysRef.current.push(e.key);
        if (e.key.startsWith('Arrow') && !downRef.current.includes(e.key)) {
          downRef.current.push(e.key);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') heldRef.current = false;
      const i = downRef.current.indexOf(e.key);
      if (i >= 0) downRef.current.splice(i, 1);
    };
    const canvasPoint = (e: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const r = canvas.getBoundingClientRect();
      if (
        e.clientX < r.left || e.clientX > r.right ||
        e.clientY < r.top || e.clientY > r.bottom
      ) {
        return null;
      }
      return {
        x: ((e.clientX - r.left) / r.width) * SIM_W,
        y: ((e.clientY - r.top) / r.height) * SIM_H,
      };
    };
    const onPointerDown = (e: PointerEvent) => {
      heldRef.current = true;
      if (phaseRef.current === 'running') {
        const p = canvasPoint(e);
        if (p) {
          tapRef.current = p;
          cursorRef.current = p;
        }
      }
    };
    const onPointerMove = (e: PointerEvent) => {
      if (heldRef.current && phaseRef.current === 'running') {
        cursorRef.current = canvasPoint(e) ?? cursorRef.current;
      }
    };
    const onPointerUp = () => {
      heldRef.current = false;
      cursorRef.current = null;
    };

    window.addEventListener('keydown', onKeyDown, { capture: true });
    window.addEventListener('keyup', onKeyUp, { capture: true });
    d.addEventListener('pointerdown', onPointerDown);
    d.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true });
      window.removeEventListener('keyup', onKeyUp, { capture: true });
      d.removeEventListener('pointerdown', onPointerDown);
      d.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      downRef.current = [];
      cursorRef.current = null;
    };
  }, [open, slug, start]);

  // Debrief theater: count the score up and fill the XP bar a frame in.
  // Reduced motion lands both instantly.
  useEffect(() => {
    if (phase !== 'debrief') return;
    if (stillRef.current) {
      setShownScore(finalScore);
      setXpAnim(true);
      return;
    }
    setShownScore(0);
    setXpAnim(false);
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / 800);
      setShownScore(Math.round(finalScore * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const raf2 = requestAnimationFrame(() => setXpAnim(true));
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(raf2);
    };
  }, [phase, finalScore]);

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
            down: downRef.current,
            cursor: cursorRef.current,
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

          // Crossing the all-time best is worth calling mid-round.
          if (
            !bestCrossedRef.current &&
            bestAllTimeRef.current > 0 &&
            sNow > bestAllTimeRef.current
          ) {
            bestCrossedRef.current = true;
            fx?.announce('NEW ALL-TIME BEST', `PAST ${bestAllTimeRef.current}`);
            sfxMilestone();
          }
        }

        // The last five seconds get called once, then the clock burns red.
        const remainNow = (SIM_META[slug]?.roundS ?? 20) - timeRef.current;
        if (!finalFiveRef.current && remainNow <= 5) {
          finalFiveRef.current = true;
          fx?.announce('FINAL FIVE');
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
          // Fold the round into the career — the meta-layer's single
          // storage write happens here, at round end.
          const stats = gameRef.current.onRoundEnd?.() ?? {
            display: [],
            tallies: {},
          };
          const rep = recordRound(
            slug,
            score,
            SIM_META[slug]?.bands ?? [10, 20],
            stats.tallies,
            tallyRef.current,
            wagerRef.current,
            vetRef.current,
          );
          setRoundStats(stats);
          setReport(rep);
          setWagerOn(false);
          setPhase('debrief');
          sfxEnd();
          if (rep.rankedUp) sfxRankUp();
          else if (rep.newMedals.length > 0 || rep.contract) sfxMedal();
          if (rep.wager) {
            if (rep.wager.won) sfxMilestone();
            else sfxComboBreak();
          }
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

  // XP bar window: the stretch of ladder the current rank occupies.
  const nextRank = report
    ? RANKS.find((r) => r.level === report.rankAfter.level + 1)
    : undefined;
  const win0 = report ? report.rankAfter.xp : 0;
  const win1 = nextRank ? nextRank.xp : RANK_CAP_XP;
  const xpFrac = (xp: number) =>
    win1 > win0 ? Math.min(1, Math.max(0, (xp - win0) / (win1 - win0))) : 1;
  const xpPct = report
    ? Math.round(xpFrac(xpAnim ? report.xpAfter : Math.max(win0, report.xpBefore)) * 100)
    : 0;

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
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center ${
              phase === 'debrief' ? 'gap-1.5' : 'gap-3'
            } bg-scene-shadow/80 px-8 text-center`}
          >
            {phase === 'ready' ? (
              <>
                <p className="max-w-[46ch] text-[14px] leading-relaxed text-ink-2">
                  {meta.brief}
                </p>
                <p className="font-mono text-[11px] tracking-[0.08em] text-ink-3">
                  {meta.controls}
                </p>
                {contract?.sim === slug && (
                  <p className="max-w-[52ch] font-mono text-[10px] tracking-[0.06em] text-gold">
                    DAILY CONTRACT: {contract.challenge.detail} (+
                    {contract.bounty} XP)
                  </p>
                )}
                <button
                  type="button"
                  onClick={start}
                  className="confirm-punch mt-2 bg-orange-fill px-6 py-2 font-display text-[19px] font-bold uppercase text-on-orange"
                  style={{ boxShadow: '0 0 24px rgba(255,150,0,0.35)' }}
                >
                  Start Sim ▸
                </button>
                <span className="flex flex-wrap items-center justify-center gap-2">
                  {vetUnlocked && (
                    <button
                      type="button"
                      onClick={() => {
                        setVetOn((v) => !v);
                        sfxMove();
                      }}
                      aria-pressed={vetOn}
                      className={`confirm-punch border px-4 py-1 font-mono text-[10px] tracking-[0.08em] ${
                        vetOn
                          ? 'border-orange-frame bg-orange-fill/10 text-orange-hot'
                          : 'border-white/[0.28] text-ink-3 hover:border-orange-frame hover:text-orange-core'
                      }`}
                    >
                      {vetOn
                        ? `VETERAN OP — ${meta.veteran} · XP ×1.5`
                        : `V — VETERAN MODE: ${meta.veteran}`}
                    </button>
                  )}
                  {stake > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setWagerOn((v) => !v);
                        sfxMove();
                      }}
                      aria-pressed={wagerOn}
                      className={`confirm-punch border px-4 py-1 font-mono text-[10px] tracking-[0.08em] ${
                        wagerOn
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-white/[0.28] text-ink-3 hover:border-gold hover:text-gold'
                      }`}
                    >
                      {wagerOn
                        ? `WAGER STAKED — ${stake} XP RIDES ON VETERAN`
                        : `W — WAGER: DOUBLE OR NOTHING (${stake} XP)`}
                    </button>
                  )}
                </span>
                <p className="font-mono text-[10px] text-ink-3">
                  {meta.roundS} SECONDS ON THE CLOCK
                </p>
              </>
            ) : (
              <>
                {report?.rankedUp && (
                  <div aria-hidden="true" className="promo-flash" />
                )}
                <p className="font-mono text-[10px] tracking-[0.16em] text-ink-3">
                  SIM COMPLETE
                </p>
                <p className="font-display text-[38px] font-bold leading-none text-orange-core">
                  {shownScore}
                </p>
                <p className="font-mono text-[10px] tracking-[0.08em] text-ink-2">
                  {report?.veteran ? 'VETERAN OP · ' : ''}
                  {rank(slug, finalScore)} · SESSION BEST {best}
                  {report ? ` · ALL-TIME ${report.allTimeBest}` : ''}
                  {report?.isNewBest ? ' · NEW BEST' : ''}
                </p>

                {roundStats && roundStats.display.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-0.5">
                    {roundStats.display.map((d) => (
                      <span
                        key={d.label}
                        className="font-mono text-[9px] tracking-[0.04em] text-ink-3"
                      >
                        {d.label} <span className="text-ink-menu">{d.value}</span>
                      </span>
                    ))}
                  </div>
                )}

                {report && report.newMedals.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {report.newMedals.map((m) => (
                      <span
                        key={m.id}
                        title={m.description}
                        className="border border-orange-frame px-2 py-0.5 font-label text-[10px] font-semibold tracking-[0.08em] text-orange-hot"
                      >
                        ◈ {m.name}
                      </span>
                    ))}
                  </div>
                )}

                {report && (
                  <div className="w-[min(400px,86%)]">
                    <div className="mb-1 flex items-center justify-between font-mono text-[9px] tracking-[0.06em]">
                      <span className="flex items-center gap-1.5 text-ink-2">
                        <img
                          src={report.rankAfter.emblem}
                          alt=""
                          className="h-4 w-4"
                        />
                        {report.rankAfter.name}
                        {report.prestige > 0 && (
                          <span className="text-gold">P{report.prestige}</span>
                        )}
                      </span>
                      <span className="text-orange-core">
                        +{report.xpGained} XP
                      </span>
                      <span className="text-ink-3">
                        {nextRank ? nextRank.name : 'CAP'}
                      </span>
                    </div>
                    <div className="meter-track h-1.5 w-full">
                      <div
                        className="ease-tac h-full w-full origin-left bg-orange-fill transition-transform duration-[800ms]"
                        style={{ transform: `scaleX(${xpPct / 100})` }}
                      />
                    </div>
                  </div>
                )}

                {report?.rankedUp && (
                  <p className="font-display text-[19px] font-bold uppercase leading-none text-orange-hot">
                    Promoted — {report.rankAfter.name}
                  </p>
                )}
                {report && report.rankAfter.level < report.rankBefore.level && (
                  <p className="font-display text-[17px] font-bold uppercase leading-none text-red">
                    Busted down — {report.rankAfter.name}
                  </p>
                )}

                {report?.wager && (
                  <p
                    className={`font-mono text-[10px] tracking-[0.08em] ${
                      report.wager.won ? 'text-gold' : 'text-red'
                    }`}
                  >
                    {report.wager.won
                      ? `WAGER PAID — +${report.wager.staked} XP`
                      : `HOUSE TAKES IT — −${report.wager.staked} XP`}
                  </p>
                )}
                {report?.contract && (
                  <p className="font-mono text-[10px] tracking-[0.08em] text-gold">
                    DAILY CONTRACT COMPLETE — +{report.contract.bounty} XP
                  </p>
                )}
                {report && report.newChallenges.length > 0 && (
                  <p className="font-mono text-[9px] tracking-[0.06em] text-green">
                    {report.newChallenges
                      .map((c) => `${c.name} ${c.tier.toUpperCase()} COMPLETE`)
                      .join(' · ')}
                  </p>
                )}
                {report?.nextChallenge && (
                  <p className="max-w-[54ch] font-mono text-[9px] tracking-[0.04em] text-ink-3">
                    NEXT: {report.nextChallenge.def.name}{' '}
                    {report.nextChallenge.def.tier.toUpperCase()} —{' '}
                    {report.nextChallenge.def.detail} (
                    {report.nextChallenge.progress}/
                    {report.nextChallenge.def.target})
                  </p>
                )}

                {report?.atCap && !prestiged && (
                  <button
                    type="button"
                    onClick={() => {
                      enterPrestige();
                      setPrestiged(true);
                      sfxRankUp();
                    }}
                    className="confirm-punch border border-gold px-4 py-1 font-display text-[15px] font-bold uppercase text-gold"
                  >
                    Enter Prestige {report.prestige + 1}
                  </button>
                )}
                {prestiged && (
                  <p className="font-display text-[16px] font-bold uppercase text-gold">
                    Prestige earned — ladder reset
                  </p>
                )}

                <div className="mt-1 flex gap-2.5">
                  <button
                    type="button"
                    onClick={start}
                    className="confirm-punch bg-orange-fill px-5 py-1.5 font-display text-[17px] font-bold uppercase text-on-orange"
                  >
                    Run It Back
                  </button>
                  {onNext && (
                    <button
                      type="button"
                      onClick={() => onNextRef.current?.()}
                      className="confirm-punch border border-orange-frame px-5 py-1.5 font-display text-[17px] font-bold uppercase text-orange-core hover:bg-orange-fill hover:text-on-orange"
                    >
                      Next Sim
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => dialogRef.current?.close()}
                    className="confirm-punch border border-white/[0.32] px-5 py-1.5 font-display text-[17px] font-bold uppercase text-ink-menu hover:border-orange-frame hover:text-orange-core"
                  >
                    Exit
                  </button>
                </div>
                <p className="font-mono text-[9px] tracking-[0.08em] text-ink-3">
                  ↵ RUN IT BACK{onNext ? ' · N NEXT SIM' : ''} · ESC EXIT
                </p>
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
