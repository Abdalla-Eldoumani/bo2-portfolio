import {
  type Fx,
  W,
  H,
  INK2,
  INK3,
  OC,
  OH,
  FR,
  GREEN,
  RED,
  HAZE,
  WARM,
  SHADOW,
  mono,
  display,
} from '@/components/missions/sim/fx';
import type {
  Game,
  RoundStats,
  SimEvent,
} from '@/components/missions/sim/contract';

/*
  CREDENCE · POSTERIOR HUNT — a hidden parameter, a stream of noisy
  samples, and your belief band over the axis. Every inference tick
  scores calibration: a tight band that contains the truth pays big, a
  tight band that misses pays nothing and stings. The parameter drifts,
  then jumps regimes entirely — track it like a particle filter and
  never trust a single heavy-tail outlier.
*/

const AXIS_Y = 252;
const X0 = 50;
const X1 = 670;
const BUCKETS = 44;
const DOTS = 48;
const TICK_S = 1.9;

export function posteriorHunt(fx: Fx, veteran = false): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: TICK_S * 2.2, step: 2, maxMult: 3 });

  const dots = Array.from({ length: DOTS }, () => ({ x: 0, y: 0, vy: 0, live: false }));
  const hist = new Array<number>(BUCKETS).fill(0);

  const s = {
    theta: X0 + 120 + Math.random() * (X1 - X0 - 240),
    drift: 0,
    sigma: 28,
    c: (X0 + X1) / 2,
    w: 90,
    t: 0,
    sampleT: 0,
    tickT: TICK_S,
    nextJump: 15,
    lastJumpAt: -99,
    phase: 1,
    pts: 0,
    ticks: 0,
    hits: 0,
    sharpHits: 0,
    resamples: 0,
    reveal: 0,
    revealGood: false,
    revealX: 0,
  };

  const gauss = () => {
    const u = Math.random() || 1e-9;
    const v = Math.random() || 1e-9;
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };

  const spawnSample = () => {
    const slot = dots.find((d) => !d.live);
    if (!slot) return;
    // heavy tail: a slice of samples land far off the true value
    const outlier = Math.random() < (veteran ? 0.2 : 0.12);
    const off = outlier
      ? (Math.random() < 0.5 ? -1 : 1) * (150 + Math.random() * 100)
      : gauss() * s.sigma;
    slot.x = Math.max(X0, Math.min(X1, s.theta + off));
    slot.y = 54;
    slot.vy = 150 + Math.random() * 60;
    slot.live = true;
  };

  const bucketOf = (x: number) =>
    Math.max(0, Math.min(BUCKETS - 1, Math.floor(((x - X0) / (X1 - X0)) * BUCKETS)));

  const tick = () => {
    s.ticks += 1;
    const hit = Math.abs(s.theta - s.c) <= s.w;
    s.reveal = 0.5;
    s.revealX = s.theta;
    s.revealGood = hit;
    if (hit) {
      const pts = Math.max(1, Math.min(6, Math.round(130 / s.w)));
      s.pts += pts;
      s.hits += 1;
      fx.combo.add();
      fx.text(s.c, AXIS_Y - 110, `CALIBRATED +${pts}`, { color: pts >= 4 ? OH : OC });
      fx.burst(s.theta, AXIS_Y, { color: GREEN, n: 8, speed: 120 });
      if (s.w <= 34) {
        s.sharpHits += 1;
        evs.push({ kind: 'perfect', label: 'SHARP' });
      }
      if (s.t - s.lastJumpAt < TICK_S * 2.2) {
        s.resamples += 1;
        evs.push({ kind: 'hazard', label: 'RESAMPLED' });
      }
    } else {
      const broken = fx.combo.break();
      if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
      fx.shake(2.5);
      fx.text(s.c, AXIS_Y - 110, s.w <= 40 ? 'OVERCONFIDENT' : 'MISSED', { color: RED });
      fx.burst(s.theta, AXIS_Y, { color: RED, n: 8, speed: 120 });
    }
  };

  const jump = () => {
    s.theta = X0 + 80 + Math.random() * (X1 - X0 - 160);
    s.sigma = 42;
    s.lastJumpAt = s.t;
    for (let i = 0; i < BUCKETS; i++) hist[i] *= 0.35;
    fx.announce('REGIME SHIFT', 'THE POSTERIOR MOVED — RESAMPLE');
    evs.push({ kind: 'milestone', label: 'REGIME SHIFT' });
    fx.shake(3);
  };

  return {
    update(dt, input) {
      s.t += dt;
      s.reveal = Math.max(0, s.reveal - dt);

      // phases: static → drift → regime jumps
      if (s.phase === 1 && s.t >= 8) {
        s.phase = 2;
        s.drift = (Math.random() < 0.5 ? -1 : 1) * 22;
        fx.announce('DRIFT', 'THE PARAMETER IS MOVING');
        evs.push({ kind: 'milestone', label: 'DRIFT' });
      }
      if (s.t >= s.nextJump) {
        // veteran mode runs hotter: restless regimes, a wider noise floor
        s.nextJump += veteran ? 4.5 + Math.random() * 2 : 6 + Math.random() * 3;
        jump();
      }
      s.sigma = Math.max(veteran ? 30 : 24, s.sigma - dt * 8);
      if (s.phase >= 2) {
        s.theta += s.drift * dt;
        if (s.theta < X0 + 60 || s.theta > X1 - 60) s.drift *= -1;
      }

      // samples
      s.sampleT -= dt;
      if (s.sampleT <= 0) {
        s.sampleT = 0.24;
        spawnSample();
      }
      for (const d of dots) {
        if (!d.live) continue;
        d.y += d.vy * dt;
        if (d.y >= AXIS_Y) {
          d.live = false;
          hist[bucketOf(d.x)] += 1;
        }
      }

      // band control: discrete steps, hold to tighten
      const step = 28;
      if (input.pressed.includes('ArrowLeft')) s.c = Math.max(X0, s.c - step);
      if (input.pressed.includes('ArrowRight')) s.c = Math.min(X1, s.c + step);
      if (input.tap && Math.abs(input.tap.y - AXIS_Y) < 130) {
        s.c = Math.max(X0, Math.min(X1, input.tap.x));
      }
      if (input.held) s.w = Math.max(22, s.w - 62 * dt);
      else s.w = Math.min(110, s.w + 46 * dt);

      // inference ticks
      s.tickT -= dt;
      if (s.tickT <= 0) {
        s.tickT = TICK_S;
        tick();
      }
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);

      // histogram of landed samples
      const bw = (X1 - X0) / BUCKETS;
      const peak = Math.max(4, ...hist);
      for (let i = 0; i < BUCKETS; i++) {
        const h = (hist[i] / peak) * 58;
        ctx.fillStyle = HAZE;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(X0 + i * bw, AXIS_Y - h, bw - 1, h);
      }
      ctx.globalAlpha = 1;

      // axis
      ctx.strokeStyle = INK3;
      ctx.beginPath();
      ctx.moveTo(X0, AXIS_Y);
      ctx.lineTo(X1, AXIS_Y);
      ctx.stroke();
      mono(ctx, 8);
      ctx.fillStyle = INK3;
      for (let v = 0; v <= 10; v++) {
        const x = X0 + ((X1 - X0) * v) / 10;
        ctx.fillRect(x, AXIS_Y, 1, 4);
        ctx.fillText(String(v * 10), x - 6, AXIS_Y + 16);
      }

      // falling samples
      ctx.fillStyle = WARM;
      for (const d of dots) {
        if (!d.live) continue;
        ctx.globalAlpha = 0.8;
        ctx.fillRect(d.x - 1.5, d.y - 1.5, 3, 3);
      }
      ctx.globalAlpha = 1;

      // belief band
      const bx0 = s.c - s.w;
      const bx1 = s.c + s.w;
      ctx.fillStyle = OC;
      ctx.globalAlpha = 0.13;
      ctx.fillRect(bx0, 96, bx1 - bx0, AXIS_Y - 96);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = FR;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx0, 96, bx1 - bx0, AXIS_Y - 96);
      ctx.strokeStyle = OH;
      ctx.beginPath();
      ctx.moveTo(s.c, 96);
      ctx.lineTo(s.c, AXIS_Y);
      ctx.stroke();
      mono(ctx, 9);
      ctx.fillStyle = s.w <= 34 ? OH : INK2;
      ctx.fillText(s.w <= 34 ? 'SHARP BELIEF' : 'BELIEF BAND', bx0, 90);

      // truth reveal on tick
      if (s.reveal > 0) {
        ctx.globalAlpha = Math.min(1, s.reveal * 3);
        ctx.strokeStyle = s.revealGood ? GREEN : RED;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s.revealX, 110);
        ctx.lineTo(s.revealX, AXIS_Y);
        ctx.stroke();
        display(ctx, 15);
        ctx.fillStyle = s.revealGood ? GREEN : RED;
        ctx.fillText('θ', s.revealX - 4, 104);
        ctx.globalAlpha = 1;
      }

      // next-tick meter
      const frac = 1 - s.tickT / TICK_S;
      mono(ctx, 9);
      ctx.fillStyle = INK3;
      ctx.fillText('INFERENCE TICK', W / 2 - 42, H - 52);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(W / 2 - 70, H - 46, 140, 4);
      ctx.fillStyle = frac > 0.8 ? OH : INK3;
      ctx.fillRect(W / 2 - 70, H - 46, 140 * frac, 4);

      mono(ctx, 10);
      ctx.fillStyle = INK3;
      ctx.fillText('TIGHT AND RIGHT PAYS — TIGHT AND WRONG STINGS', W / 2 - 152, H - 20);
    },

    score: () => s.pts,
    hud: () => `TICKS ${s.ticks} · CALIBRATED ${s.hits} · SHARP ${s.sharpHits}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => {
      const cal = s.ticks > 0 ? Math.round((s.hits / s.ticks) * 100) : 0;
      return {
        display: [
          { label: 'INFERENCE TICKS', value: String(s.ticks) },
          { label: 'CALIBRATION', value: `${cal}%` },
          { label: 'SHARP HITS', value: String(s.sharpHits) },
          { label: 'REGIMES TRACKED', value: String(s.resamples) },
        ],
        tallies: {
          ticks: s.ticks,
          hits: s.hits,
          calibration: cal,
          sharpHits: s.sharpHits,
          resamples: s.resamples,
          bestStreak: fx.combo.best,
        },
      };
    },
  };
}
