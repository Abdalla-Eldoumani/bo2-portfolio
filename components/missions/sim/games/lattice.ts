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
  LATTICE · DOMAIN COLLAPSE — constraint propagation as a race. Each
  variable holds a domain of candidate values; eliminate every value its
  constraint forbids. A domain down to one value locks as a singleton,
  and all-different marks that value teal in every other row — the
  propagation chain the solver runs to fixpoint. Eliminating a value
  that belongs in the solution is a conflict: the row backjumps whole.
  Clear the grid before the search clock forces a backtrack.
*/

const VALUES = [1, 2, 3, 4];
const NAMES = ['X', 'Y', 'Z', 'W'];

type Row = {
  name: string;
  sol: number;
  banned: number[]; // values the row constraint eliminates
  gone: boolean[]; // per value index: eliminated
  locked: boolean;
};

export function domainCollapse(fx: Fx, veteran = false): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 5, step: 4, maxMult: 3 });
  const s = {
    rows: [] as Row[],
    cur: { r: 0, c: 0 },
    clock: 0,
    clockMax: 11,
    pts: 0,
    eliminations: 0,
    propagations: 0,
    singletons: 0,
    fixpoints: 0,
    conflicts: 0,
    gridConflict: false,
    cleanGrids: 0,
    grid: 0,
  };

  const shuffle = <T,>(xs: T[]): T[] => [...xs].sort(() => Math.random() - 0.5);

  const newGrid = () => {
    s.grid += 1;
    const nRows = s.grid >= 3 ? 4 : 3;
    const sols = shuffle(VALUES).slice(0, nRows);
    // Lock order: the first row's constraint is a unit domain; each later
    // row leans on all-diff from the rows before it.
    const order = shuffle(Array.from({ length: nRows }, (_, i) => i));
    const rows: Row[] = sols.map((sol, i) => ({
      name: NAMES[i],
      sol,
      banned: [],
      gone: VALUES.map(() => false),
      locked: false,
    }));
    order.forEach((rowIdx, k) => {
      const row = rows[rowIdx];
      const others = VALUES.filter((v) => v !== row.sol);
      // Values covered by all-diff: solutions of rows earlier in the chain.
      const viaAllDiff = order.slice(0, k).map((j) => rows[j].sol);
      row.banned = others.filter((v) => !viaAllDiff.includes(v));
    });
    s.rows = rows;
    s.cur = { r: 0, c: 0 };
    // veteran mode runs the search clock about 25% shorter
    s.clockMax = Math.max(6.5, 11 - (s.grid - 1)) * (veteran ? 0.75 : 1);
    s.clock = s.clockMax;
    s.gridConflict = false;
    if (s.grid > 1) {
      fx.announce(`GRID ${s.grid}`, nRows === 4 ? 'FOUR VARIABLES — PURE PROPAGATION ROW' : undefined);
    }
  };
  newGrid();

  const allDiffMarked = (row: Row, v: number) =>
    !row.banned.includes(v) &&
    v !== row.sol &&
    s.rows.some((o) => o !== row && o.locked && o.sol === v);

  const tryLock = (row: Row) => {
    const left = VALUES.filter((_, i) => !row.gone[i]);
    if (left.length === 1 && !row.locked) {
      row.locked = true;
      s.singletons += 1;
      s.pts += 2;
      fx.combo.add();
      const y = rowY(s.rows.indexOf(row));
      fx.text(W / 2, y - 14, 'SINGLETON +2', { color: GREEN });
      fx.burst(chipX(VALUES.indexOf(left[0])), y, { color: GREEN, n: 9, speed: 130 });
      evs.push({ kind: 'streak', label: 'SINGLETON', value: s.singletons });
      if (s.rows.every((r) => r.locked)) {
        s.pts += 5;
        s.fixpoints += 1;
        if (!s.gridConflict) s.cleanGrids += 1;
        fx.freeze();
        fx.announce('FIXPOINT', 'GRID SOLVED — NEXT ONE IS TIGHTER');
        evs.push({ kind: 'milestone', label: 'FIXPOINT' });
        newGrid();
      }
    }
  };

  const eliminate = (r: number, c: number) => {
    const row = s.rows[r];
    if (!row || row.locked || row.gone[c]) return;
    const v = VALUES[c];
    const y = rowY(r);
    if (v === row.sol) {
      // conflict: backjump restores the whole row
      s.conflicts += 1;
      s.gridConflict = true;
      s.pts = Math.max(0, s.pts - 2);
      row.gone = VALUES.map(() => false);
      const broken = fx.combo.break();
      if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
      fx.shake(3.5);
      fx.freeze();
      fx.burst(chipX(c), y, { color: RED, n: 14, speed: 170 });
      fx.text(W / 2, y - 14, 'CONFLICT — BACKJUMP', { color: RED });
      evs.push({ kind: 'hazard', label: 'CONFLICT' });
      return;
    }
    row.gone[c] = true;
    if (allDiffMarked(row, v)) {
      s.propagations += 1;
      s.pts += 2;
      fx.combo.add();
      fx.text(chipX(c), y - 16, 'PROPAGATED +2', { color: TEAL });
      fx.burst(chipX(c), y, { color: TEAL, n: 7, speed: 110 });
      evs.push({ kind: 'perfect', label: 'PROPAGATED' });
    } else {
      s.eliminations += 1;
      s.pts += 1;
      fx.combo.add();
      fx.text(chipX(c), y - 16, '+1', { color: OC });
      fx.burst(chipX(c), y, { color: OC, n: 5, speed: 90 });
    }
    tryLock(row);
  };

  const rowY = (r: number) => 96 + r * (s.rows.length === 4 ? 58 : 72);
  const chipX = (c: number) => 400 + c * 66;

  const constraintLabel = (row: Row) =>
    row.banned.length === 0 ? 'ALL-DIFF' : row.banned.map((v) => `≠${v}`).join(' ');

  return {
    update(dt, input) {
      s.clock -= dt;
      if (s.clock <= 0) {
        // the search clock moved on without a fixpoint
        const broken = fx.combo.break();
        if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
        fx.shake(2.5);
        fx.announce('BACKTRACK', 'SEARCH MOVED ON — FRESH GRID');
        evs.push({ kind: 'hazard', label: 'BACKTRACK' });
        newGrid();
        return;
      }
      if (input.pressed.includes('ArrowLeft')) s.cur.c = (s.cur.c + 3) % 4;
      if (input.pressed.includes('ArrowRight')) s.cur.c = (s.cur.c + 1) % 4;
      if (input.pressed.includes('ArrowUp'))
        s.cur.r = (s.cur.r + s.rows.length - 1) % s.rows.length;
      if (input.pressed.includes('ArrowDown')) s.cur.r = (s.cur.r + 1) % s.rows.length;
      if (input.pressed.includes('Enter')) eliminate(s.cur.r, s.cur.c);
      if (input.tap) {
        for (let r = 0; r < s.rows.length; r++) {
          const y = rowY(r);
          if (Math.abs(input.tap.y - y) < 26) {
            for (let c = 0; c < 4; c++) {
              if (Math.abs(input.tap.x - chipX(c)) < 30) {
                s.cur = { r, c };
                eliminate(r, c);
                return;
              }
            }
          }
        }
      }
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);

      // search clock
      const frac = Math.max(0, s.clock / s.clockMax);
      mono(ctx, 9);
      ctx.fillStyle = frac < 0.25 ? RED : INK3;
      ctx.fillText('SEARCH CLOCK', 16, 52);
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.fillRect(110, 46, 180, 4);
      ctx.fillStyle = frac < 0.25 ? RED : OC;
      ctx.fillRect(110, 46, 180 * frac, 4);
      mono(ctx, 9);
      ctx.fillStyle = INK3;
      ctx.fillText(`GRID ${s.grid}`, 310, 52);

      s.rows.forEach((row, r) => {
        const y = rowY(r);
        display(ctx, 22);
        ctx.fillStyle = row.locked ? GREEN : INK;
        ctx.fillText(row.name, 30, y + 8);
        mono(ctx, 11);
        ctx.fillStyle = row.banned.length === 0 ? TEAL : INK2;
        ctx.fillText(constraintLabel(row), 64, y + 5);

        VALUES.forEach((v, c) => {
          const x = chipX(c);
          const gone = row.gone[c];
          const isCursor = s.cur.r === r && s.cur.c === c && !row.locked;
          const marked = !gone && !row.locked && allDiffMarked(row, v);
          const isLockVal = row.locked && !gone;
          ctx.fillStyle = gone ? 'rgba(255,255,255,0.04)' : isLockVal ? GREEN : BASE;
          ctx.fillRect(x - 22, y - 18, 44, 36);
          ctx.strokeStyle = isCursor ? OH : marked ? TEAL : gone ? 'rgba(255,255,255,0.08)' : FR;
          ctx.lineWidth = isCursor ? 2.5 : 1.5;
          ctx.strokeRect(x - 22, y - 18, 44, 36);
          display(ctx, 20);
          ctx.fillStyle = gone ? INK3 : isLockVal ? SHADOW : INK;
          ctx.fillText(String(v), x - 5, y + 8);
          if (gone) {
            ctx.strokeStyle = INK3;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(x - 12, y - 8);
            ctx.lineTo(x + 12, y + 8);
            ctx.stroke();
          }
          if (marked) {
            mono(ctx, 8);
            ctx.fillStyle = TEAL;
            ctx.fillText('≠LOCKED', x - 18, y + 30);
          }
        });
      });

      mono(ctx, 10);
      ctx.fillStyle = INK3;
      ctx.fillText('ELIMINATE WHAT THE CONSTRAINT FORBIDS — SPARE THE SOLUTION', 16, H - 18);
    },

    score: () => s.pts,
    hud: () =>
      `FIXPOINTS ${s.fixpoints} · ELIMINATED ${s.eliminations + s.propagations} · CONFLICTS ${s.conflicts}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => ({
      display: [
        { label: 'FIXPOINTS', value: String(s.fixpoints) },
        { label: 'ELIMINATIONS', value: String(s.eliminations + s.propagations) },
        { label: 'ALL-DIFF CHAINS', value: String(s.propagations) },
        { label: 'CONFLICTS', value: String(s.conflicts) },
      ],
      tallies: {
        fixpoints: s.fixpoints,
        eliminations: s.eliminations + s.propagations,
        propagations: s.propagations,
        singletons: s.singletons,
        conflicts: s.conflicts,
        cleanGrids: s.cleanGrids,
        bestStreak: fx.combo.best,
      },
    }),
  };
}
