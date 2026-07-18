import {
  type Fx,
  W,
  H,
  INK,
  INK2,
  INK3,
  OC,
  OH,
  FR,
  GREEN,
  RED,
  TEAL,
  BASE,
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
  ARM STRING OPS · VECTOR PASS — a sixteen-lane NEON register fills with
  bytes. One press uppercases every lowercase lane at once; the wider
  the pass, the bigger the payoff. Malformed UTF-8 poisons a vector
  pass, so those bytes get the scalar treatment: walk the cursor over,
  fix by hand, then go wide again. Let the buffer overflow and the
  pipeline stalls. Sixty-four bytes a cycle does not wait for you.
*/

const LANES = 16;
const LOWER = 'abcdefghijklmnopqrstuvwxyz';

type Cell = {
  ch: string;
  kind: 'lower' | 'upper' | 'bad';
};

export function vectorPass(fx: Fx, veteran = false): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 4, step: 2, maxMult: 3 });

  const s = {
    buf: [] as Cell[],
    cursor: 0,
    feedT: 0.55,
    pts: 0,
    flipped: 0,
    passes: 0,
    fullVectors: 0,
    faults: 0,
    scalarFixes: 0,
    stalls: 0,
    flash: 0,
    flashGood: true,
  };

  const rand = (n: number) => Math.floor(Math.random() * n);

  const feed = () => {
    if (s.buf.length >= LANES) {
      // overflow: the buffer flushes itself and the pipeline stalls
      s.buf = [];
      s.cursor = 0;
      s.stalls += 1;
      const broken = fx.combo.break();
      if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
      fx.shake(3);
      fx.text(W / 2, 150, 'BUFFER STALL', { color: RED, big: true, size: 16 });
      evs.push({ kind: 'hazard', label: 'STALL' });
      return;
    }
    const badChance = (veteran ? 0.16 : 0.11) + Math.min(0.08, s.passes * 0.006);
    const roll = Math.random();
    const kind: Cell['kind'] =
      roll < badChance ? 'bad' : roll < badChance + 0.12 ? 'upper' : 'lower';
    s.buf.push({
      ch:
        kind === 'bad'
          ? ['C0', 'F8', 'ED', '9F'][rand(4)]
          : kind === 'upper'
            ? LOWER[rand(26)].toUpperCase()
            : LOWER[rand(26)],
      kind,
    });
  };

  const laneX = (k: number) => 44 + k * 40;
  const LANE_Y = 170;

  const neonPass = () => {
    const bad = s.buf.some((c) => c.kind === 'bad');
    s.flash = 0.3;
    if (bad) {
      s.faults += 1;
      s.pts = Math.max(0, s.pts - 3);
      const broken = fx.combo.break();
      if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
      fx.shake(3.5);
      s.flashGood = false;
      fx.text(W / 2, LANE_Y - 40, 'FAULT — MALFORMED BYTE IN VECTOR −3', { color: RED });
      evs.push({ kind: 'hazard', label: 'FAULT' });
      return;
    }
    const flippable = s.buf.filter((c) => c.kind === 'lower').length;
    if (flippable === 0) {
      fx.text(W / 2, LANE_Y - 40, 'NOTHING TO FLIP', { color: INK3, size: 10 });
      return;
    }
    s.passes += 1;
    s.flipped += flippable;
    const gained = flippable * fx.combo.mult();
    s.pts += gained;
    fx.combo.add();
    s.flashGood = true;
    for (const c of s.buf) {
      if (c.kind === 'lower') {
        c.ch = c.ch.toUpperCase();
        c.kind = 'upper';
      }
    }
    fx.freeze();
    fx.text(W / 2, LANE_Y - 44, `NEON PASS ×${flippable} +${gained}`, { color: OH, big: true, size: 16 });
    for (let k = 0; k < s.buf.length; k += 2) {
      fx.burst(laneX(k) + 14, LANE_Y + 16, { color: OC, n: 3, speed: 90 });
    }
    if (flippable >= 12) {
      s.fullVectors += 1;
      s.pts += 5;
      fx.announce('FULL VECTOR', '64 BYTES A CYCLE +5');
      evs.push({ kind: 'perfect', label: 'FULL VECTOR' });
    } else if (flippable >= 8) {
      evs.push({ kind: 'streak', label: 'WIDE PASS', value: flippable });
    }
    // the pass retires the buffer: processed bytes leave the register
    s.buf = s.buf.filter((c) => c.kind === 'bad');
    s.cursor = Math.min(s.cursor, Math.max(0, s.buf.length - 1));
  };

  const scalarFix = (idx: number) => {
    const c = s.buf[idx];
    if (!c) return;
    if (c.kind !== 'bad') {
      fx.text(laneX(idx) + 14, LANE_Y - 16, 'VALID', { color: INK3, size: 9 });
      return;
    }
    s.buf.splice(idx, 1);
    s.cursor = Math.min(s.cursor, Math.max(0, s.buf.length - 1));
    s.scalarFixes += 1;
    s.pts += 1;
    fx.combo.add();
    fx.text(laneX(idx) + 14, LANE_Y - 16, 'SCALAR FIX +1', { color: TEAL });
    fx.burst(laneX(idx) + 14, LANE_Y + 16, { color: TEAL, n: 6, speed: 100 });
  };

  return {
    update(dt, input) {
      s.flash = Math.max(0, s.flash - dt);
      s.feedT -= dt;
      if (s.feedT <= 0) {
        s.feedT = Math.max(veteran ? 0.3 : 0.36, (veteran ? 0.5 : 0.58) - s.flipped * 0.002);
        feed();
      }

      if (input.pressed.includes('ArrowLeft')) s.cursor = Math.max(0, s.cursor - 1);
      if (input.pressed.includes('ArrowRight'))
        s.cursor = Math.min(Math.max(0, s.buf.length - 1), s.cursor + 1);
      if (input.pressed.includes('ArrowDown')) scalarFix(s.cursor);
      if (input.held && !input.cursor) neonPass();
      if (input.pressed.includes('Enter')) neonPass();
      if (input.tap) {
        // tap a lane = scalar fix there; tap below the register = pass
        if (input.tap.y > LANE_Y + 60) {
          neonPass();
        } else {
          const idx = Math.floor((input.tap.x - 44) / 40);
          if (idx >= 0 && idx < s.buf.length) {
            s.cursor = idx;
            scalarFix(idx);
          }
        }
      }
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);

      mono(ctx, 9);
      ctx.fillStyle = INK3;
      ctx.fillText('NEON REGISTER — 16 LANES', 44, LANE_Y - 28);

      for (let k = 0; k < LANES; k++) {
        const x = laneX(k);
        const c = s.buf[k];
        ctx.fillStyle = c ? (c.kind === 'bad' ? RED : c.kind === 'upper' ? BASE : OC) : 'rgba(255,255,255,0.04)';
        ctx.globalAlpha = c && c.kind === 'upper' ? 0.9 : 1;
        ctx.fillRect(x, LANE_Y, 32, 36);
        ctx.globalAlpha = 1;
        ctx.strokeStyle =
          k === s.cursor && s.buf.length > 0
            ? OH
            : s.flash > 0
              ? s.flashGood ? GREEN : RED
              : 'rgba(255,255,255,0.12)';
        ctx.lineWidth = k === s.cursor && s.buf.length > 0 ? 2 : 1;
        ctx.strokeRect(x, LANE_Y, 32, 36);
        if (c) {
          mono(ctx, c.kind === 'bad' ? 11 : 15);
          ctx.fillStyle = c.kind === 'bad' ? INK : c.kind === 'lower' ? SHADOW : INK2;
          ctx.fillText(c.ch, x + (c.kind === 'bad' ? 7 : 11), LANE_Y + 23);
        }
      }
      // fill meter
      const frac = s.buf.length / LANES;
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(44, LANE_Y + 46, LANES * 40 - 8, 4);
      ctx.fillStyle = frac > 0.85 ? RED : frac > 0.6 ? OH : FR;
      ctx.fillRect(44, LANE_Y + 46, (LANES * 40 - 8) * frac, 4);
      mono(ctx, 9);
      ctx.fillStyle = frac > 0.85 ? RED : INK3;
      ctx.fillText(`${s.buf.length}/16${frac > 0.85 ? ' — STALL IMMINENT' : ''}`, 44, LANE_Y + 64);

      display(ctx, 16);
      ctx.fillStyle = OC;
      ctx.fillText('SPACE / TAP DOWN HERE — NEON PASS (ALL LANES AT ONCE)', 130, H - 52);
      mono(ctx, 10);
      ctx.fillStyle = TEAL;
      ctx.fillText('RED BYTES POISON THE PASS — ← → + ↓ / TAP THEM FOR THE SCALAR FIX', 130, H - 28);
    },

    score: () => s.pts,
    hud: () =>
      `FLIPPED ${s.flipped} · PASSES ${s.passes} · FAULTS ${s.faults}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => ({
      display: [
        { label: 'BYTES FLIPPED', value: String(s.flipped) },
        { label: 'FULL VECTORS', value: String(s.fullVectors) },
        { label: 'SCALAR FIXES', value: String(s.scalarFixes) },
        { label: 'FAULTS', value: String(s.faults) },
      ],
      tallies: {
        flipped: s.flipped,
        passes: s.passes,
        fullVectors: s.fullVectors,
        scalarFixes: s.scalarFixes,
        faults: s.faults,
        stalls: s.stalls,
        bestStreak: fx.combo.best,
      },
    }),
  };
}
