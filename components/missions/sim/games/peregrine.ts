import {
  type Fx,
  W,
  H,
  INK,
  INK3,
  OC,
  OH,
  OF,
  FR,
  GREEN,
  RED,
  SHADOW,
  COOL,
  mono,
} from '@/components/missions/sim/fx';
import type {
  Game,
  RoundStats,
  SimEvent,
} from '@/components/missions/sim/contract';

/*
  PEREGRINE · FALCON DASH — hold to climb, release to dive. The gates are
  ops: the outer ring scores, the small inner ring is a FUSED center worth
  double (the project's fused-chain kernels). Thermals and downdrafts bend
  the flight path, a gate streak charges OVERSPEED (faster world, doubled
  points), and grazing a gate edge reads back as a near miss.
*/

type Gate = { x: number; cy: number; r: number; state: 0 | 1 | 2 | 3 };
type Wind = { x: number; w: number; dir: -1 | 1 };

export function falconDash(fx: Fx, veteran = false): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 3.4, step: 3, maxMult: 4 });
  // veteran mode runs hotter: tighter rings, faster air
  const fusedR = veteran ? 10 : 13;
  const s = {
    y: H / 2,
    vy: 0,
    t: 0,
    pts: 0,
    gates: 0,
    fused: 0,
    misses: 0,
    grazes: 0,
    groundHits: 0,
    boost: 0,
    boostsFired: 0,
    flash: 0,
    next: 1.1,
    windNext: 2.4,
    shear: false,
    gatesArr: [] as Gate[],
    winds: [] as Wind[],
  };
  const ridge = (x: number) =>
    H - 60 - 40 * Math.sin((x + s.t * 140) / 130) - 18 * Math.sin((x + s.t * 140) / 47);

  const gateScored = (g: Gate, fused: boolean) => {
    const boosting = s.boost > 0;
    const base = fused ? 2 : 1;
    const pts = base * (boosting ? 2 : 1);
    s.pts += pts;
    s.gates += 1;
    if (fused) s.fused += 1;
    fx.combo.add();
    fx.text(g.x, g.cy - g.r - 10, `+${pts}`, { color: fused ? OH : OC });
    if (fused) {
      evs.push({ kind: 'perfect', label: 'FUSED' });
      fx.text(g.x, g.cy + 4, 'FUSED', { color: OH, size: 15, big: true });
      fx.freeze(0.05);
      fx.burst(g.x, g.cy, { color: OH, n: 16, speed: 210 });
    } else {
      fx.burst(g.x, g.cy, { color: OC, n: 7, speed: 120 });
    }
    // every 5th link in the chain fires an OVERSPEED window
    if (fx.combo.n % 5 === 0 && s.boost <= 0) {
      s.boost = 4;
      s.boostsFired += 1;
      fx.announce('OVERSPEED', 'POINTS DOUBLED · HOLD THE LINE');
      evs.push({ kind: 'streak', value: fx.combo.n });
    }
  };

  return {
    update(dt, input) {
      s.t += dt;
      const boosting = s.boost > 0;
      s.boost = Math.max(0, s.boost - dt);
      const speed =
        (150 + Math.min(s.t * 15, 170)) * (boosting ? 1.35 : 1) * (veteran ? 1.2 : 1);

      // thermals and downdrafts bend the path while you are inside them
      let windAcc = 0;
      for (const w of s.winds) {
        w.x -= speed * dt;
        if (120 > w.x && 120 < w.x + w.w) windAcc += w.dir * 340;
      }
      while (s.winds.length && s.winds[0].x + s.winds[0].w < -10) s.winds.shift();
      s.windNext -= dt;
      if (s.windNext <= 0) {
        s.windNext = s.shear ? 1.5 + Math.random() * 1.2 : 2.6 + Math.random() * 1.6;
        s.winds.push({
          x: W + 20,
          w: 60 + Math.random() * 55,
          dir: Math.random() < 0.5 ? -1 : 1,
        });
      }
      if (!s.shear && s.t >= 12) {
        s.shear = true;
        fx.announce('WIND SHEAR', 'THERMAL ACTIVITY DOUBLED');
        evs.push({ kind: 'milestone', label: 'SHEAR' });
      }

      s.vy += ((input.held ? -680 : 620) + windAcc) * dt;
      s.vy = Math.max(-280, Math.min(320, s.vy));
      s.y += s.vy * dt;
      if (s.y < 22) { s.y = 22; s.vy = 0; }
      const floor = ridge(120) - 10;
      if (s.y > floor) {
        s.y = floor;
        s.vy = -140;
        s.flash = 0.25;
        s.groundHits += 1;
        fx.shake(4);
        fx.freeze(0.05);
        fx.burst(120, s.y + 6, { color: RED, n: 14, speed: 190, angle: -Math.PI / 2, spread: Math.PI });
        const broken = fx.combo.break();
        if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
        else evs.push({ kind: 'hazard', label: 'TERRAIN' });
      }

      s.next -= dt;
      if (s.next <= 0) {
        s.next = boosting ? 0.85 : 1.0;
        s.gatesArr.push({
          x: W + 30,
          cy: 46 + Math.random() * (H - 165),
          r: veteran ? 27 : 34,
          state: 0,
        });
      }
      for (const g of s.gatesArr) {
        g.x -= speed * dt;
        if (g.state === 0 && g.x <= 120) {
          const dy = Math.abs(s.y - g.cy);
          if (dy < fusedR) {
            g.state = 2;
            gateScored(g, true);
          } else if (dy < g.r) {
            g.state = 1;
            gateScored(g, false);
            if (dy > g.r - 7) {
              s.grazes += 1;
              evs.push({ kind: 'near-miss', label: 'GRAZED', x: 120, y: s.y - 20 });
            }
          } else {
            g.state = 3;
            s.misses += 1;
            const broken = fx.combo.break();
            if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
          }
        }
      }
      while (s.gatesArr.length && s.gatesArr[0].x < -40) s.gatesArr.shift();
      s.flash = Math.max(0, s.flash - dt);
      fx.trail(106, s.y, s.boost > 0 ? OH : INK3, s.boost > 0 ? 2.6 : 1.8);
    },

    draw(ctx) {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#33454f');
      grad.addColorStop(1, SHADOW);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      // wind columns: cool shimmer rises, warm bounce sinks
      for (const w of s.winds) {
        ctx.globalAlpha = 0.09;
        ctx.fillStyle = w.dir < 0 ? COOL : FR;
        ctx.fillRect(w.x, 0, w.w, H);
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = w.dir < 0 ? COOL : FR;
        ctx.lineWidth = 1.5;
        const phase = (s.t * (w.dir < 0 ? -90 : 90)) % 44;
        for (let y = -44; y < H + 44; y += 44) {
          const yy = y + phase;
          const cx = w.x + w.w / 2;
          ctx.beginPath();
          ctx.moveTo(cx - 8, yy + (w.dir < 0 ? 6 : -6));
          ctx.lineTo(cx, yy);
          ctx.lineTo(cx + 8, yy + (w.dir < 0 ? 6 : -6));
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = SHADOW;
      ctx.beginPath();
      ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 16) ctx.lineTo(x, ridge(x));
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = FR;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 16) {
        const yy = ridge(x);
        if (x === 0) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      for (const g of s.gatesArr) {
        const scored = g.state === 1 || g.state === 2;
        ctx.strokeStyle = scored ? GREEN : g.state === 3 ? INK3 : OC;
        ctx.globalAlpha = g.state === 3 ? 0.45 : 1;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(g.x, g.cy, g.r, 0, Math.PI * 2);
        ctx.stroke();
        // the FUSED center: fly the exact middle for double
        ctx.strokeStyle = g.state === 2 ? OH : scored ? GREEN : g.state === 3 ? INK3 : OH;
        ctx.lineWidth = g.state === 2 ? 2.5 : 1.2;
        ctx.beginPath();
        ctx.arc(g.x, g.cy, fusedR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // falcon
      ctx.save();
      ctx.translate(120, s.y);
      ctx.rotate(Math.max(-0.4, Math.min(0.5, s.vy / 420)));
      ctx.fillStyle = s.flash > 0 ? RED : s.boost > 0 ? OH : INK;
      ctx.beginPath();
      ctx.moveTo(17, 0);
      ctx.lineTo(-12, -9);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-12, 9);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // boost charge: five links, filled by the current chain
      const charge = s.boost > 0 ? 5 : fx.combo.n % 5;
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i < charge ? (s.boost > 0 ? OH : OF) : 'rgba(255,255,255,0.13)';
        ctx.fillRect(16 + i * 14, 32, 10, 4);
      }
      if (s.boost > 0) {
        mono(ctx, 10);
        ctx.fillStyle = OH;
        ctx.fillText(`OVERSPEED ${s.boost.toFixed(1)}s`, 16, 48);
      }
    },

    score: () => s.pts,
    hud: () => `GATES ${s.gates}${s.boost > 0 ? ' · OVERSPEED ×2' : ''}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => ({
      display: [
        { label: 'GATES CLEARED', value: String(s.gates) },
        { label: 'FUSED CENTERS', value: String(s.fused) },
        { label: 'BEST CHAIN', value: String(fx.combo.best) },
        { label: 'TERRAIN HITS', value: String(s.groundHits) },
      ],
      tallies: {
        gates: s.gates,
        fused: s.fused,
        bestStreak: fx.combo.best,
        groundHits: s.groundHits,
        misses: s.misses,
        grazes: s.grazes,
        boosts: s.boostsFired,
      },
    }),
  };
}
