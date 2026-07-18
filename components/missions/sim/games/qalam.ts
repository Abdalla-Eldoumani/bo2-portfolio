import {
  type Fx,
  W,
  H,
  INK,
  INK2,
  INK3,
  OC,
  OH,
  OF,
  FR,
  GREEN,
  RED,
  COOL,
  SHADOW,
  mono,
} from '@/components/missions/sim/fx';
import type {
  Game,
  RoundStats,
  SimEvent,
} from '@/components/missions/sim/contract';

/*
  QALAM · FLOOD FILL — bare-metal painting against the raster. Seed a
  flood fill inside a target region and it spreads on its own; the
  scanline beam sweeps the framebuffer and repaints any region it
  catches half-painted, wiping the fill. A region fully filled locks in
  for good. Time your seed to the beam — the whole framebuffer redraws
  whether you are ready or not, which is exactly life without vsync.
*/

const COLS = 24;
const ROWS = 11;
const CELL = 26;
const X0 = (W - COLS * CELL) / 2;
const Y0 = 56;

type Region = {
  cells: Set<number>; // cell index r * COLS + c
  filled: Set<number>;
  queue: number[];
  locked: boolean;
  wipedThisSweep: boolean;
  x0: number;
  x1: number; // column bounds for beam checks
  r0: number;
  r1: number; // row bounds for the locked outline
};

export function floodFill(fx: Fx, veteran = false): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 9, step: 2, maxMult: 3 });
  const s = {
    regions: [] as Region[],
    cur: { r: 5, c: 11 },
    beam: 0, // in columns, fractional
    beamSpeed: COLS / 7, // columns per second
    // interlaced beam (tier 3), -1 = off; veteran mode interlaces from frame one
    beam2: veteran ? COLS - 1 : -1,
    fillT: 0,
    pts: 0,
    cellsFilled: 0,
    locks: 0,
    wipes: 0,
    beamRaces: 0,
  };

  const idx = (r: number, c: number) => r * COLS + c;
  const colOf = (i: number) => i % COLS;

  const overlapsAny = (cells: Set<number>) => {
    for (const reg of s.regions) {
      for (const c of cells) if (reg.cells.has(c)) return true;
    }
    return false;
  };

  const spawnRegion = () => {
    for (let tries = 0; tries < 30; tries++) {
      const rw = 4 + Math.floor(Math.random() * 4);
      const rh = 3 + Math.floor(Math.random() * 3);
      const rc = Math.floor(Math.random() * (COLS - rw));
      const rr = Math.floor(Math.random() * (ROWS - rh));
      const ellipse = Math.random() < 0.4;
      const cells = new Set<number>();
      for (let r = rr; r < rr + rh; r++) {
        for (let c = rc; c < rc + rw; c++) {
          if (ellipse) {
            const nx = (c - rc + 0.5) / rw - 0.5;
            const ny = (r - rr + 0.5) / rh - 0.5;
            if (nx * nx + ny * ny > 0.25) continue;
          }
          cells.add(idx(r, c));
        }
      }
      if (cells.size < 6 || overlapsAny(cells)) continue;
      let r0 = ROWS;
      let r1 = 0;
      let c0 = COLS;
      let c1 = 0;
      for (const i of cells) {
        const rr2 = Math.floor(i / COLS);
        const cc2 = i % COLS;
        r0 = Math.min(r0, rr2);
        r1 = Math.max(r1, rr2);
        c0 = Math.min(c0, cc2);
        c1 = Math.max(c1, cc2);
      }
      s.regions.push({
        cells,
        filled: new Set(),
        queue: [],
        locked: false,
        wipedThisSweep: false,
        x0: c0,
        x1: c1,
        r0,
        r1,
      });
      return;
    }
  };
  spawnRegion();

  const activeCount = () => s.regions.filter((r) => !r.locked).length;

  const seed = (r: number, c: number) => {
    const i = idx(r, c);
    const reg = s.regions.find((g) => !g.locked && g.cells.has(i));
    if (!reg) {
      fx.text(X0 + c * CELL + CELL / 2, Y0 + r * CELL, 'NO TARGET', { color: INK3, size: 10 });
      return;
    }
    if (!reg.filled.has(i)) {
      reg.filled.add(i);
      reg.queue.push(i);
      s.cellsFilled += 1;
      fx.burst(X0 + c * CELL + CELL / 2, Y0 + r * CELL + CELL / 2, {
        color: OH,
        n: 6,
        speed: 90,
      });
      tryLock(reg);
    }
  };

  const tryLock = (reg: Region) => {
    if (reg.locked || reg.filled.size < reg.cells.size) return;
    reg.locked = true;
    s.locks += 1;
    const gained = Math.ceil(reg.cells.size / 3);
    s.pts += gained;
    fx.combo.add();
    const cx = X0 + ((reg.x0 + reg.x1 + 1) / 2) * CELL;
    const cy = Y0 + 60;
    fx.freeze();
    fx.text(cx, cy, `LOCKED +${gained}`, { color: GREEN, big: true, size: 16 });
    fx.burst(cx, cy + 30, { color: GREEN, n: 14, speed: 150 });
    evs.push({ kind: 'streak', label: 'REGION LOCKED', value: s.locks });
    // raced the beam: locked while a beam was inside the region's columns
    const inBeam = (b: number) => b >= reg.x0 - 1 && b <= reg.x1 + 1;
    if (inBeam(s.beam) || (s.beam2 >= 0 && inBeam(s.beam2))) {
      s.beamRaces += 1;
      s.pts += 2;
      fx.text(cx, cy - 22, 'RACED THE BEAM +2', { color: OH });
      evs.push({ kind: 'perfect', label: 'RACED THE BEAM' });
    }
    if (s.locks === 2) {
      fx.announce('DOUBLE BUFFER', 'TWO REGIONS AT ONCE');
      evs.push({ kind: 'milestone', label: 'DOUBLE BUFFER' });
    }
    if (s.locks === 4 && s.beam2 < 0) {
      s.beam2 = COLS - 1;
      fx.announce('INTERLACED SWEEP', 'A SECOND BEAM, OPPOSITE WAY');
      evs.push({ kind: 'milestone', label: 'INTERLACE' });
    }
    while (activeCount() < (s.locks >= 2 ? 2 : 1)) spawnRegion();
  };

  const beamCross = (colFrac: number) => {
    const col = Math.floor(colFrac);
    if (col < 0 || col >= COLS) return;
    for (const reg of s.regions) {
      if (reg.locked || reg.filled.size === 0 || reg.wipedThisSweep) continue;
      if (col < reg.x0 || col > reg.x1) continue;
      let touched = false;
      for (const i of reg.filled) {
        if (colOf(i) === col) {
          touched = true;
          break;
        }
      }
      if (touched) {
        // the raster caught it half-painted: full repaint
        reg.filled.clear();
        reg.queue.length = 0;
        reg.wipedThisSweep = true;
        s.wipes += 1;
        const broken = fx.combo.break();
        if (broken >= 2) evs.push({ kind: 'combo-break', value: broken });
        fx.shake(2.5);
        const cx = X0 + ((reg.x0 + reg.x1 + 1) / 2) * CELL;
        fx.text(cx, Y0 + 40, 'REPAINTED', { color: RED });
        evs.push({ kind: 'hazard', label: 'REPAINTED' });
      }
    }
  };

  return {
    update(dt, input) {
      // beams
      const prev = s.beam;
      s.beam += s.beamSpeed * dt;
      if (Math.floor(s.beam) !== Math.floor(prev)) beamCross(s.beam);
      if (s.beam >= COLS) {
        s.beam = 0;
        s.beamSpeed = Math.min(COLS / 4.2, s.beamSpeed * 1.06);
        for (const reg of s.regions) reg.wipedThisSweep = false;
      }
      if (s.beam2 >= 0) {
        const prev2 = s.beam2;
        s.beam2 -= s.beamSpeed * 0.8 * dt;
        if (Math.floor(s.beam2) !== Math.floor(prev2)) beamCross(s.beam2);
        if (s.beam2 < 0) s.beam2 = COLS - 1;
      }

      // fill spread: one new cell per tick per region (breadth-first)
      s.fillT += dt * 10;
      while (s.fillT >= 1) {
        s.fillT -= 1;
        for (const reg of s.regions) {
          if (reg.locked) continue;
          while (reg.queue.length > 0) {
            const from = reg.queue[0];
            const r = Math.floor(from / COLS);
            const c = from % COLS;
            let grew = false;
            const neighbors = [
              [r - 1, c],
              [r + 1, c],
              [r, c - 1],
              [r, c + 1],
            ];
            for (const [nr, nc] of neighbors) {
              if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
              const ni = idx(nr, nc);
              if (!reg.cells.has(ni) || reg.filled.has(ni)) continue;
              reg.filled.add(ni);
              reg.queue.push(ni);
              s.cellsFilled += 1;
              grew = true;
              break; // one cell per tick
            }
            if (grew) break;
            reg.queue.shift(); // frontier cell exhausted
          }
          tryLock(reg);
        }
      }

      // cursor + seeding
      if (input.pressed.includes('ArrowLeft')) s.cur.c = (s.cur.c + COLS - 1) % COLS;
      if (input.pressed.includes('ArrowRight')) s.cur.c = (s.cur.c + 1) % COLS;
      if (input.pressed.includes('ArrowUp')) s.cur.r = (s.cur.r + ROWS - 1) % ROWS;
      if (input.pressed.includes('ArrowDown')) s.cur.r = (s.cur.r + 1) % ROWS;
      if (input.pressed.includes('Enter')) seed(s.cur.r, s.cur.c);
      if (input.tap) {
        const c = Math.floor((input.tap.x - X0) / CELL);
        const r = Math.floor((input.tap.y - Y0) / CELL);
        if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
          s.cur = { r, c };
          seed(r, c);
        }
      }
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);

      // framebuffer grid
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(X0 + c * CELL, Y0);
        ctx.lineTo(X0 + c * CELL, Y0 + ROWS * CELL);
        ctx.stroke();
      }
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(X0, Y0 + r * CELL);
        ctx.lineTo(X0 + COLS * CELL, Y0 + r * CELL);
        ctx.stroke();
      }

      // regions
      for (const reg of s.regions) {
        for (const i of reg.cells) {
          const r = Math.floor(i / COLS);
          const c = i % COLS;
          const x = X0 + c * CELL;
          const y = Y0 + r * CELL;
          if (reg.filled.has(i)) {
            ctx.fillStyle = reg.locked ? OF : OC;
            ctx.globalAlpha = reg.locked ? 0.9 : 0.75;
            ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);
            ctx.globalAlpha = 1;
          } else {
            ctx.strokeStyle = reg.locked ? GREEN : FR;
            ctx.globalAlpha = 0.55;
            ctx.strokeRect(x + 1.5, y + 1.5, CELL - 3, CELL - 3);
            ctx.globalAlpha = 1;
          }
        }
        if (reg.locked) {
          ctx.strokeStyle = GREEN;
          ctx.lineWidth = 2;
          ctx.strokeRect(
            X0 + reg.x0 * CELL,
            Y0 + reg.r0 * CELL,
            (reg.x1 - reg.x0 + 1) * CELL,
            (reg.r1 - reg.r0 + 1) * CELL,
          );
          ctx.lineWidth = 1;
        }
      }

      // beams
      const drawBeam = (col: number, dirRight: boolean) => {
        const x = X0 + col * CELL;
        const grad = ctx.createLinearGradient(x + (dirRight ? -34 : 4), 0, x + (dirRight ? 4 : 38), 0);
        grad.addColorStop(dirRight ? 0 : 1, 'rgba(169,193,206,0)');
        grad.addColorStop(dirRight ? 1 : 0, 'rgba(169,193,206,0.22)');
        ctx.fillStyle = grad;
        ctx.fillRect(x - (dirRight ? 34 : -4), Y0, 38, ROWS * CELL);
        ctx.fillStyle = COOL;
        ctx.fillRect(x, Y0, 2.5, ROWS * CELL);
      };
      drawBeam(s.beam, true);
      if (s.beam2 >= 0) drawBeam(s.beam2, false);

      // cursor
      const cx = X0 + s.cur.c * CELL;
      const cy = Y0 + s.cur.r * CELL;
      ctx.strokeStyle = OH;
      ctx.lineWidth = 2;
      ctx.strokeRect(cx, cy, CELL, CELL);
      ctx.lineWidth = 1;
      ctx.fillStyle = INK;
      ctx.fillRect(cx + CELL / 2 - 1.5, cy + CELL / 2 - 1.5, 3, 3);

      mono(ctx, 10);
      ctx.fillStyle = INK3;
      ctx.fillText('FINISH THE REGION BEFORE THE SWEEP REPAINTS IT', 16, H - 14);
      ctx.fillStyle = INK2;
    },

    score: () => s.pts,
    hud: () => `LOCKED ${s.locks} · FILLED ${s.cellsFilled} · REPAINTS ${s.wipes}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => ({
      display: [
        { label: 'REGIONS LOCKED', value: String(s.locks) },
        { label: 'CELLS PAINTED', value: String(s.cellsFilled) },
        { label: 'BEAM RACES', value: String(s.beamRaces) },
        { label: 'REPAINTS', value: String(s.wipes) },
      ],
      tallies: {
        regions: s.locks,
        cellsFilled: s.cellsFilled,
        beamRaces: s.beamRaces,
        wipes: s.wipes,
        bestStreak: fx.combo.best,
      },
    }),
  };
}
