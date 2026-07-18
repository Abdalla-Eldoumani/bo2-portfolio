import {
  type Fx,
  W,
  H,
  INK,
  INK2,
  INK3,
  OC,
  OH,
  RED,
  TEAL,
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
  DEADZONE · HORDE PROTOCOL — the assembly horde game, compressed. Your
  weapon fires itself at the nearest walker; your job is the footwork.
  Kills level the weapon up (fire rate, twin shot, pierce), waves keep
  raising the tide, SPACE spends the bomb and ↵ spends the freeze.
  Getting caught stings and breaks the chain — the horde never stops.
*/

const ZMAX = 40;
const BMAX = 28;
const UPGRADES = ['FIRE RATE', 'TWIN SHOT', 'PIERCE', 'LONG RANGE', 'FIRE RATE'] as const;

type Zombie = {
  x: number;
  y: number;
  hp: number;
  brute: boolean;
  live: boolean;
  grazed: number; // cooldown for near-miss credit
};
type Bullet = { x: number; y: number; vx: number; vy: number; pierce: number; live: boolean };

export function hordeProtocol(fx: Fx): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 2.6, step: 6, maxMult: 3 });

  const zombies: Zombie[] = Array.from({ length: ZMAX }, () => ({
    x: 0, y: 0, hp: 1, brute: false, live: false, grazed: 0,
  }));
  const bullets: Bullet[] = Array.from({ length: BMAX }, () => ({
    x: 0, y: 0, vx: 0, vy: 0, pierce: 0, live: false,
  }));

  const s = {
    px: W / 2,
    py: H / 2,
    pts: 0,
    kills: 0,
    wave: 1,
    waveT: 0,
    spawnT: 0.5,
    fireT: 0,
    level: 0,
    hitsTaken: 0,
    invuln: 0,
    bomb: 1,
    bombProgress: 0,
    freeze: 1,
    frozen: 0,
    bombKills: 0,
    lastDx: 1,
    lastDy: 0,
    t: 0,
  };

  const fireInterval = () => {
    const rateUps = UPGRADES.slice(0, s.level).filter((u) => u === 'FIRE RATE').length;
    return Math.max(0.24, 0.62 - rateUps * 0.13);
  };
  const twin = () => s.level >= 2;
  const pierce = () => (s.level >= 3 ? 2 : 0);
  const range = () => (s.level >= 4 ? 260 : 190);

  const spawn = () => {
    const z = zombies.find((v) => !v.live);
    if (!z) return;
    if (Math.random() < 0.55) {
      // intercept spawn: seed the edge the operator is running toward,
      // so kiting a fixed loop walks straight into the next wave
      const ahead = 140;
      const tx = s.px + s.lastDx * ahead + (Math.random() - 0.5) * 160;
      const ty = s.py + s.lastDy * ahead + (Math.random() - 0.5) * 160;
      if (Math.abs(tx - W / 2) / W > Math.abs(ty - H / 2) / H) {
        z.x = tx < W / 2 ? -12 : W + 12;
        z.y = Math.max(0, Math.min(H, ty));
      } else {
        z.x = Math.max(0, Math.min(W, tx));
        z.y = ty < H / 2 ? -12 : H + 12;
      }
    } else {
      const edge = Math.floor(Math.random() * 4);
      z.x = edge === 0 ? -12 : edge === 1 ? W + 12 : Math.random() * W;
      z.y = edge === 2 ? -12 : edge === 3 ? H + 12 : Math.random() * H;
    }
    z.brute = s.wave >= 3 && Math.random() < 0.18;
    z.hp = z.brute ? 3 : 1;
    z.live = true;
    z.grazed = 0;
  };

  const shoot = (angle: number) => {
    const b = bullets.find((v) => !v.live);
    if (!b) return;
    b.x = s.px;
    b.y = s.py;
    b.vx = Math.cos(angle) * 430;
    b.vy = Math.sin(angle) * 430;
    b.pierce = pierce();
    b.live = true;
  };

  const kill = (z: Zombie, viaBomb: boolean) => {
    z.live = false;
    s.kills += 1;
    if (viaBomb) {
      s.bombKills += 1;
      s.pts += 1;
    } else {
      fx.combo.add();
      s.pts += fx.combo.mult();
    }
    fx.burst(z.x, z.y, { color: z.brute ? RED : HAZE, n: z.brute ? 14 : 8, speed: 150 });
    if (!viaBomb && fx.combo.n > 0 && fx.combo.n % 10 === 0) {
      evs.push({ kind: 'streak', value: fx.combo.n, label: `${fx.combo.n} CHAIN`, x: z.x, y: z.y - 14 });
    }
    // weapon xp: every 8 kills levels the build
    if (s.kills % 8 === 0 && s.level < UPGRADES.length) {
      const up = UPGRADES[s.level];
      s.level += 1;
      fx.freeze();
      fx.announce(`LEVEL UP: ${up}`);
      evs.push({ kind: 'milestone', label: up });
    }
    s.bombProgress += 1;
    if (s.bomb === 0 && s.bombProgress >= 15) {
      s.bomb = 1;
      s.bombProgress = 0;
      fx.announce('BOMB ARMED', 'SPACE WHEN IT GETS UGLY');
    }
  };

  return {
    update(dt, input) {
      s.t += dt;
      s.invuln = Math.max(0, s.invuln - dt);
      s.frozen = Math.max(0, s.frozen - dt);

      // waves
      s.waveT += dt;
      if (s.waveT >= 6) {
        s.waveT = 0;
        s.wave += 1;
        s.freeze = 1;
        fx.announce(`WAVE ${s.wave}`, s.wave >= 3 ? 'BRUTES IN THE TIDE' : undefined);
        evs.push({ kind: 'milestone', label: `WAVE ${s.wave}` });
      }
      s.spawnT -= dt;
      if (s.spawnT <= 0) {
        s.spawnT = Math.max(0.2, 0.68 - s.wave * 0.09);
        spawn();
        // late waves come two at a time
        if (s.wave >= 4) spawn();
      }

      // movement: held arrows, or steer toward the held pointer
      let mx = 0;
      let my = 0;
      if (input.down.includes('ArrowLeft')) mx -= 1;
      if (input.down.includes('ArrowRight')) mx += 1;
      if (input.down.includes('ArrowUp')) my -= 1;
      if (input.down.includes('ArrowDown')) my += 1;
      if (mx === 0 && my === 0 && input.cursor) {
        const dx = input.cursor.x - s.px;
        const dy = input.cursor.y - s.py;
        const d = Math.hypot(dx, dy);
        if (d > 10) {
          mx = dx / d;
          my = dy / d;
        }
      }
      const norm = Math.hypot(mx, my) || 1;
      if (mx !== 0 || my !== 0) {
        s.lastDx = mx / norm;
        s.lastDy = my / norm;
      }
      s.px = Math.max(12, Math.min(W - 12, s.px + (mx / norm) * 175 * dt));
      s.py = Math.max(12, Math.min(H - 12, s.py + (my / norm) * 175 * dt));

      // bomb + freeze: space/enter on keys, the ordnance chips on touch
      // (a pointer hold is the steering input, so it never spends the bomb)
      const tapBomb =
        input.tap && input.tap.x < 190 && input.tap.y > H - 42 && input.tap.y <= H - 24;
      const tapFreeze =
        input.tap && input.tap.x < 190 && input.tap.y > H - 24;
      if ((tapBomb || (input.held && !input.cursor)) && s.bomb > 0) {
        s.bomb = 0;
        s.bombProgress = 0;
        fx.shake(4);
        fx.freeze(0.07);
        fx.burst(s.px, s.py, { color: OH, n: 26, speed: 340, ttl: 0.7 });
        for (const z of zombies) if (z.live) kill(z, true);
        fx.announce('BOMB OUT');
        evs.push({ kind: 'hazard', label: 'BOMB OUT' });
      }
      if (
        (tapFreeze || input.pressed.includes('Enter')) &&
        s.freeze > 0 &&
        s.frozen <= 0
      ) {
        s.freeze = 0;
        s.frozen = 1.6;
        fx.announce('FREEZE', 'THE TIDE HOLDS STILL');
        evs.push({ kind: 'hazard', label: 'FREEZE' });
      }

      // auto-fire at the nearest walker in range
      s.fireT -= dt;
      if (s.fireT <= 0) {
        let best: Zombie | null = null;
        let bd = range();
        for (const z of zombies) {
          if (!z.live) continue;
          const d = Math.hypot(z.x - s.px, z.y - s.py);
          if (d < bd) {
            bd = d;
            best = z;
          }
        }
        if (best) {
          s.fireT = fireInterval();
          const a = Math.atan2(best.y - s.py, best.x - s.px);
          shoot(a);
          if (twin()) shoot(a + 0.14);
        }
      }

      // bullets
      for (const b of bullets) {
        if (!b.live) continue;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < -10 || b.x > W + 10 || b.y < -10 || b.y > H + 10) {
          b.live = false;
          continue;
        }
        for (const z of zombies) {
          if (!z.live) continue;
          if (Math.hypot(z.x - b.x, z.y - b.y) < (z.brute ? 13 : 9)) {
            z.hp -= 1;
            fx.trail(b.x, b.y, WARM, 2.5);
            if (z.hp <= 0) kill(z, false);
            if (b.pierce > 0) b.pierce -= 1;
            else b.live = false;
            break;
          }
        }
      }

      // walkers
      const zspeed = (55 + s.wave * 13) * (s.frozen > 0 ? 0 : 1);
      for (const z of zombies) {
        if (!z.live) continue;
        const dx = s.px - z.x;
        const dy = s.py - z.y;
        const d = Math.hypot(dx, dy) || 1;
        z.x += (dx / d) * (z.brute ? zspeed * 0.6 : zspeed) * dt;
        z.y += (dy / d) * (z.brute ? zspeed * 0.6 : zspeed) * dt;
        z.grazed = Math.max(0, z.grazed - dt);
        if (d < 26 && d > 15 && z.grazed <= 0 && s.invuln <= 0) {
          z.grazed = 1.2;
          evs.push({ kind: 'near-miss', label: 'GRAZED', x: s.px, y: s.py - 18 });
        }
        if (d < 14 && s.invuln <= 0) {
          s.invuln = 1.2;
          s.hitsTaken += 1;
          s.pts = Math.max(0, s.pts - 3);
          const broken = fx.combo.break();
          if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
          fx.shake(4);
          fx.freeze();
          fx.burst(s.px, s.py, { color: RED, n: 14, speed: 180 });
          fx.text(s.px, s.py - 22, 'CAUGHT −3', { color: RED });
          evs.push({ kind: 'hazard', label: 'CAUGHT' });
          // knockback so the same walker cannot chain-hit
          z.x -= (dx / d) * 46;
          z.y -= (dy / d) * 46;
        }
      }
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);
      // arena floor grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      for (let x = 40; x < W; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 20; y < H; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }

      // walkers
      for (const z of zombies) {
        if (!z.live) continue;
        const r = z.brute ? 12 : 8;
        ctx.fillStyle = s.frozen > 0 ? TEAL : z.brute ? INK3 : HAZE;
        ctx.fillRect(z.x - r / 2, z.y - r / 2, r, r);
        ctx.fillStyle = RED;
        ctx.fillRect(z.x - 2.5, z.y - 2, 2, 2);
        ctx.fillRect(z.x + 0.5, z.y - 2, 2, 2);
      }

      // bullets
      ctx.fillStyle = WARM;
      for (const b of bullets) {
        if (b.live) ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
      }

      // operator
      const blink = s.invuln > 0 && Math.floor(s.t * 12) % 2 === 0;
      if (!blink) {
        ctx.fillStyle = OC;
        ctx.beginPath();
        ctx.moveTo(s.px, s.py - 8);
        ctx.lineTo(s.px + 7, s.py + 7);
        ctx.lineTo(s.px - 7, s.py + 7);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = OH;
        ctx.stroke();
      }

      // ordnance readout
      mono(ctx, 10);
      ctx.fillStyle = s.bomb > 0 ? OH : INK3;
      ctx.fillText(s.bomb > 0 ? 'BOMB READY (SPACE)' : `BOMB ${s.bombProgress}/15`, 16, H - 30);
      ctx.fillStyle = s.freeze > 0 ? TEAL : INK3;
      ctx.fillText(s.freeze > 0 ? 'FREEZE READY (↵)' : 'FREEZE SPENT', 16, H - 14);
      if (s.level > 0) {
        ctx.fillStyle = INK2;
        ctx.fillText(`BUILD: ${UPGRADES.slice(0, s.level).join(' · ')}`, 190, H - 14);
      }
      display(ctx, 17);
      ctx.fillStyle = INK;
      ctx.fillText(`WAVE ${s.wave}`, W - 96, H - 16);
    },

    score: () => s.pts,
    hud: () => `KILLS ${s.kills} · WAVE ${s.wave} · HITS ${s.hitsTaken}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => ({
      display: [
        { label: 'KILLS', value: String(s.kills) },
        { label: 'WAVES SURVIVED', value: String(s.wave) },
        { label: 'WEAPON LEVEL', value: String(s.level) },
        { label: 'TIMES CAUGHT', value: String(s.hitsTaken) },
      ],
      tallies: {
        kills: s.kills,
        waves: s.wave,
        levelUps: s.level,
        hitsTaken: s.hitsTaken,
        bombKills: s.bombKills,
        bestStreak: fx.combo.best,
      },
    }),
  };
}
