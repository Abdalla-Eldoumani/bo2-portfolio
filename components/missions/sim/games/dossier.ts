import {
  type Fx,
  W,
  H,
  INK3,
  OH,
  OF,
  GREEN,
  RED,
  SHADOW,
  mono,
} from '@/components/missions/sim/fx';
import type {
  Game,
  RoundStats,
  SimEvent,
} from '@/components/missions/sim/contract';

/*
  DOSSIER · REDACTION PASS — the scanner walks the page; stamp every
  SECRET line while the cursor is on it. Ink is a budget: every stamp
  spends it, clean pages refill it. Decoys look secret but come back
  DECLASSIFIED (hollow marker — read before you stamp). From page three
  the dossier splits into two columns behind a faster scanner: ← stamps
  the left column, → the right.
*/

// The paper register (matches the shipped sim's paper prop).
const PAPER = '#e9e6dd';
const PAPER_INK = '#555555';
const SECRET_INK = '#8a4200';
const STAMP = '#111111';

type Line = { kind: 'secret' | 'decoy' | 'plain'; redacted: boolean; declassed: boolean };

const INK_START = 10;
const INK_MAX = 16;

export function redactionPass(fx: Fx, veteran = false): Game {
  const evs: SimEvent[] = [];
  fx.combo.set({ window: 5, step: 3, maxMult: 3 });

  const mkColumn = (rows: number): Line[] => {
    let lines: Line[];
    do {
      lines = Array.from({ length: rows }, () => {
        const r = Math.random();
        const kind: Line['kind'] = r < 0.36 ? 'secret' : r < 0.5 ? 'decoy' : 'plain';
        return { kind, redacted: false, declassed: false };
      });
    } while (lines.filter((l) => l.kind === 'secret').length < 2);
    return lines;
  };

  const s = {
    page: 1,
    cols: [mkColumn(9)] as Line[][],
    cursor: 0,
    speed: 58,
    // veteran mode runs hotter: fast scanner, thin ink
    ink: veteran ? 7 : INK_START,
    pts: 0,
    done: 0,
    leaks: 0,
    decoysHit: 0,
    cleanPages: 0,
    noInk: 0,
    audit: 0, // page-end beat timer
    auditLeaks: 0,
  };

  const split = () => s.cols.length === 2;
  const rows = () => (split() ? 7 : 9);
  const rowH = () => (split() ? 34 : 30);
  const rowY = (i: number) => 58 + i * rowH();
  const colX = (c: number) => (split() ? (c === 0 ? 100 : 375) : 120);
  const colW = () => (split() ? 245 : W - 250);
  const pageEnd = () => rowY(rows() - 1) + rowH() / 2;

  const nextPage = () => {
    for (const col of s.cols) {
      for (const l of col) {
        if (l.kind === 'secret' && !l.redacted) {
          s.leaks += 1;
          s.auditLeaks += 1;
        }
      }
    }
    const clean = s.auditLeaks === 0;
    if (clean) {
      s.cleanPages += 1;
      s.pts += 3;
      s.ink = Math.min(INK_MAX, s.ink + (veteran ? 3 : 4));
      evs.push({ kind: 'perfect', label: 'ZERO LEAKS' });
      fx.announce('ZERO LEAKS', veteran ? '+3 · INK +3' : '+3 · INK +4');
      fx.burst(W / 2, H / 2, { color: GREEN, n: 16, speed: 180 });
    } else {
      s.ink = Math.min(INK_MAX, s.ink + (veteran ? 1 : 2));
      fx.text(W / 2, H / 2, `${s.auditLeaks} LEAKED`, { color: RED, size: 15, big: true });
      const broken = fx.combo.break();
      if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
    }
    s.audit = 0.75;
    s.page += 1;
    s.cursor = 0;
    s.auditLeaks = 0;
    s.speed = Math.min(125, s.speed + 8);
    if (s.page === 3) {
      s.cols = [mkColumn(7), mkColumn(7)];
      fx.announce('SPLIT DOSSIER', '← LEFT COLUMN · → RIGHT COLUMN');
      evs.push({ kind: 'milestone', label: 'SPLIT' });
    } else {
      s.cols = split() ? [mkColumn(7), mkColumn(7)] : [mkColumn(9)];
    }
  };

  const stamp = (c: number) => {
    if (s.audit > 0) return;
    const col = s.cols[Math.min(c, s.cols.length - 1)];
    const row = Math.floor((s.cursor - 14) / rowH());
    if (row < 0 || row >= rows()) return;
    const line = col[row];
    if (line.redacted || line.declassed) return;
    if (s.ink <= 0) {
      s.noInk += 1;
      fx.text(colX(c) + colW() / 2, rowY(row), 'NO INK', { color: RED });
      fx.shake(2);
      return;
    }
    s.ink -= 1;
    const cx = colX(Math.min(c, s.cols.length - 1)) + colW() / 2;
    if (line.kind === 'secret') {
      // a true hit refunds its ink: the budget only bleeds on mistakes
      s.ink += 1;
      line.redacted = true;
      s.done += 1;
      s.pts += 1;
      fx.combo.add();
      const inRow = (s.cursor - 14 - row * rowH()) / rowH();
      fx.text(cx, rowY(row) - 8, '+1', { color: OF });
      fx.burst(cx, rowY(row), { color: STAMP, n: 6, speed: 90, grav: 140 });
      if (inRow > 0.78) {
        evs.push({ kind: 'near-miss', label: 'LAST INCH', x: cx, y: rowY(row) - 26 });
      }
    } else if (line.kind === 'decoy') {
      line.declassed = true;
      s.decoysHit += 1;
      s.pts = Math.max(0, s.pts - 1);
      const broken = fx.combo.break();
      if (broken >= 3) evs.push({ kind: 'combo-break', value: broken });
      evs.push({ kind: 'hazard', label: 'DECOY' });
      fx.text(cx, rowY(row) - 8, 'DECLASSIFIED −1', { color: RED });
      fx.shake(2.5);
    } else {
      fx.text(cx, rowY(row) - 8, 'INK WASTED', { color: RED });
    }
  };

  return {
    update(dt, input) {
      if (s.audit > 0) {
        s.audit = Math.max(0, s.audit - dt);
        return;
      }
      s.cursor += s.speed * (veteran ? 1.25 : 1) * dt;
      if (input.pressed.includes('Enter')) stamp(0);
      if (input.pressed.includes('ArrowLeft')) stamp(0);
      if (input.pressed.includes('ArrowRight')) stamp(split() ? 1 : 0);
      if (input.tap) stamp(split() && input.tap.x > W / 2 ? 1 : 0);
      if (s.cursor > pageEnd() + 12) nextPage();
    },

    draw(ctx) {
      ctx.fillStyle = SHADOW;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = PAPER;
      ctx.fillRect(90, 24, W - 180, H - 60);

      mono(ctx, 12);
      for (let c = 0; c < s.cols.length; c++) {
        const col = s.cols[c];
        const x = colX(c);
        for (let i = 0; i < col.length; i++) {
          const y = rowY(i);
          const line = col[i];
          if (line.redacted) {
            ctx.fillStyle = STAMP;
            ctx.fillRect(x, y - 12, colW(), 18);
          } else if (line.declassed) {
            ctx.strokeStyle = GREEN;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x, y - 12, colW(), 18);
            ctx.fillStyle = GREEN;
            mono(ctx, 10);
            ctx.fillText('DECLASSIFIED 1998', x + 8, y + 1);
            mono(ctx, 12);
          } else {
            const secretish = line.kind !== 'plain';
            ctx.fillStyle = secretish ? SECRET_INK : PAPER_INK;
            // the decoy tell: hollow marker instead of filled
            const label = line.kind === 'secret' ? '■ SECRET // ' : line.kind === 'decoy' ? '□ SECRET // ' : '';
            const bars = '▬'.repeat(split() ? (secretish ? 8 : 13) : secretish ? 18 : 26);
            ctx.fillText(`${label}${bars}`, x, y + 2);
          }
        }
      }

      // scanner cursor
      if (s.audit <= 0) {
        const cy = Math.min(H - 40, 24 + s.cursor);
        ctx.fillStyle = OF;
        ctx.globalAlpha = 0.85;
        ctx.fillRect(90, cy, W - 180, 3);
        ctx.globalAlpha = 1;
      } else {
        mono(ctx, 13);
        ctx.fillStyle = SHADOW;
        ctx.fillText(`PAGE ${s.page - 1} AUDIT COMPLETE`, W / 2 - 76, H / 2 + 40);
      }

      // ink budget
      mono(ctx, 11);
      ctx.fillStyle = INK3;
      ctx.fillText(`PAGE ${s.page}`, 92, H - 16);
      ctx.fillStyle = s.leaks > 0 ? RED : GREEN;
      ctx.fillText(`LEAKS ${s.leaks}`, 170, H - 16);
      ctx.fillStyle = s.ink <= 3 ? RED : s.ink <= 6 ? OH : GREEN;
      ctx.fillText(`INK ${'▮'.repeat(Math.max(0, s.ink))}${'▯'.repeat(Math.max(0, INK_MAX - s.ink))}`, 260, H - 16);
    },

    score: () => s.pts,
    hud: () => `REDACTED ${s.done} · LEAKS ${s.leaks} · INK ${s.ink}`,
    events: () => evs,
    onRoundEnd: (): RoundStats => ({
      display: [
        { label: 'LINES REDACTED', value: String(s.done) },
        { label: 'ZERO-LEAK PAGES', value: String(s.cleanPages) },
        { label: 'LEAKS', value: String(s.leaks) },
        { label: 'DECOYS HIT', value: String(s.decoysHit) },
      ],
      tallies: {
        redacted: s.done,
        leaks: s.leaks,
        decoysHit: s.decoysHit,
        cleanPages: s.cleanPages,
        pages: s.page - 1,
        bestStreak: fx.combo.best,
        inkLeft: s.ink,
      },
    }),
  };
}
