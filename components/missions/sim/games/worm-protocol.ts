import {
  type Fx,
  W,
  H,
  INK2,
  INK3,
  OC,
  OH,
  OF,
  RED,
  TEAL,
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
  CLASSIFIED · WORM PROTOCOL — the arcade behind the terminal. A worm
  crawls a wrapped network eating data packets; walls do not exist,
  your own tail does. Three lives, a slow-motion pickup and a shrink
  pickup, straight out of the original ARM64 build. Speed only climbs.
*/

const COLS = 30;
const ROWS = 13;
const CELL = 22;
const X0 = (W - COLS * CELL) / 2;
const Y0 = 52;

type Cell = { x: number; y: number };

export function wormProtocol(fx: Fx): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 3.2, step: 3, maxMult: 3 });

  const s = {
    body: [] as Cell[],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    stepT: 0,
    interval: 0.15,
    slowT: 0,
    food: { x: 0, y: 0 },
    power: null as null | { x: number; y: number; kind: 'slow' | 'shrink' },
    pts: 0,
    packets: 0,
    powerUps: 0,
    segfaults: 0,
    lives: 3,
    deadT: 0,
  };

  const occupied = (x: number, y: number) =>
    s.body.some((c) => c.x === x && c.y === y);

  const placeFood = () => {
    for (let tries = 0; tries < 200; tries++) {
      const x = Math.floor(Math.random() * COLS);
      const y = Math.floor(Math.random() * ROWS);
      if (!occupied(x, y) && !(s.power && s.power.x === x && s.power.y === y)) {
        s.food = { x, y };
        return;
      }
    }
  };

  const respawn = () => {
    s.body = [
      { x: 8, y: 6 },
      { x: 7, y: 6 },
      { x: 6, y: 6 },
      { x: 5, y: 6 },
    ];
    s.dir = { x: 1, y: 0 };
    s.nextDir = { x: 1, y: 0 };
  };
  respawn();
  placeFood();

  const cellPx = (c: Cell) => ({
    x: X0 + c.x * CELL,
    y: Y0 + c.y * CELL,
  });

  const die = () => {
    s.segfaults += 1;
    s.lives -= 1;
    const head = cellPx(s.body[0]);
    const broken = fx.combo.break();
    if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
    fx.shake(4);
    fx.freeze(0.08);
    fx.burst(head.x + CELL / 2, head.y + CELL / 2, { color: RED, n: 18, speed: 200 });
    fx.announce('SEGFAULT', s.lives > 0 ? `${s.lives} ${s.lives === 1 ? 'LIFE' : 'LIVES'} LEFT` : 'OUT OF LIVES');
    evs.push({ kind: 'hazard', label: 'SEGFAULT' });
    s.deadT = 0.9;
    if (s.lives > 0) respawn();
  };

  return {
    update(dt, input) {
      if (s.lives <= 0) return; // flatlined: the clock runs out on a corpse
      s.slowT = Math.max(0, s.slowT - dt);
      if (s.deadT > 0) {
        s.deadT -= dt;
        return;
      }

      // steering: arrows, or tap relative to the head (dominant axis)
      const turn = (x: number, y: number) => {
        if (x === -s.dir.x && y === -s.dir.y) return; // no 180s
        s.nextDir = { x, y };
      };
      if (input.pressed.includes('ArrowLeft')) turn(-1, 0);
      if (input.pressed.includes('ArrowRight')) turn(1, 0);
      if (input.pressed.includes('ArrowUp')) turn(0, -1);
      if (input.pressed.includes('ArrowDown')) turn(0, 1);
      if (input.tap) {
        const head = cellPx(s.body[0]);
        const dx = input.tap.x - (head.x + CELL / 2);
        const dy = input.tap.y - (head.y + CELL / 2);
        if (Math.abs(dx) > Math.abs(dy)) turn(Math.sign(dx), 0);
        else if (dy !== 0) turn(0, Math.sign(dy));
      }

      s.stepT += dt;
      const interval = s.interval * (s.slowT > 0 ? 1.45 : 1);
      while (s.stepT >= interval) {
        s.stepT -= interval;
        s.dir = s.nextDir;
        const head = s.body[0];
        // the network wraps: endless mode
        const nx = (head.x + s.dir.x + COLS) % COLS;
        const ny = (head.y + s.dir.y + ROWS) % ROWS;
        if (occupied(nx, ny)) {
          die();
          return;
        }
        s.body.unshift({ x: nx, y: ny });

        if (nx === s.food.x && ny === s.food.y) {
          s.packets += 1;
          fx.combo.add();
          const gained = fx.combo.mult();
          s.pts += gained;
          s.interval = Math.max(0.085, s.interval - 0.0035);
          const p = cellPx(s.body[0]);
          fx.text(p.x + CELL / 2, p.y - 6, `+${gained}`, { color: OC });
          fx.burst(p.x + CELL / 2, p.y + CELL / 2, { color: OC, n: 7, speed: 110 });
          if (s.packets % 10 === 0) {
            evs.push({ kind: 'streak', label: `${s.packets} PACKETS`, value: s.packets });
          }
          // 10% power-up spawn after eating, like the original
          if (!s.power && Math.random() < 0.1) {
            for (let tries = 0; tries < 100; tries++) {
              const x = Math.floor(Math.random() * COLS);
              const y = Math.floor(Math.random() * ROWS);
              if (!occupied(x, y) && !(x === s.food.x && y === s.food.y)) {
                s.power = { x, y, kind: Math.random() < 0.5 ? 'slow' : 'shrink' };
                break;
              }
            }
          }
          placeFood();
        } else if (s.power && nx === s.power.x && ny === s.power.y) {
          s.powerUps += 1;
          s.pts += 2;
          const p = cellPx(s.body[0]);
          if (s.power.kind === 'slow') {
            s.slowT = 3;
            fx.text(p.x + CELL / 2, p.y - 6, 'SLOW-MO', { color: TEAL });
          } else {
            s.body.splice(Math.max(4, s.body.length - 3));
            fx.text(p.x + CELL / 2, p.y - 6, 'SHRINK', { color: WARM });
          }
          fx.burst(p.x + CELL / 2, p.y + CELL / 2, {
            color: s.power.kind === 'slow' ? TEAL : WARM,
            n: 9,
            speed: 120,
          });
          evs.push({ kind: 'perfect', label: s.power.kind === 'slow' ? 'SLOW-MO' : 'SHRINK' });
          s.power = null;
          s.body.pop();
        } else {
          s.body.pop();
        }
      }
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);
      // wrapped-network border: dashed, because it is not a wall
      ctx.strokeStyle = INK3;
      ctx.setLineDash([5, 7]);
      ctx.strokeRect(X0 - 3, Y0 - 3, COLS * CELL + 6, ROWS * CELL + 6);
      ctx.setLineDash([]);

      // food packet
      const f = cellPx(s.food);
      ctx.fillStyle = OF;
      ctx.fillRect(f.x + 4, f.y + 4, CELL - 8, CELL - 8);
      ctx.strokeStyle = OH;
      ctx.strokeRect(f.x + 4, f.y + 4, CELL - 8, CELL - 8);

      // power-up
      if (s.power) {
        const p = cellPx(s.power);
        ctx.fillStyle = s.power.kind === 'slow' ? TEAL : WARM;
        ctx.fillRect(p.x + 5, p.y + 5, CELL - 10, CELL - 10);
        mono(ctx, 11);
        ctx.fillStyle = SHADOW;
        ctx.fillText(s.power.kind === 'slow' ? '~' : '-', p.x + 8, p.y + 15);
      }

      // the worm
      s.body.forEach((c, i) => {
        const p = cellPx(c);
        const head = i === 0;
        ctx.fillStyle = head ? OH : i % 2 === 0 ? OC : OF;
        ctx.globalAlpha = head ? 1 : Math.max(0.45, 1 - i * 0.02);
        ctx.fillRect(p.x + 2, p.y + 2, CELL - 4, CELL - 4);
        ctx.globalAlpha = 1;
        if (head) {
          ctx.fillStyle = SHADOW;
          ctx.fillRect(p.x + CELL / 2 - 2, p.y + CELL / 2 - 2, 4, 4);
        }
      });

      // lives + status
      mono(ctx, 10);
      ctx.fillStyle = INK2;
      ctx.fillText(`LIVES ${'●'.repeat(Math.max(0, s.lives))}${'○'.repeat(3 - Math.max(0, s.lives))}`, 16, H - 14);
      if (s.slowT > 0) {
        ctx.fillStyle = TEAL;
        ctx.fillText('SLOW-MO', 120, H - 14);
      }
      if (s.lives <= 0) {
        display(ctx, 30);
        ctx.fillStyle = RED;
        const msg = 'CORE DUMPED';
        const tw = ctx.measureText(msg).width;
        ctx.fillText(msg, W / 2 - tw / 2, H / 2);
        mono(ctx, 10);
        ctx.fillStyle = INK3;
        ctx.fillText('THE CLOCK RUNS OUT ON A CORPSE', W / 2 - 96, H / 2 + 20);
      }
      mono(ctx, 9);
      ctx.fillStyle = INK3;
      ctx.fillText('THE EDGES WRAP — YOUR TAIL DOES NOT FORGIVE', W - 300, H - 14);
    },

    score: () => s.pts,
    hud: () => `PACKETS ${s.packets} · LENGTH ${s.body.length} · LIVES ${Math.max(0, s.lives)}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => ({
      display: [
        { label: 'PACKETS EATEN', value: String(s.packets) },
        { label: 'FINAL LENGTH', value: String(s.body.length) },
        { label: 'POWER-UPS', value: String(s.powerUps) },
        { label: 'SEGFAULTS', value: String(s.segfaults) },
      ],
      tallies: {
        packets: s.packets,
        length: s.body.length,
        powerUps: s.powerUps,
        segfaults: s.segfaults,
        bestStreak: fx.combo.best,
      },
    }),
  };
}
